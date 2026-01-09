'use client';

import React, { useState, useEffect } from 'react';
import { ChatMessage, Lead, Task } from '../types';
import * as geminiService from '../services/geminiService';
import ChatInterface from '../components/ChatInterface';
import { UserButton } from "@clerk/nextjs";

// Temperature badge component
const TemperatureBadge = ({ temperature }: { temperature: Lead['temperature'] }) => {
    const config = {
        'Quente': { icon: '🔥', class: 'badge-hot' },
        'Morno': { icon: '☀️', class: 'badge-warm' },
        'Frio': { icon: '❄️', class: 'badge-cold' },
    };
    const { icon, class: badgeClass } = config[temperature];
    return (
        <span className={badgeClass}>
            {icon} {temperature}
        </span>
    );
};

// Stage pill component
const StagePill = ({ stage }: { stage: Lead['stage'] }) => {
    const stageConfig: Record<string, { label: string; active?: boolean }> = {
        'Descoberta': { label: 'Novo' },
        'Consideração': { label: 'Consideração' },
        'Negociação': { label: 'Negociação', active: true },
        'Fechamento': { label: 'Fechamento', active: true },
    };
    const { label, active } = stageConfig[stage] || { label: stage };
    return (
        <span className={`pill-stage ${active ? 'pill-stage-active' : ''}`}>
            {label}
        </span>
    );
};

export default function Dashboard() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Chat State
    const [activeRagStoreName, setActiveRagStoreName] = useState<string | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isQueryLoading, setIsQueryLoading] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                const [leadsData, tasksData] = await Promise.all([
                    geminiService.fetchLeads(),
                    geminiService.fetchTasks()
                ]);
                setLeads(leadsData || []);
                setTasks(tasksData || []);
                setActiveRagStoreName("workspaces/default/stores/main");
            } catch (e) {
                console.error("Failed to load initial data", e);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    const handleSelectLead = (lead: Lead) => {
        setSelectedLead(lead);
        setChatHistory([]);
    };

    const handleSendMessage = async (message: string) => {
        if (!activeRagStoreName) return;

        const userMessage: ChatMessage = { role: 'user', parts: [{ text: message }] };
        setChatHistory(prev => [...prev, userMessage]);
        setIsQueryLoading(true);

        try {
            const result = await geminiService.fileSearch(activeRagStoreName, message, selectedLead || undefined);
            const modelMessage: ChatMessage = {
                role: 'model',
                parts: [{ text: result.text }],
                groundingChunks: result.groundingChunks
            };
            setChatHistory(prev => [...prev, modelMessage]);
        } catch (err) {
            setChatHistory(prev => [...prev, {
                role: 'model',
                parts: [{ text: "Erro ao conectar com Danilo Sales OS. Verifique a conexão." }]
            }]);
        } finally {
            setIsQueryLoading(false);
        }
    };

    return (
        <main className="h-screen flex overflow-hidden bg-surface-50 bg-mesh">
            {/* ═══════════════════════════════════════════════════════════
                SIDEBAR - Premium Glass Design
                ═══════════════════════════════════════════════════════════ */}
            <aside className="w-80 h-screen flex flex-col bg-white/70 backdrop-blur-xl border-r border-surface-200/80 z-20">
                {/* Header */}
                <div className="p-5 border-b border-surface-200/80">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-jade-gradient shadow-jade flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="font-display text-lg font-bold text-surface-900">
                                    Sales <span className="text-jade-600">OS</span>
                                </h1>
                                <p className="text-xs text-surface-400">Brandão Institute</p>
                            </div>
                        </div>
                        <UserButton
                            appearance={{
                                elements: {
                                    avatarBox: 'w-9 h-9 rounded-xl'
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Tasks Section */}
                <div className="flex-shrink-0 px-4 py-5 border-b border-surface-200/80">
                    <div className="sidebar-section-title">
                        <svg className="w-4 h-4 text-jade-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Ações de Hoje</span>
                        {tasks.length > 0 && (
                            <span className="ml-auto px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold">
                                {tasks.length}
                            </span>
                        )}
                    </div>

                    <div className="space-y-2.5">
                        {isLoading ? (
                            <div className="space-y-2">
                                {[1, 2].map((i) => (
                                    <div key={i} className="h-20 rounded-xl bg-surface-100 animate-pulse" />
                                ))}
                            </div>
                        ) : tasks.length === 0 ? (
                            <div className="text-center py-6 px-4">
                                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-surface-100 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-surface-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="text-sm text-surface-400">Tudo em dia!</p>
                            </div>
                        ) : (
                            tasks.slice(0, 3).map((task, index) => (
                                <div
                                    key={task.id}
                                    className={`task-card task-urgent animate-fade-in-up`}
                                    style={{ animationDelay: `${index * 75}ms` }}
                                    onClick={() => {
                                        const lead = leads.find(l => l.id === task.lead_id);
                                        if (lead) handleSelectLead(lead);
                                    }}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-surface-800 truncate">
                                                {task.lead_name}
                                            </p>
                                            <p className="text-sm text-surface-500 mt-0.5 line-clamp-2">
                                                {task.description}
                                            </p>
                                        </div>
                                        <span className="flex-shrink-0 px-2 py-1 rounded-md bg-red-50 text-red-600 text-[10px] font-bold uppercase">
                                            Hoje
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Leads Section */}
                <div className="flex-grow overflow-y-auto custom-scrollbar px-4 py-5">
                    <div className="sidebar-section-title">
                        <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>Carteira</span>
                        <span className="ml-auto text-[10px] text-surface-400 font-normal">
                            {leads.length} leads
                        </span>
                    </div>

                    <div className="space-y-1">
                        {isLoading ? (
                            <div className="space-y-2">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-16 rounded-xl bg-surface-100 animate-pulse" />
                                ))}
                            </div>
                        ) : leads.length === 0 ? (
                            <div className="text-center py-10">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-100 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-surface-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                                <p className="text-surface-500">Nenhum lead cadastrado</p>
                            </div>
                        ) : (
                            leads.map((lead, index) => (
                                <div
                                    key={lead.id}
                                    onClick={() => handleSelectLead(lead)}
                                    className={`lead-card animate-fade-in-up ${
                                        selectedLead?.id === lead.id ? 'lead-card-selected' : ''
                                    }`}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-medium truncate ${
                                                selectedLead?.id === lead.id ? 'text-white' : 'text-surface-800'
                                            }`}>
                                                {lead.name}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-xs ${
                                                    selectedLead?.id === lead.id ? 'text-white/70' : 'text-surface-400'
                                                }`}>
                                                    {lead.specialty}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            {selectedLead?.id === lead.id ? (
                                                <span className="px-2 py-0.5 rounded-md bg-white/20 text-white text-[10px] font-semibold">
                                                    {lead.temperature === 'Quente' ? '🔥' : lead.temperature === 'Morno' ? '☀️' : '❄️'}
                                                </span>
                                            ) : (
                                                <TemperatureBadge temperature={lead.temperature} />
                                            )}
                                            {selectedLead?.id !== lead.id && (
                                                <StagePill stage={lead.stage} />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-surface-200/80">
                    <div className="flex items-center justify-between text-xs text-surface-400">
                        <span>Danilo Sales OS v1.0</span>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-jade-500 animate-pulse-soft"></span>
                            <span>Conectado</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ═══════════════════════════════════════════════════════════
                MAIN CHAT AREA
                ═══════════════════════════════════════════════════════════ */}
            <section className="flex-grow h-full relative">
                {selectedLead ? (
                    <ChatInterface
                        documentName="Base Oficial"
                        history={chatHistory}
                        isQueryLoading={isQueryLoading}
                        onSendMessage={handleSendMessage}
                        onNewChat={() => setChatHistory([])}
                        exampleQuestions={[
                            "Lead (Cirurgião) diz: 'Não tenho tempo de viajar'. O que oferecer?",
                            "Lead reclama do preço do último lote.",
                            "Dúvida técnica: 'Preciso de endoscópio para o método?'",
                            "Lead visualizou e não respondeu há 2 dias."
                        ]}
                        selectedLead={selectedLead}
                    />
                ) : (
                    /* Empty State */
                    <div className="h-full flex flex-col items-center justify-center p-8">
                        <div className="max-w-md text-center animate-fade-in-up">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-jade-gradient-soft flex items-center justify-center">
                                <svg className="w-10 h-10 text-jade-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <h2 className="font-display text-2xl font-bold text-surface-800 mb-3">
                                Selecione um Lead
                            </h2>
                            <p className="text-surface-500 leading-relaxed">
                                Escolha um contato na barra lateral para iniciar uma conversa com o Danilo Sales OS.
                            </p>

                            {/* Visual hint arrow */}
                            <div className="mt-8 flex items-center justify-center gap-3 text-surface-300">
                                <svg className="w-6 h-6 animate-float" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                <span className="text-sm">Selecione na sidebar</span>
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}
