import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || process.env.API_KEY || '' });

export async function POST(req: Request) {
    try {
        const { displayName } = await req.json();

        // 1. Criar no Google GenAI
        const createStoreOp = await ai.fileSearchStores.create({
            config: { displayName: displayName }
        });
        
        const storeName = createStoreOp.name;

        if (!storeName) {
             return NextResponse.json({ error: "Failed to create store in Gemini" }, { status: 500 });
        }

        // 2. Persistir no Neon
        await pool.query(
            'INSERT INTO rag_stores (name, display_name) VALUES ($1, $2)', 
            [storeName, displayName]
        );

        return NextResponse.json({ storeName });
    } catch (error) {
        console.error("Create Store Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}