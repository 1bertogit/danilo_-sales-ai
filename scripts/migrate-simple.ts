/**
 * Simple Database Migration Script
 * Run with: npx tsx scripts/migrate-simple.ts
 */

import { neon } from '@neondatabase/serverless';

async function runMigration() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.error('❌ DATABASE_URL environment variable is not set');
        process.exit(1);
    }

    console.log('🚀 Starting database migration...\n');

    const sql = neon(databaseUrl);

    try {
        // 1. Create leads table
        console.log('Creating leads table...');
        await sql`
            CREATE TABLE IF NOT EXISTS leads (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                name TEXT NOT NULL,
                phone TEXT,
                specialty TEXT CHECK (specialty IN ('Cirurgião Plástico', 'Dermatologista', 'Otorrino', 'Outro')),
                stage TEXT CHECK (stage IN ('Descoberta', 'Consideração', 'Negociação', 'Fechamento')) DEFAULT 'Descoberta',
                temperature TEXT CHECK (temperature IN ('Frio', 'Morno', 'Quente')) DEFAULT 'Frio',
                last_contact TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `;
        console.log('  ✓ leads table created');

        // 2. Create tasks table
        console.log('Creating tasks table...');
        await sql`
            CREATE TABLE IF NOT EXISTS tasks (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
                description TEXT NOT NULL,
                due_date TIMESTAMP WITH TIME ZONE,
                status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'done')),
                type TEXT CHECK (type IN ('followup_24h', 'followup_72h', 'followup_7d', 'manual')),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `;
        console.log('  ✓ tasks table created');

        // 3. Create messages table
        console.log('Creating messages table...');
        await sql`
            CREATE TABLE IF NOT EXISTS messages (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
                role TEXT CHECK (role IN ('user', 'model')) NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `;
        console.log('  ✓ messages table created');

        // 4. Create rag_stores table
        console.log('Creating rag_stores table...');
        await sql`
            CREATE TABLE IF NOT EXISTS rag_stores (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                display_name TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `;
        console.log('  ✓ rag_stores table created');

        // 5. Create indexes
        console.log('\nCreating indexes...');
        await sql`CREATE INDEX IF NOT EXISTS idx_leads_last_contact ON leads(last_contact DESC)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_tasks_lead_id ON tasks(lead_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON messages(lead_id)`;
        console.log('  ✓ indexes created');

        // 6. Insert sample data
        console.log('\nInserting sample data...');

        // Check if we already have data
        const existingLeads = await sql`SELECT COUNT(*) as count FROM leads`;

        if (parseInt(existingLeads[0].count) === 0) {
            await sql`
                INSERT INTO leads (name, phone, specialty, stage, temperature, last_contact) VALUES
                ('Dr. Ricardo Mendes', '(11) 99999-1234', 'Cirurgião Plástico', 'Negociação', 'Quente', NOW() - INTERVAL '2 hours'),
                ('Dra. Ana Paula Silva', '(21) 98888-5678', 'Dermatologista', 'Consideração', 'Morno', NOW() - INTERVAL '1 day'),
                ('Dr. Carlos Eduardo', '(31) 97777-9012', 'Otorrino', 'Descoberta', 'Frio', NOW() - INTERVAL '3 days'),
                ('Dra. Fernanda Costa', '(41) 96666-3456', 'Cirurgião Plástico', 'Fechamento', 'Quente', NOW() - INTERVAL '30 minutes'),
                ('Dr. Bruno Oliveira', '(51) 95555-7890', 'Dermatologista', 'Negociação', 'Morno', NOW() - INTERVAL '6 hours')
            `;
            console.log('  ✓ sample leads inserted');

            // Get lead IDs for tasks
            const leads = await sql`SELECT id, name FROM leads`;

            for (const lead of leads) {
                if (lead.name === 'Dr. Ricardo Mendes') {
                    await sql`
                        INSERT INTO tasks (lead_id, description, due_date, status, type)
                        VALUES (${lead.id}, 'Follow-up: Enviar proposta comercial', NOW() + INTERVAL '2 hours', 'pending', 'followup_24h')
                    `;
                }
                if (lead.name === 'Dra. Ana Paula Silva') {
                    await sql`
                        INSERT INTO tasks (lead_id, description, due_date, status, type)
                        VALUES (${lead.id}, 'Ligar para esclarecer dúvidas sobre o método', NOW() + INTERVAL '1 day', 'pending', 'followup_24h')
                    `;
                }
                if (lead.name === 'Dra. Fernanda Costa') {
                    await sql`
                        INSERT INTO tasks (lead_id, description, due_date, status, type)
                        VALUES (${lead.id}, 'Enviar link de checkout - Lead quente!', NOW(), 'pending', 'manual')
                    `;
                }
            }
            console.log('  ✓ sample tasks inserted');

            await sql`
                INSERT INTO rag_stores (name, display_name) VALUES
                ('workspaces/default/stores/main', 'Base Oficial - Playbooks')
                ON CONFLICT (name) DO NOTHING
            `;
            console.log('  ✓ default RAG store inserted');
        } else {
            console.log('  ⏭ sample data already exists, skipping');
        }

        // 7. Verify
        console.log('\n📊 Verifying migration...\n');

        const leadsCount = await sql`SELECT COUNT(*) as count FROM leads`;
        const tasksCount = await sql`SELECT COUNT(*) as count FROM tasks`;
        const messagesCount = await sql`SELECT COUNT(*) as count FROM messages`;
        const ragCount = await sql`SELECT COUNT(*) as count FROM rag_stores`;

        console.log(`  ✓ leads: ${leadsCount[0].count} rows`);
        console.log(`  ✓ tasks: ${tasksCount[0].count} rows`);
        console.log(`  ✓ messages: ${messagesCount[0].count} rows`);
        console.log(`  ✓ rag_stores: ${ragCount[0].count} rows`);

        console.log('\n✅ Migration completed successfully!\n');
        console.log('Refresh http://localhost:3000 to see the sample data.');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
