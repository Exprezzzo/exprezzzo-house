#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

class FirebaseVendorMigration {
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

  transformVendorData(firebaseData) {
    const vendors = []
    
    // Handle different Firebase export structures
    const vendorCollections = [
      firebaseData.vendors,
      firebaseData.collections?.vendors,
      firebaseData.__collections__?.vendors
    ].filter(Boolean)[0]

    if (!vendorCollections) {
      this.log('No vendor collections found in Firebase export')
      return vendors
    }

    Object.entries(vendorCollections).forEach(([id, vendorDoc]) => {
      try {
        const vendor = {
          id: id,
          name: vendorDoc.name || vendorDoc.business_name || 'Unknown',
          email: vendorDoc.email || vendorDoc.contact_email,
          phone: vendorDoc.phone || vendorDoc.contact_phone,
          category: vendorDoc.category || vendorDoc.service_type || 'general',
          status: vendorDoc.status || 'pending',
          location: {
            city: vendorDoc.city || vendorDoc.location?.city || 'Las Vegas',
            state: vendorDoc.state || vendorDoc.location?.state || 'NV',
            zip: vendorDoc.zip || vendorDoc.location?.zip
          },
          services: vendorDoc.services || [],
          pricing: vendorDoc.pricing || {},
          rating: vendorDoc.rating || 0,
          reviews: vendorDoc.reviews || 0,
          verification_status: vendorDoc.verification_status || 'unverified',
          created_at: this.parseFirebaseTimestamp(vendorDoc.created_at || vendorDoc.createdAt),
          updated_at: this.parseFirebaseTimestamp(vendorDoc.updated_at || vendorDoc.updatedAt),
          firebase_id: id,
          migration_timestamp: new Date().toISOString()
        }

        vendors.push(vendor)
        
      } catch (error) {
        this.error(`Failed to transform vendor ${id}`, error)
      }
    })

    this.log(`Transformed ${vendors.length} vendors from Firebase data`)
    return vendors
  }

  parseFirebaseTimestamp(timestamp) {
    if (!timestamp) return new Date().toISOString()
    
    if (timestamp._seconds) {
      return new Date(timestamp._seconds * 1000).toISOString()
    }
    
    if (typeof timestamp === 'string') {
      return new Date(timestamp).toISOString()
    }
    
    return new Date().toISOString()
  }

  async generateSQL(vendors) {
    const sqlStatements = []
    
    // Create vendors table if not exists
    sqlStatements.push(`
CREATE TABLE IF NOT EXISTS vendors (
  id SERIAL PRIMARY KEY,
  firebase_id VARCHAR(255) UNIQUE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  category VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  city VARCHAR(100),
  state VARCHAR(50),
  zip VARCHAR(20),
  services JSONB DEFAULT '[]',
  pricing JSONB DEFAULT '{}',
  rating DECIMAL(3,2) DEFAULT 0,
  reviews INTEGER DEFAULT 0,
  verification_status VARCHAR(50) DEFAULT 'unverified',
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  migration_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`)

    // Create index on firebase_id for fast lookups
    sqlStatements.push(`
CREATE INDEX IF NOT EXISTS idx_vendors_firebase_id ON vendors(firebase_id);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors(category);`)

    // Insert vendors
    vendors.forEach(vendor => {
      const sql = `
INSERT INTO vendors (
  firebase_id, name, email, phone, category, status, 
  city, state, zip, services, pricing, rating, reviews, 
  verification_status, created_at, updated_at
) VALUES (
  '${vendor.firebase_id}',
  '${vendor.name?.replace(/'/g, "''")}',
  '${vendor.email || ''}',
  '${vendor.phone || ''}',
  '${vendor.category}',
  '${vendor.status}',
  '${vendor.location.city}',
  '${vendor.location.state}',
  '${vendor.location.zip || ''}',
  '${JSON.stringify(vendor.services).replace(/'/g, "''")}',
  '${JSON.stringify(vendor.pricing).replace(/'/g, "''")}',
  ${vendor.rating},
  ${vendor.reviews},
  '${vendor.verification_status}',
  '${vendor.created_at}',
  '${vendor.updated_at}'
)
ON CONFLICT (firebase_id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  zip = EXCLUDED.zip,
  services = EXCLUDED.services,
  pricing = EXCLUDED.pricing,
  rating = EXCLUDED.rating,
  reviews = EXCLUDED.reviews,
  verification_status = EXCLUDED.verification_status,
  updated_at = EXCLUDED.updated_at;`
      
      sqlStatements.push(sql)
    })

    return sqlStatements
  }

  async saveMigrationFiles(vendors, sqlStatements) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const outputDir = path.join(__dirname, '..', 'migration-output')
    
    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // Save transformed JSON
    const jsonPath = path.join(outputDir, `vendors-${timestamp}.json`)
    fs.writeFileSync(jsonPath, JSON.stringify(vendors, null, 2))
    this.log(`Saved transformed vendor data to ${jsonPath}`)

    // Save SQL migration
    const sqlPath = path.join(outputDir, `vendors-migration-${timestamp}.sql`)
    fs.writeFileSync(sqlPath, sqlStatements.join('\n\n'))
    this.log(`Saved SQL migration to ${sqlPath}`)

    // Save migration log
    const logPath = path.join(outputDir, `migration-log-${timestamp}.txt`)
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
      this.log('Starting Firebase vendor migration...')
      
      // Read Firebase export
      const firebaseData = await this.readFirebaseExport(firebaseExportPath)
      
      // Transform vendor data
      const vendors = this.transformVendorData(firebaseData)
      
      if (vendors.length === 0) {
        throw new Error('No vendors found to migrate')
      }
      
      // Generate SQL statements
      const sqlStatements = await this.generateSQL(vendors)
      
      // Save migration files
      const paths = await this.saveMigrationFiles(vendors, sqlStatements)
      
      this.log(`Migration completed successfully!`)
      this.log(`Migrated ${vendors.length} vendors`)
      this.log(`Generated ${sqlStatements.length} SQL statements`)
      
      return {
        success: true,
        vendorCount: vendors.length,
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
    console.log('Usage: node import-firebase-vendors.js <firebase-export-path>')
    console.log('Example: node import-firebase-vendors.js ./firebase-export.json')
    process.exit(1)
  }

  const migration = new FirebaseVendorMigration()
  migration.migrate(args[0])
    .then(result => {
      if (result.success) {
        console.log('\n✅ Migration completed successfully!')
        console.log(`📊 Migrated ${result.vendorCount} vendors`)
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

module.exports = FirebaseVendorMigration