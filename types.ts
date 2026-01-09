/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
export interface RagStore {
    id: string;
    name: string; // Google ID
    displayName: string;
}

export interface CustomMetadata {
  key?: string;
  stringValue?: string;
  stringListValue?: string[];
  numericValue?: number;
}

export interface Document {
    name: string;
    displayName: string;
    customMetadata?: CustomMetadata[];
}

export interface GroundingChunk {
    retrievedContext?: {
        text?: string;
    };
}

export interface QueryResult {
    text: string;
    groundingChunks: GroundingChunk[];
}

export enum AppStatus {
    Initializing,
    Dashboard, // Novo estado principal
    Uploading,
    Error,
}

export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
    groundingChunks?: GroundingChunk[];
    timestamp?: string;
}

// Novos Tipos para o CRM
export interface Lead {
    id: string;
    name: string;
    phone: string;
    specialty: 'Cirurgião Plástico' | 'Dermatologista' | 'Otorrino' | 'Outro';
    stage: 'Descoberta' | 'Consideração' | 'Negociação' | 'Fechamento';
    temperature: 'Frio' | 'Morno' | 'Quente';
    last_contact?: string;
}

export interface Task {
    id: string;
    lead_id: string;
    lead_name: string;
    description: string;
    due_date: string; // ISO Date
    status: 'pending' | 'done';
    type: 'followup_24h' | 'followup_72h' | 'followup_7d' | 'manual';
}

// Compatibilidade com UI antiga
export type LeadProfile = Lead;
