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

        const { rows } = await pool.query('SELECT * FROM leads ORDER BY last_contact DESC');
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Leads API Error:', error);
        return NextResponse.json(
            { 
                error: 'Failed to fetch leads',
                details: error instanceof Error ? error.message : 'Unknown error'
            }, 
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, phone, specialty, stage, temperature } = body;
        const { rows } = await pool.query(
            'INSERT INTO leads (name, phone, specialty, stage, temperature) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, phone, specialty, stage, temperature]
        );
        return NextResponse.json(rows[0]);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
    }
}