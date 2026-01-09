import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || process.env.API_KEY || '' });

export async function POST(req: Request) {
    try {
        const { query, lead, storeName } = await req.json();

        // 1. Salvar mensagem do usuário
        if (lead && lead.id) {
            await pool.query(
                'INSERT INTO messages (lead_id, role, content) VALUES ($1, $2, $3)',
                [lead.id, 'user', query]
            );
        }

        // 2. Prompt System
        let systemInstruction = `
        IDENTIDADE: Você é o "Danilo | Sales OS", IA de vendas do Brandão Facial Institute.
        OBJETIVO: Vender ingressos para o Modern Face Congress 2025.
        CONTEXTO: Baseado APENAS nos documentos fornecidos.
        `;

        if (lead) {
            systemInstruction += `
            LEAD: ${lead.name} (${lead.specialty}).
            ESTÁGIO: ${lead.stage}.
            TEMP: ${lead.temperature}.
            `;
        }

        // 3. Gemini Call
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: query,
            config: {
                systemInstruction: systemInstruction,
                tools: [{ fileSearch: { fileSearchStoreNames: [storeName] } }]
            }
        });

        const text = response.text;

        // 4. Salvar resposta do modelo
        if (lead && lead.id && text) {
            await pool.query(
                'INSERT INTO messages (lead_id, role, content) VALUES ($1, $2, $3)',
                [lead.id, 'model', text]
            );
        }

        return NextResponse.json({
            text: text,
            groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
        });

    } catch (error) {
        console.error("AI Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}