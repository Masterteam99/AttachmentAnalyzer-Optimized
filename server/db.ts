import * as schema from "@shared/schema-sqlite";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Configurazione database universale con fallback
const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';

// FORCE SQLite in development to avoid PostgreSQL connection issues
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production';
const forceDbUrl = isDevelopment ? 'file:./dev.db' : databaseUrl;

console.log('🔧 Database configuration:');
console.log('- URL:', forceDbUrl.replace(/\/\/[^@]*@/, '//***:***@')); // Hide credentials
console.log('- Environment:', process.env.NODE_ENV || 'development');
console.log('- Forced SQLite in dev:', isDevelopment);

let db: any;

try {
  // Configurazione per SQLite (sviluppo o fallback)
  if (forceDbUrl.startsWith('file:') || forceDbUrl.includes('.db')) {
    console.log('📁 Using SQLite database');
    const Database = require('better-sqlite3');
    const { drizzle } = require('drizzle-orm/better-sqlite3');
    
    const dbPath = forceDbUrl.replace('file:', '');
    const sqlite = new Database(dbPath);
    
    // Abilita foreign keys per SQLite
    sqlite.pragma('foreign_keys = ON');
    
    db = drizzle(sqlite, { schema });
    console.log('✅ SQLite database connected:', dbPath);
  } 
  // Configurazione per PostgreSQL/Neon (produzione)
  else if (forceDbUrl.includes('postgres') || forceDbUrl.includes('neon')) {
    console.log('🐘 Using PostgreSQL database');
    
    // Usa pg standard per connessioni locali PostgreSQL
    if (forceDbUrl.includes('localhost') || forceDbUrl.includes('127.0.0.1')) {
      const { drizzle } = require('drizzle-orm/node-postgres');
      const { Pool } = require('pg');
      
      const pool = new Pool({ connectionString: forceDbUrl });
      db = drizzle(pool, { schema });
      console.log('✅ PostgreSQL (pg) database connected');
    } else {
      // Usa Neon per connessioni cloud
      const { Pool, neonConfig } = require('@neondatabase/serverless');
      const { drizzle } = require('drizzle-orm/neon-serverless');
      
      const ws = require("ws");
      neonConfig.webSocketConstructor = ws;
      
      const pool = new Pool({ connectionString: forceDbUrl });
      db = drizzle(pool, { schema });
      console.log('✅ PostgreSQL (Neon) database connected');
    }
  }
  // Fallback generico
  else {
    console.log('🔄 Using generic database connection');
    const { drizzle } = require('drizzle-orm/node-postgres');
    const { Pool } = require('pg');
    
    const pool = new Pool({ connectionString: forceDbUrl });
    db = drizzle(pool, { schema });
    console.log('✅ Generic database connected');
  }
} catch (error) {
  console.error('❌ Database connection failed:', error.message);
  
  // Fallback critico: SQLite in memoria
  console.log('🆘 Using SQLite in-memory fallback');
  try {
    const Database = require('better-sqlite3');
    const { drizzle } = require('drizzle-orm/better-sqlite3');
    
    const sqlite = new Database(':memory:');
    sqlite.pragma('foreign_keys = ON');
    db = drizzle(sqlite, { schema });
    console.log('✅ SQLite in-memory fallback active');
  } catch (fallbackError) {
    console.error('💥 Critical database failure:', fallbackError.message);
    throw new Error('Unable to establish any database connection');
  }
}

export { db };