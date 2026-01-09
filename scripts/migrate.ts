/**
 * Database Migration Script
 * Run with: npx tsx scripts/migrate.ts
 */

import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.error('❌ DATABASE_URL environment variable is not set');
        console.log('\nMake sure you have a .env.local file with:');
        console.log('DATABASE_URL=postgresql://...');
        process.exit(1);
    }

    console.log('🚀 Starting database migration...\n');

    const sql = neon(databaseUrl);

    try {
        // Read the SQL migration file
        const migrationPath = path.join(__dirname, 'migrate.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

        // Split by semicolons but handle the DO $$ blocks correctly
        const statements = migrationSQL
            .split(/;(?=\s*(?:CREATE|INSERT|DO|\-\-|$))/g)
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
            if (statement.length > 10) {
                try {
                    await sql(statement);
                    // Extract table name or action for logging
                    const match = statement.match(/(?:CREATE TABLE IF NOT EXISTS|INSERT INTO|CREATE INDEX IF NOT EXISTS)\s+(\w+)/i);
                    if (match) {
                        console.log(`  ✓ ${match[0]}`);
                    }
                } catch (err: unknown) {
                    const error = err as Error;
                    // Ignore "already exists" errors
                    if (!error.message?.includes('already exists')) {
                        console.warn(`  ⚠ Warning: ${error.message?.slice(0, 100)}`);
                    }
                }
            }
        }

        // Verify the migration
        console.log('\n📊 Verifying migration...\n');

        const tables = ['leads', 'tasks', 'messages', 'rag_stores'];
        for (const table of tables) {
            try {
                const result = await sql(`SELECT COUNT(*) as count FROM ${table}`);
                console.log(`  ✓ ${table}: ${result[0].count} rows`);
            } catch {
                console.log(`  ❌ ${table}: table not found`);
            }
        }

        console.log('\n✅ Migration completed successfully!\n');
        console.log('You can now refresh http://localhost:3000 to see the sample data.');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
