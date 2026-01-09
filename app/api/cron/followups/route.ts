import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    // 1. Identificar leads sem contato há > 24h em estágio 'Negociação'
    const query = `
        INSERT INTO tasks (lead_id, description, due_date, type)
        SELECT id, 'Follow-up 24h: Enviar prova social', NOW(), 'followup_24h'
        FROM leads
        WHERE stage = 'Negociação' 
        AND last_contact < NOW() - INTERVAL '24 hours'
        AND NOT EXISTS (SELECT 1 FROM tasks WHERE lead_id = leads.id AND type = 'followup_24h');
    `;
    
    await pool.query(query);
    
    return NextResponse.json({ status: 'Follow-ups generated' });
}