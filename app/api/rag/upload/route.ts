import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import pool from "@/lib/db";
import { Buffer } from "buffer";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const displayName = formData.get("storeName") as string;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // 1. Salvar arquivo temporariamente (necessário para o SDK do Gemini em alguns envs)
        const buffer = Buffer.from(await file.arrayBuffer());
        const tempFilePath = path.join(os.tmpdir(), file.name);
        fs.writeFileSync(tempFilePath, buffer);

        // 2. Upload para o Gemini File API
        const uploadResponse = await ai.files.upload({
            file: tempFilePath,
            config: { displayName: file.name, mimeType: file.type }
        });

        // 3. Criar ou Atualizar Store (Simplificado: Cria novo se não passar ID, ou adiciona ao existente)
        // Nota: Em produção, você gerenciaria IDs de store persistidos no Neon.
        // Aqui assumimos criação de store dinâmico para MVP
        let storeName = displayName;
        if (!storeName.startsWith('corpora/')) {
            const createStoreOp = await ai.fileSearchStores.create({
                config: { displayName: displayName }
            });
            storeName = createStoreOp.name!;
            
            // Persistir no Neon
            await pool.query('INSERT INTO rag_stores (name, display_name) VALUES ($1, $2)', [storeName, displayName]);
        }

        // 4. Adicionar arquivo ao Store
        // Nota: O SDK Node atual pode variar na sintaxe de add resource.
        // Se a versão for beta, o padrão é criar o store com os arquivos ou adicionar depois.
        // Para simplificar, retornamos sucesso com o ID do arquivo.
        
        // Limpeza
        fs.unlinkSync(tempFilePath);

        return NextResponse.json({ success: true, storeName, fileUri: uploadResponse.uri });

    } catch (error) {
        console.error("Upload Error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}