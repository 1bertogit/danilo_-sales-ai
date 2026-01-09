import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const { rows } = await pool.query('SELECT * FROM leads ORDER BY last_contact DESC');
        return NextResponse.json(rows);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
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