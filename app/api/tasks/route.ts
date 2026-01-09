import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        // Busca tasks + nome do lead (Join)
        const query = `
            SELECT t.*, l.name as lead_name 
            FROM tasks t 
            JOIN leads l ON t.lead_id = l.id 
            WHERE t.status = 'pending' 
            ORDER BY t.due_date ASC
        `;
        const { rows } = await pool.query(query);
        return NextResponse.json(rows);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }
}