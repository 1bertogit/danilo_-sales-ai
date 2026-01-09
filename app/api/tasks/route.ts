import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        // Verifica se DATABASE_URL está configurado
        if (!process.env.DATABASE_URL) {
            console.error('DATABASE_URL não está configurado');
            return NextResponse.json(
                { error: 'Database configuration missing' }, 
                { status: 500 }
            );
        }

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
        console.error('Tasks API Error:', error);
        return NextResponse.json(
            { 
                error: 'Failed to fetch tasks',
                details: error instanceof Error ? error.message : 'Unknown error'
            }, 
            { status: 500 }
        );
    }
}