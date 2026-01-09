/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { QueryResult, Lead, Task } from '../types';

// O serviço agora é apenas uma ponte para o Backend (Next.js API Routes)
// A lógica pesada e a API KEY ficam no servidor.

export function initialize() {
    console.log("Service initialized (Client mode)");
}

export async function createRagStore(displayName: string): Promise<string> {
    const response = await fetch('/api/rag/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName })
    });
    
    if (!response.ok) throw new Error("Failed to create store on server");
    const data = await response.json();
    return data.storeName;
}

export async function uploadToRagStore(ragStoreName: string, file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('storeName', ragStoreName);

    const response = await fetch('/api/rag/upload', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) throw new Error("Failed to upload file");
}

export async function fileSearch(ragStoreName: string, query: string, leadProfile?: Lead): Promise<QueryResult> {
    // Chama a rota segura do servidor que detém a API KEY e o Prompt do Sales OS
    const response = await fetch('/api/ai/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            storeName: ragStoreName,
            query,
            lead: leadProfile // Envia o contexto para personalização no server
        })
    });

    if (!response.ok) {
        throw new Error("AI Service unavailable");
    }

    const data = await response.json();
    return {
        text: data.text,
        groundingChunks: data.groundingChunks || []
    };
}

export async function generateExampleQuestions(ragStoreName: string): Promise<string[]> {
    // Simulação local para MVP ou chamada de endpoint simplificado
    return [
        "Lead (Cirurgião) diz: 'Não tenho tempo de viajar'. O que oferecer?",
        "Lead reclama do preço do último lote.",
        "Dúvida técnica: 'Preciso de endoscópio para o método?'",
        "Lead visualizou e não respondeu há 2 dias."
    ];
}

export async function deleteRagStore(ragStoreName: string): Promise<void> {
    // Implementar chamada de delete se necessário
    console.log("Request to delete store:", ragStoreName);
}

// Novos métodos para o CRM
export async function fetchLeads(): Promise<Lead[]> {
    const response = await fetch('/api/leads');
    if (!response.ok) return [];
    return response.json();
}

export async function fetchTasks(): Promise<Task[]> {
    const response = await fetch('/api/tasks');
    if (!response.ok) return [];
    return response.json();
}
