/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Security Note: This component uses DOMPurify to sanitize all HTML content
 * before rendering with dangerouslySetInnerHTML, preventing XSS attacks.
 */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import { ChatMessage, LeadProfile, Lead } from '../types';

interface ChatInterfaceProps {
    documentName: string;
    history: ChatMessage[];
    isQueryLoading: boolean;
    onSendMessage: (message: string) => void;
    onNewChat: () => void;
    exampleQuestions: string[];
    selectedLead?: Lead | null;
}

// Typing indicator component
const TypingIndicator = () => (
    <div className="flex items-start gap-3 animate-fade-in-up">
        <div className="avatar-ai flex-shrink-0">
            <span className="text-sm">D</span>
        </div>
        <div className="chat-bubble-ai">
            <div className="flex items-center gap-1.5">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
            </div>
        </div>
    </div>
);

// Copy button component
const CopyButton = ({ text, onCopy }: { text: string; onCopy: () => void }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        onCopy();
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                copied
                    ? 'bg-jade-100 text-jade-700'
                    : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
            }`}
        >
            {copied ? (
                <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copiado!
                </>
            ) : (
                <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copiar
                </>
            )}
        </button>
    );
};

/**
 * Sanitizes HTML content using DOMPurify to prevent XSS attacks.
 * Only allows safe tags and class attributes.
 */
const sanitizeHtml = (html: string): string => {
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['p', 'strong', 'em', 'code', 'h2', 'h3', 'ol', 'ul', 'li', 'blockquote', 'br'],
        ALLOWED_ATTR: ['class']
    });
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({
    documentName,
    history,
    isQueryLoading,
    onSendMessage,
    onNewChat,
    exampleQuestions,
    selectedLead
}) => {
    const [query, setQuery] = useState('');
    const [modalContent, setModalContent] = useState<string | null>(null);
    const [isContextOpen, setIsContextOpen] = useState(false);

    // Lead profile state
    const [leadProfile, setLeadProfile] = useState<LeadProfile>({
        id: '',
        name: '',
        phone: '',
        specialty: 'Cirurgião Plástico',
        stage: 'Consideração',
        temperature: 'Morno'
    });

    useEffect(() => {
        if (selectedLead) {
            setLeadProfile(selectedLead);
        }
    }, [selectedLead]);

    const chatEndRef = useRef<HTMLDivElement>(null);

    /**
     * Converts markdown text to sanitized HTML.
     * Uses DOMPurify to prevent XSS attacks.
     */
    const renderMarkdown = (text: string): { __html: string } => {
        if (!text) return { __html: '' };

        const lines = text.split('\n');
        let html = '';
        let listType: 'ul' | 'ol' | null = null;
        let paraBuffer = '';

        function flushPara() {
            if (paraBuffer) {
                html += `<p class="my-2 leading-relaxed text-surface-700">${paraBuffer}</p>`;
                paraBuffer = '';
            }
        }

        function flushList() {
            if (listType) {
                html += `</${listType}>`;
                listType = null;
            }
        }

        for (const rawLine of lines) {
            const line = rawLine
                .replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<strong class="font-semibold text-surface-900">$1$2</strong>')
                .replace(/\*(.*?)\*|_(.*?)_/g, '<em class="italic">$1$2</em>')
                .replace(/`([^`]+)`/g, '<code class="bg-jade-50 text-jade-700 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
                .replace(/^### (.*$)/g, '<h3 class="text-base font-semibold mt-4 mb-2 text-surface-800">$1</h3>')
                .replace(/^## (.*$)/g, '<h2 class="text-lg font-semibold mt-5 mb-3 text-surface-900">$1</h2>');

            const isOl = line.match(/^\s*\d+\.\s(.*)/);
            const isUl = line.match(/^\s*[\*\-]\s(.*)/);
            const isBlockquote = line.match(/^>\s?(.*)/);

            if (isOl) {
                flushPara();
                if (listType !== 'ol') {
                    flushList();
                    html += '<ol class="list-decimal list-inside my-3 pl-2 space-y-1.5 text-surface-700">';
                    listType = 'ol';
                }
                html += `<li class="pl-1">${isOl[1]}</li>`;
            } else if (isUl) {
                flushPara();
                if (listType !== 'ul') {
                    flushList();
                    html += '<ul class="list-disc list-inside my-3 pl-2 space-y-1.5 text-surface-700 marker:text-jade-500">';
                    listType = 'ul';
                }
                html += `<li class="pl-1">${isUl[1]}</li>`;
            } else if (isBlockquote) {
                flushPara();
                flushList();
                html += `<blockquote class="border-l-4 border-jade-400 pl-4 py-2 my-4 bg-jade-50/50 text-surface-600 italic rounded-r">${isBlockquote[1]}</blockquote>`;
            } else {
                flushList();
                if (line.trim() === '') {
                    flushPara();
                } else {
                    paraBuffer += (paraBuffer ? '<br/>' : '') + line;
                }
            }
        }

        flushPara();
        flushList();

        // SECURITY: Sanitize HTML with DOMPurify before returning
        return { __html: sanitizeHtml(html) };
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSendMessage(query);
            setQuery('');
        }
    };

    const handleSourceClick = (text: string) => {
        setModalContent(text);
    };

    const closeModal = () => {
        setModalContent(null);
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, isQueryLoading]);

    // Temperature config for Lead Card
    const temperatureConfig = {
        'Frio': { icon: '❄️', class: 'bg-blue-50 text-blue-700 border-blue-200' },
        'Morno': { icon: '☀️', class: 'bg-amber-50 text-amber-700 border-amber-200' },
        'Quente': { icon: '🔥', class: 'bg-red-50 text-red-700 border-red-200' },
    };

    return (
        <div className="flex h-full overflow-hidden">
            {/* ═══════════════════════════════════════════════════════════
                MAIN CHAT AREA
                ═══════════════════════════════════════════════════════════ */}
            <div className="flex-grow flex flex-col h-full relative">
                {/* Header */}
                <header className="absolute top-0 left-0 right-0 z-10">
                    <div className="mx-4 mt-4">
                        <div className="glass-card px-5 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="avatar-ai">
                                    <span className="text-sm">D</span>
                                </div>
                                <div>
                                    <h1 className="font-display text-lg font-bold text-surface-900 flex items-center gap-2">
                                        Danilo
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-jade-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-jade-500"></span>
                                        </span>
                                    </h1>
                                    <p className="text-sm text-surface-500">
                                        Atendendo: <span className="font-medium text-surface-700">{leadProfile.name || 'Aguardando...'}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsContextOpen(!isContextOpen)}
                                    className={`btn-outline ${isContextOpen ? '!bg-jade-50 !border-jade-300' : ''}`}
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span className="hidden sm:inline">Lead Card</span>
                                </button>
                                <button
                                    onClick={onNewChat}
                                    className="btn-ghost text-red-500 hover:text-red-600 hover:bg-red-50"
                                    title="Limpar conversa"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Messages Area */}
                <div className="flex-grow pt-28 pb-36 overflow-y-auto px-4 custom-scrollbar">
                    <div className="w-full max-w-3xl mx-auto space-y-6">

                        {/* Empty State / Welcome */}
                        {history.length === 0 && !isQueryLoading && (
                            <div className="mt-8 animate-fade-in-up">
                                <div className="text-center mb-10">
                                    <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-jade-gradient shadow-jade flex items-center justify-center">
                                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                    <h2 className="font-display text-2xl font-bold text-surface-800 mb-2">
                                        Pronto para fechar vendas?
                                    </h2>
                                    <p className="text-surface-500 max-w-md mx-auto">
                                        Escolha um cenário abaixo ou digite a objeção do seu lead para receber o script ideal.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {exampleQuestions.map((q, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => onSendMessage(q)}
                                            className="glass-card-hover p-5 text-left group"
                                            style={{ animationDelay: `${idx * 100}ms` }}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <p className="text-surface-700 group-hover:text-jade-700 transition-colors leading-relaxed">
                                                    {q}
                                                </p>
                                                <svg className="w-5 h-5 text-surface-300 group-hover:text-jade-500 transition-colors flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                </svg>
                                            </div>
                                            <span className="text-[10px] text-surface-400 uppercase tracking-wider font-semibold mt-3 block">
                                                Cenário {idx + 1}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Messages - Content is sanitized via renderMarkdown using DOMPurify */}
                        {history.map((message, index) => (
                            <div
                                key={index}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {message.role === 'model' && (
                                    <div className="avatar-ai flex-shrink-0 mr-3 mt-1">
                                        <span className="text-sm">D</span>
                                    </div>
                                )}

                                <div className={message.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                                    {/* SECURITY: HTML is sanitized by renderMarkdown using DOMPurify */}
                                    <div dangerouslySetInnerHTML={renderMarkdown(message.parts[0].text)} />

                                    {message.role === 'model' && (
                                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-surface-100">
                                            {/* Source references */}
                                            <div className="flex flex-wrap gap-1.5">
                                                {message.groundingChunks && message.groundingChunks.length > 0 && (
                                                    message.groundingChunks.map((chunk, chunkIndex) => (
                                                        chunk.retrievedContext?.text && (
                                                            <button
                                                                key={chunkIndex}
                                                                onClick={() => handleSourceClick(chunk.retrievedContext!.text!)}
                                                                className="px-2 py-1 rounded-md bg-jade-50 text-jade-700 text-[10px] font-semibold uppercase tracking-wide hover:bg-jade-100 transition-colors"
                                                            >
                                                                Ref {chunkIndex + 1}
                                                            </button>
                                                        )
                                                    ))
                                                )}
                                            </div>

                                            {/* Copy button */}
                                            <CopyButton text={message.parts[0].text} onCopy={() => {}} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Typing Indicator */}
                        {isQueryLoading && <TypingIndicator />}

                        <div ref={chatEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <div className="absolute bottom-0 left-0 right-0 z-10">
                    <div className="mx-4 mb-4">
                        <div className="glass-card p-2">
                            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Digite a objeção do lead ou pergunta..."
                                    className="flex-grow bg-transparent border-none py-3 px-4 focus:ring-0 focus:outline-none text-surface-800 placeholder:text-surface-400"
                                    disabled={isQueryLoading}
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={isQueryLoading || !query.trim()}
                                    className="btn-jade !rounded-xl !px-4 !py-3"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </button>
                            </form>
                        </div>
                        <p className="text-center text-xs text-surface-400 mt-3">
                            Danilo AI gera scripts baseados nos Playbooks do Brandão Facial Institute
                        </p>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                LEAD CARD PANEL
                ═══════════════════════════════════════════════════════════ */}
            <div className={`
                fixed inset-y-0 right-0 w-80 bg-white border-l border-surface-200 shadow-glass-lg z-30
                transform transition-transform duration-300 ease-smooth
                ${isContextOpen ? 'translate-x-0' : 'translate-x-full'}
                lg:relative lg:transform-none lg:w-72 lg:flex-shrink-0 lg:shadow-none
                ${!isContextOpen && 'lg:hidden'}
            `}>
                <div className="h-full flex flex-col overflow-y-auto custom-scrollbar">
                    {/* Panel Header */}
                    <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-surface-200 p-5 z-10">
                        <div className="flex items-center justify-between">
                            <h2 className="font-display text-lg font-bold text-surface-900 flex items-center gap-2">
                                <svg className="w-5 h-5 text-jade-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Lead Card
                            </h2>
                            <button
                                onClick={() => setIsContextOpen(false)}
                                className="lg:hidden btn-ghost !p-2 text-surface-400 hover:text-surface-600"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Panel Content */}
                    <div className="p-5 space-y-6">
                        {/* Lead Name Card */}
                        <div className="glass-card p-4 text-center">
                            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-jade-gradient shadow-jade flex items-center justify-center">
                                <span className="text-xl font-display font-bold text-white">
                                    {leadProfile.name ? leadProfile.name.charAt(0).toUpperCase() : '?'}
                                </span>
                            </div>
                            <p className="font-display font-bold text-surface-900">
                                {leadProfile.name || 'Não Selecionado'}
                            </p>
                            {leadProfile.phone && (
                                <p className="text-sm text-surface-500 mt-1">{leadProfile.phone}</p>
                            )}
                        </div>

                        {/* Specialty */}
                        <div>
                            <label className="sidebar-section-title !mb-2 !px-0">
                                Especialidade
                            </label>
                            <select
                                value={leadProfile.specialty}
                                onChange={(e) => setLeadProfile({ ...leadProfile, specialty: e.target.value as Lead['specialty'] })}
                                className="input-premium !py-2.5 text-sm"
                            >
                                <option value="Cirurgião Plástico">Cirurgião Plástico</option>
                                <option value="Dermatologista">Dermatologista</option>
                                <option value="Otorrino">Otorrino</option>
                                <option value="Outro">Outro</option>
                            </select>
                        </div>

                        {/* Stage */}
                        <div>
                            <label className="sidebar-section-title !mb-2 !px-0">
                                Estágio do Funil
                            </label>
                            <select
                                value={leadProfile.stage}
                                onChange={(e) => setLeadProfile({ ...leadProfile, stage: e.target.value as Lead['stage'] })}
                                className="input-premium !py-2.5 text-sm"
                            >
                                <option value="Descoberta">Descoberta (Lead Novo)</option>
                                <option value="Consideração">Consideração (Dúvidas)</option>
                                <option value="Negociação">Negociação (Preço)</option>
                                <option value="Fechamento">Fechamento (Checkout)</option>
                            </select>
                        </div>

                        {/* Temperature */}
                        <div>
                            <label className="sidebar-section-title !mb-2 !px-0">
                                Temperatura
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['Frio', 'Morno', 'Quente'] as const).map((temp) => {
                                    const config = temperatureConfig[temp];
                                    const isActive = leadProfile.temperature === temp;
                                    return (
                                        <button
                                            key={temp}
                                            onClick={() => setLeadProfile({ ...leadProfile, temperature: temp })}
                                            className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                                                isActive
                                                    ? config.class
                                                    : 'bg-surface-50 text-surface-500 border-surface-200 hover:bg-surface-100'
                                            }`}
                                        >
                                            {config.icon} {temp}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Sales Tip */}
                        <div className="glass-card p-4 bg-jade-50/50 border-jade-200/50">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-jade-100 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-jade-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-jade-800 mb-1">Dica do Sales OS</h4>
                                    <p className="text-xs text-jade-700 leading-relaxed">
                                        {leadProfile.temperature === 'Quente'
                                            ? "Lead quente: Não explique demais. Envie o link de checkout e use escassez."
                                            : leadProfile.specialty === 'Cirurgião Plástico'
                                                ? "Fale tecnicamente (ligamentos, plano profundo). Mostre autoridade."
                                                : "Foque na segurança e na curva de aprendizado rápida."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                SOURCE MODAL - Content is sanitized via renderMarkdown
                ═══════════════════════════════════════════════════════════ */}
            {modalContent !== null && (
                <div
                    className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={closeModal}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="source-modal-title"
                >
                    <div
                        className="glass-card p-6 w-full max-w-2xl max-h-[80vh] flex flex-col animate-scale-in"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 id="source-modal-title" className="font-display text-lg font-bold text-surface-900 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-jade-100 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-jade-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                Contexto Original
                            </h3>
                            <button
                                onClick={closeModal}
                                className="btn-ghost !p-2 text-surface-400 hover:text-surface-600"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* SECURITY: HTML is sanitized by renderMarkdown using DOMPurify */}
                        <div
                            className="flex-grow overflow-y-auto pr-2 custom-scrollbar bg-surface-50 rounded-xl p-4"
                            dangerouslySetInnerHTML={renderMarkdown(modalContent || '')}
                        />

                        <div className="flex justify-end mt-4 pt-4 border-t border-surface-200">
                            <button onClick={closeModal} className="btn-jade">
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatInterface;
