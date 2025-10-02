#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

class FirebaseUserMigration {
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

  transformUserData(firebaseData) {
    const users = []
    
    // Handle different Firebase export structures
    const userCollections = [
      firebaseData.users,
      firebaseData.collections?.users,
      firebaseData.__collections__?.users
    ].filter(Boolean)[0]

    if (!userCollections) {
      this.log('No user collections found in Firebase export')
      return users
    }

    Object.entries(userCollections).forEach(([id, userDoc]) => {
      try {
        const user = {
          id: id,
          email: userDoc.email || userDoc.emailAddress,
          display_name: userDoc.displayName || userDoc.name || userDoc.fullName,
          first_name: userDoc.firstName || userDoc.first_name,
          last_name: userDoc.lastName || userDoc.last_name,
          phone: userDoc.phone || userDoc.phoneNumber,
          photo_url: userDoc.photoURL || userDoc.avatar || userDoc.profilePicture,
          provider: userDoc.provider || 'email',
          email_verified: userDoc.emailVerified || false,
          disabled: userDoc.disabled || false,
          role: userDoc.role || 'user',
          preferences: {
            notifications: userDoc.notifications !== false,
            newsletter: userDoc.newsletter !== false,
            theme: userDoc.theme || 'vegas',
            language: userDoc.language || 'en'
          },
          profile: {
            bio: userDoc.bio || userDoc.description,
            location: userDoc.location,
            website: userDoc.website,
            social: userDoc.social || {}
          },
          subscription: {
            tier: userDoc.subscription?.tier || 'free',
            status: userDoc.subscription?.status || 'active',
            expires_at: this.parseFirebaseTimestamp(userDoc.subscription?.expiresAt)
          },
          stats: {
            bookings: userDoc.bookings?.length || 0,
            total_spent: userDoc.totalSpent || 0,
            last_booking: this.parseFirebaseTimestamp(userDoc.lastBooking)
          },
          created_at: this.parseFirebaseTimestamp(userDoc.created_at || userDoc.createdAt),
          updated_at: this.parseFirebaseTimestamp(userDoc.updated_at || userDoc.updatedAt),
          last_login: this.parseFirebaseTimestamp(userDoc.lastLoginAt || userDoc.lastSignInTime),
          firebase_uid: id,
          migration_timestamp: new Date().toISOString()
        }

        users.push(user)
        
      } catch (error) {
        this.error(`Failed to transform user ${id}`, error)
      }
    })

    this.log(`Transformed ${users.length} users from Firebase data`)
    return users
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

  async generateSQL(users) {
    const sqlStatements = []
    
    // Create users table if not exists
    sqlStatements.push(`
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  firebase_uid VARCHAR(255) UNIQUE,
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  phone VARCHAR(50),
  photo_url TEXT,
  provider VARCHAR(50) DEFAULT 'email',
  email_verified BOOLEAN DEFAULT FALSE,
  disabled BOOLEAN DEFAULT FALSE,
  role VARCHAR(50) DEFAULT 'user',
  preferences JSONB DEFAULT '{}',
  profile JSONB DEFAULT '{}',
  subscription JSONB DEFAULT '{}',
  stats JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  last_login TIMESTAMP WITH TIME ZONE,
  migration_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`)

    // Create indexes
    sqlStatements.push(`
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);`)

    // Insert users
    users.forEach(user => {
      const sql = `
INSERT INTO users (
  firebase_uid, email, display_name, first_name, last_name, 
  phone, photo_url, provider, email_verified, disabled, role,
  preferences, profile, subscription, stats,
  created_at, updated_at, last_login
) VALUES (
  '${user.firebase_uid}',
  '${user.email?.replace(/'/g, "''")}',
  '${user.display_name?.replace(/'/g, "''") || ''}',
  '${user.first_name?.replace(/'/g, "''") || ''}',
  '${user.last_name?.replace(/'/g, "''") || ''}',
  '${user.phone || ''}',
  '${user.photo_url || ''}',
  '${user.provider}',
  ${user.email_verified},
  ${user.disabled},
  '${user.role}',
  '${JSON.stringify(user.preferences).replace(/'/g, "''")}',
  '${JSON.stringify(user.profile).replace(/'/g, "''")}',
  '${JSON.stringify(user.subscription).replace(/'/g, "''")}',
  '${JSON.stringify(user.stats).replace(/'/g, "''")}',
  ${user.created_at ? `'${user.created_at}'` : 'NOW()'},
  ${user.updated_at ? `'${user.updated_at}'` : 'NOW()'},
  ${user.last_login ? `'${user.last_login}'` : 'NULL'}
)
ON CONFLICT (firebase_uid) DO UPDATE SET
  email = EXCLUDED.email,
  display_name = EXCLUDED.display_name,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  phone = EXCLUDED.phone,
  photo_url = EXCLUDED.photo_url,
  provider = EXCLUDED.provider,
  email_verified = EXCLUDED.email_verified,
  disabled = EXCLUDED.disabled,
  role = EXCLUDED.role,
  preferences = EXCLUDED.preferences,
  profile = EXCLUDED.profile,
  subscription = EXCLUDED.subscription,
  stats = EXCLUDED.stats,
  updated_at = EXCLUDED.updated_at,
  last_login = EXCLUDED.last_login;`
      
      sqlStatements.push(sql)
    })

    return sqlStatements
  }

  async saveMigrationFiles(users, sqlStatements) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const outputDir = path.join(__dirname, '..', 'migration-output')
    
    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // Save transformed JSON
    const jsonPath = path.join(outputDir, `users-${timestamp}.json`)
    fs.writeFileSync(jsonPath, JSON.stringify(users, null, 2))
    this.log(`Saved transformed user data to ${jsonPath}`)

    // Save SQL migration
    const sqlPath = path.join(outputDir, `users-migration-${timestamp}.sql`)
    fs.writeFileSync(sqlPath, sqlStatements.join('\n\n'))
    this.log(`Saved SQL migration to ${sqlPath}`)

    // Save migration log
    const logPath = path.join(outputDir, `users-migration-log-${timestamp}.txt`)
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
      this.log('Starting Firebase user migration...')
      
      // Read Firebase export
      const firebaseData = await this.readFirebaseExport(firebaseExportPath)
      
      // Transform user data
      const users = this.transformUserData(firebaseData)
      
      if (users.length === 0) {
        throw new Error('No users found to migrate')
      }
      
      // Generate SQL statements
      const sqlStatements = await this.generateSQL(users)
      
      // Save migration files
      const paths = await this.saveMigrationFiles(users, sqlStatements)
      
      this.log(`Migration completed successfully!`)
      this.log(`Migrated ${users.length} users`)
      this.log(`Generated ${sqlStatements.length} SQL statements`)
      
      return {
        success: true,
        userCount: users.length,
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
    console.log('Usage: node import-firebase-users.js <firebase-export-path>')
    console.log('Example: node import-firebase-users.js ./firebase-export.json')
    process.exit(1)
  }

  const migration = new FirebaseUserMigration()
  migration.migrate(args[0])
    .then(result => {
      if (result.success) {
        console.log('\n✅ Migration completed successfully!')
        console.log(`👥 Migrated ${result.userCount} users`)
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

module.exports = FirebaseUserMigration