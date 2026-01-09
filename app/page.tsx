'use client';

import React, { useState, useEffect } from 'react';
import { ChatMessage, Lead, Task } from '../types';
import * as geminiService from '../services/geminiService';
import ChatInterface from '../components/ChatInterface';
import { UserButton } from "@clerk/nextjs";

export default function Dashboard() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    
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
                
                // Em produção, isso deve ser dinâmico ou fixo no env
                setActiveRagStoreName("workspaces/default/stores/main");
            } catch (e) {
                console.error("Failed to load initial data", e);
            }
        }
        loadData();
    }, []);

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
            setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: "Erro ao conectar com Danilo Sales OS. Verifique a conexão." }] }]);
        } finally {
            setIsQueryLoading(false);
        }
    };

    return (
        <main className="h-screen flex overflow-hidden">
            {/* SIDEBAR */}
            <aside className="w-80 bg-white border-r border-gem-mist flex flex-col z-20 shadow-lg">
                <div className="p-4 border-b border-gem-mist bg-white flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-gem-blue">Sales OS</h1>
                        <p className="text-xs text-gray-400">Brandão Institute</p>
                    </div>
                    <UserButton />
                </div>

                {/* TASKS */}
                <div className="flex-shrink-0 p-4 bg-blue-50/50 border-b border-gem-mist">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">⚡ Ações Hoje</h2>
                    <div className="space-y-2">
                        {tasks.length === 0 && <p className="text-xs text-gray-400">Nenhuma tarefa pendente.</p>}
                        {tasks.map(task => (
                            <div key={task.id} className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm cursor-pointer hover:border-blue-300">
                                <div className="flex justify-between items-start">
                                    <span className="text-sm font-bold text-gray-800">{task.lead_name}</span>
                                    <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">HOJE</span>
                                </div>
                                <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* LEADS */}
                <div className="flex-grow overflow-y-auto p-2 custom-scrollbar">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2 mt-4">Carteira</h2>
                    {leads.map(lead => (
                        <div 
                            key={lead.id}
                            onClick={() => { setSelectedLead(lead); setChatHistory([]); }}
                            className={`p-3 mb-1 rounded-lg cursor-pointer transition-all border ${
                                selectedLead?.id === lead.id 
                                ? 'bg-gem-blue text-white border-gem-blue shadow-md' 
                                : 'bg-white hover:bg-gray-50 border-transparent hover:border-gem-mist'
                            }`}
                        >
                            <div className="flex justify-between items-center">
                                <span className="font-medium">{lead.name}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold bg-white/20`}>
                                    {lead.temperature === 'Quente' ? '🔥' : lead.temperature === 'Morno' ? '☀️' : '❄️'}
                                </span>
                            </div>
                            <div className={`text-xs mt-1 flex justify-between opacity-80`}>
                                <span>{lead.specialty}</span>
                                <span>{lead.stage}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </aside>

            {/* CHAT AREA */}
            <section className="flex-grow h-full relative bg-gem-onyx">
                {selectedLead ? (
                    <ChatInterface 
                        documentName="Base Oficial"
                        history={chatHistory}
                        isQueryLoading={isQueryLoading}
                        onSendMessage={handleSendMessage}
                        onNewChat={() => setChatHistory([])}
                        exampleQuestions={[]}
                        selectedLead={selectedLead}
                    />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <div className="text-6xl mb-4 opacity-20">👈</div>
                        <h2 className="text-xl font-bold text-gray-600">Selecione um Lead</h2>
                        <p className="text-sm mt-2">Escolha um contato na barra lateral para iniciar.</p>
                    </div>
                )}
            </section>
        </main>
    );
}