#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

class FirebaseSessionMigration {
  constructor() {
    this.migrationLog = []
    this.errors = []
    this.startTime = Date.now()
  }

  log(message) {
    const timestamp = new Date().toISOString()
    const logEntry = `[${timestamp}] ${message}`
    this.migrationLog.push(logEntry)
    console.log(logEntry)
  }

  error(message, error) {
    const timestamp = new Date().toISOString()
    const errorEntry = `[${timestamp}] ERROR: ${message} - ${error?.message || error}`
    this.errors.push(errorEntry)
    console.error(errorEntry)
  }

  async readFirebaseExport(exportPath) {
    try {
      if (!fs.existsSync(exportPath)) {
        throw new Error(`Firebase export file not found: ${exportPath}`)
      }

      const data = JSON.parse(fs.readFileSync(exportPath, 'utf8'))
      this.log(`Successfully read Firebase export from ${exportPath}`)
      return data
    } catch (error) {
      this.error('Failed to read Firebase export', error)
      throw error
    }
  }

  transformSessionData(firebaseData) {
    const sessions = []
    const bookings = []
    const requests = []
    
    // Handle sessions collection
    const sessionCollections = [
      firebaseData.sessions,
      firebaseData.collections?.sessions,
      firebaseData.__collections__?.sessions
    ].filter(Boolean)[0]

    if (sessionCollections) {
      Object.entries(sessionCollections).forEach(([id, sessionDoc]) => {
        try {
          const session = {
            id: id,
            user_id: sessionDoc.userId || sessionDoc.uid,
            session_type: sessionDoc.type || 'chat',
            status: sessionDoc.status || 'active',
            room: sessionDoc.room || 'general',
            data: {
              messages: sessionDoc.messages || [],
              metadata: sessionDoc.metadata || {},
              settings: sessionDoc.settings || {}
            },
            cost_tracking: {
              total_cost: sessionDoc.totalCost || 0,
              request_count: sessionDoc.requestCount || 0,
              avg_cost_per_request: sessionDoc.avgCostPerRequest || 0
            },
            started_at: this.parseFirebaseTimestamp(sessionDoc.startedAt || sessionDoc.created_at),
            ended_at: this.parseFirebaseTimestamp(sessionDoc.endedAt),
            last_activity: this.parseFirebaseTimestamp(sessionDoc.lastActivity || sessionDoc.updated_at),
            firebase_id: id,
            migration_timestamp: new Date().toISOString()
          }

          sessions.push(session)
          
        } catch (error) {
          this.error(`Failed to transform session ${id}`, error)
        }
      })
    }

    // Handle bookings collection
    const bookingCollections = [
      firebaseData.bookings,
      firebaseData.collections?.bookings,
      firebaseData.__collections__?.bookings
    ].filter(Boolean)[0]

    if (bookingCollections) {
      Object.entries(bookingCollections).forEach(([id, bookingDoc]) => {
        try {
          const booking = {
            id: id,
            user_id: bookingDoc.userId || bookingDoc.uid,
            vendor_id: bookingDoc.vendorId,
            service_type: bookingDoc.serviceType || bookingDoc.category,
            status: bookingDoc.status || 'pending',
            amount: parseFloat(bookingDoc.amount || bookingDoc.total || 0),
            currency: bookingDoc.currency || 'USD',
            booking_details: {
              date: this.parseFirebaseTimestamp(bookingDoc.bookingDate || bookingDoc.date),
              location: bookingDoc.location || {},
              notes: bookingDoc.notes || bookingDoc.specialRequests,
              participants: bookingDoc.participants || 1
            },
            payment: {
              method: bookingDoc.paymentMethod || 'pending',
              transaction_id: bookingDoc.transactionId,
              status: bookingDoc.paymentStatus || 'pending'
            },
            created_at: this.parseFirebaseTimestamp(bookingDoc.created_at || bookingDoc.createdAt),
            updated_at: this.parseFirebaseTimestamp(bookingDoc.updated_at || bookingDoc.updatedAt),
            firebase_id: id,
            migration_timestamp: new Date().toISOString()
          }

          bookings.push(booking)
          
        } catch (error) {
          this.error(`Failed to transform booking ${id}`, error)
        }
      })
    }

    // Handle request logs
    const requestCollections = [
      firebaseData.requests,
      firebaseData.request_logs,
      firebaseData.collections?.requests,
      firebaseData.__collections__?.request_logs
    ].filter(Boolean)[0]

    if (requestCollections) {
      Object.entries(requestCollections).forEach(([id, requestDoc]) => {
        try {
          const request = {
            id: id,
            session_id: requestDoc.sessionId,
            user_id: requestDoc.userId || requestDoc.uid,
            endpoint: requestDoc.endpoint || requestDoc.path,
            method: requestDoc.method || 'POST',
            status_code: requestDoc.statusCode || requestDoc.status || 200,
            latency_ms: requestDoc.latency || requestDoc.duration || 0,
            cost: parseFloat(requestDoc.cost || 0),
            tokens: {
              input: requestDoc.inputTokens || requestDoc.tokens?.input || 0,
              output: requestDoc.outputTokens || requestDoc.tokens?.output || 0,
              total: requestDoc.totalTokens || requestDoc.tokens?.total || 0
            },
            model: requestDoc.model || 'gpt-3.5-turbo',
            provider: requestDoc.provider || 'openai',
            request_data: requestDoc.requestData || {},
            response_data: requestDoc.responseData || {},
            error: requestDoc.error,
            created_at: this.parseFirebaseTimestamp(requestDoc.created_at || requestDoc.timestamp),
            firebase_id: id,
            migration_timestamp: new Date().toISOString()
          }

          requests.push(request)
          
        } catch (error) {
          this.error(`Failed to transform request ${id}`, error)
        }
      })
    }

    this.log(`Transformed ${sessions.length} sessions, ${bookings.length} bookings, ${requests.length} requests`)
    return { sessions, bookings, requests }
  }

  parseFirebaseTimestamp(timestamp) {
    if (!timestamp) return null
    
    if (timestamp._seconds) {
      return new Date(timestamp._seconds * 1000).toISOString()
    }
    
    if (typeof timestamp === 'string') {
      return new Date(timestamp).toISOString()
    }
    
    return null
  }

  async generateSQL(data) {
    const sqlStatements = []
    const { sessions, bookings, requests } = data
    
    // Create sessions table
    sqlStatements.push(`
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  firebase_id VARCHAR(255) UNIQUE,
  user_id VARCHAR(255),
  session_type VARCHAR(100) DEFAULT 'chat',
  status VARCHAR(50) DEFAULT 'active',
  room VARCHAR(100) DEFAULT 'general',
  data JSONB DEFAULT '{}',
  cost_tracking JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  last_activity TIMESTAMP WITH TIME ZONE,
  migration_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`)

    // Create bookings table
    sqlStatements.push(`
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  firebase_id VARCHAR(255) UNIQUE,
  user_id VARCHAR(255),
  vendor_id VARCHAR(255),
  service_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  amount DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'USD',
  booking_details JSONB DEFAULT '{}',
  payment JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  migration_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`)

    // Create request_log table
    sqlStatements.push(`
CREATE TABLE IF NOT EXISTS request_log (
  id SERIAL PRIMARY KEY,
  firebase_id VARCHAR(255) UNIQUE,
  session_id VARCHAR(255),
  user_id VARCHAR(255),
  endpoint VARCHAR(255),
  method VARCHAR(10) DEFAULT 'POST',
  status_code INTEGER DEFAULT 200,
  latency_ms INTEGER DEFAULT 0,
  cost DECIMAL(10,6) DEFAULT 0,
  tokens JSONB DEFAULT '{}',
  model VARCHAR(100),
  provider VARCHAR(100),
  request_data JSONB DEFAULT '{}',
  response_data JSONB DEFAULT '{}',
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  migration_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`)

    // Create indexes
    sqlStatements.push(`
CREATE INDEX IF NOT EXISTS idx_sessions_firebase_id ON sessions(firebase_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);

CREATE INDEX IF NOT EXISTS idx_bookings_firebase_id ON bookings(firebase_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);

CREATE INDEX IF NOT EXISTS idx_requests_firebase_id ON request_log(firebase_id);
CREATE INDEX IF NOT EXISTS idx_requests_session_id ON request_log(session_id);
CREATE INDEX IF NOT EXISTS idx_requests_user_id ON request_log(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON request_log(created_at);`)

    // Insert sessions
    sessions.forEach(session => {
      const sql = `
INSERT INTO sessions (
  firebase_id, user_id, session_type, status, room, data, cost_tracking,
  started_at, ended_at, last_activity
) VALUES (
  '${session.firebase_id}',
  '${session.user_id || ''}',
  '${session.session_type}',
  '${session.status}',
  '${session.room}',
  '${JSON.stringify(session.data).replace(/'/g, "''")}',
  '${JSON.stringify(session.cost_tracking).replace(/'/g, "''")}',
  ${session.started_at ? `'${session.started_at}'` : 'NOW()'},
  ${session.ended_at ? `'${session.ended_at}'` : 'NULL'},
  ${session.last_activity ? `'${session.last_activity}'` : 'NOW()'}
)
ON CONFLICT (firebase_id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  session_type = EXCLUDED.session_type,
  status = EXCLUDED.status,
  room = EXCLUDED.room,
  data = EXCLUDED.data,
  cost_tracking = EXCLUDED.cost_tracking,
  ended_at = EXCLUDED.ended_at,
  last_activity = EXCLUDED.last_activity;`
      
      sqlStatements.push(sql)
    })

    // Insert bookings
    bookings.forEach(booking => {
      const sql = `
INSERT INTO bookings (
  firebase_id, user_id, vendor_id, service_type, status, amount, currency,
  booking_details, payment, created_at, updated_at
) VALUES (
  '${booking.firebase_id}',
  '${booking.user_id || ''}',
  '${booking.vendor_id || ''}',
  '${booking.service_type || ''}',
  '${booking.status}',
  ${booking.amount},
  '${booking.currency}',
  '${JSON.stringify(booking.booking_details).replace(/'/g, "''")}',
  '${JSON.stringify(booking.payment).replace(/'/g, "''")}',
  ${booking.created_at ? `'${booking.created_at}'` : 'NOW()'},
  ${booking.updated_at ? `'${booking.updated_at}'` : 'NOW()'}
)
ON CONFLICT (firebase_id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  vendor_id = EXCLUDED.vendor_id,
  service_type = EXCLUDED.service_type,
  status = EXCLUDED.status,
  amount = EXCLUDED.amount,
  currency = EXCLUDED.currency,
  booking_details = EXCLUDED.booking_details,
  payment = EXCLUDED.payment,
  updated_at = EXCLUDED.updated_at;`
      
      sqlStatements.push(sql)
    })

    // Insert requests
    requests.forEach(request => {
      const sql = `
INSERT INTO request_log (
  firebase_id, session_id, user_id, endpoint, method, status_code,
  latency_ms, cost, tokens, model, provider, request_data, response_data,
  error, created_at
) VALUES (
  '${request.firebase_id}',
  '${request.session_id || ''}',
  '${request.user_id || ''}',
  '${request.endpoint}',
  '${request.method}',
  ${request.status_code},
  ${request.latency_ms},
  ${request.cost},
  '${JSON.stringify(request.tokens).replace(/'/g, "''")}',
  '${request.model}',
  '${request.provider}',
  '${JSON.stringify(request.request_data).replace(/'/g, "''")}',
  '${JSON.stringify(request.response_data).replace(/'/g, "''")}',
  ${request.error ? `'${request.error.replace(/'/g, "''")}'` : 'NULL'},
  ${request.created_at ? `'${request.created_at}'` : 'NOW()'}
)
ON CONFLICT (firebase_id) DO UPDATE SET
  session_id = EXCLUDED.session_id,
  user_id = EXCLUDED.user_id,
  endpoint = EXCLUDED.endpoint,
  method = EXCLUDED.method,
  status_code = EXCLUDED.status_code,
  latency_ms = EXCLUDED.latency_ms,
  cost = EXCLUDED.cost,
  tokens = EXCLUDED.tokens,
  model = EXCLUDED.model,
  provider = EXCLUDED.provider,
  request_data = EXCLUDED.request_data,
  response_data = EXCLUDED.response_data,
  error = EXCLUDED.error;`
      
      sqlStatements.push(sql)
    })

    return sqlStatements
  }

  async saveMigrationFiles(data, sqlStatements) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const outputDir = path.join(__dirname, '..', 'migration-output')
    
    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // Save transformed JSON
    const jsonPath = path.join(outputDir, `sessions-data-${timestamp}.json`)
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2))
    this.log(`Saved transformed session data to ${jsonPath}`)

    // Save SQL migration
    const sqlPath = path.join(outputDir, `sessions-migration-${timestamp}.sql`)
    fs.writeFileSync(sqlPath, sqlStatements.join('\n\n'))
    this.log(`Saved SQL migration to ${sqlPath}`)

    // Save migration log
    const logPath = path.join(outputDir, `sessions-migration-log-${timestamp}.txt`)
    const fullLog = [
      ...this.migrationLog,
      '',
      'ERRORS:',
      ...this.errors,
      '',
      `Migration completed in ${Date.now() - this.startTime}ms`
    ].join('\n')
    
    fs.writeFileSync(logPath, fullLog)
    this.log(`Saved migration log to ${logPath}`)

    return { jsonPath, sqlPath, logPath }
  }

  async migrate(firebaseExportPath) {
    try {
      this.log('Starting Firebase session/booking/request migration...')
      
      // Read Firebase export
      const firebaseData = await this.readFirebaseExport(firebaseExportPath)
      
      // Transform data
      const data = this.transformSessionData(firebaseData)
      
      const totalRecords = data.sessions.length + data.bookings.length + data.requests.length
      if (totalRecords === 0) {
        throw new Error('No sessions, bookings, or requests found to migrate')
      }
      
      // Generate SQL statements
      const sqlStatements = await this.generateSQL(data)
      
      // Save migration files
      const paths = await this.saveMigrationFiles(data, sqlStatements)
      
      this.log(`Migration completed successfully!`)
      this.log(`Migrated ${data.sessions.length} sessions`)
      this.log(`Migrated ${data.bookings.length} bookings`)
      this.log(`Migrated ${data.requests.length} requests`)
      this.log(`Generated ${sqlStatements.length} SQL statements`)
      
      return {
        success: true,
        sessionCount: data.sessions.length,
        bookingCount: data.bookings.length,
        requestCount: data.requests.length,
        paths,
        errors: this.errors
      }
      
    } catch (error) {
      this.error('Migration failed', error)
      return {
        success: false,
        error: error.message,
        errors: this.errors
      }
    }
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.log('Usage: node import-firebase-sessions.js <firebase-export-path>')
    console.log('Example: node import-firebase-sessions.js ./firebase-export.json')
    process.exit(1)
  }

  const migration = new FirebaseSessionMigration()
  migration.migrate(args[0])
    .then(result => {
      if (result.success) {
        console.log('\n✅ Migration completed successfully!')
        console.log(`💬 Migrated ${result.sessionCount} sessions`)
        console.log(`📅 Migrated ${result.bookingCount} bookings`)  
        console.log(`📊 Migrated ${result.requestCount} requests`)
        if (result.errors.length > 0) {
          console.log(`⚠️  ${result.errors.length} errors occurred (see log file)`)
        }
      } else {
        console.log('\n❌ Migration failed!')
        console.log(`Error: ${result.error}`)
        process.exit(1)
      }
    })
    .catch(error => {
      console.error('\n💥 Migration crashed!', error)
      process.exit(1)
    })
}

module.exports = FirebaseSessionMigration