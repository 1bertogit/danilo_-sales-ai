/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, LeadProfile, Lead } from '../types';
import Spinner from './Spinner';
import SendIcon from './icons/SendIcon';
import RefreshIcon from './icons/RefreshIcon';
import CheckIcon from './icons/CheckIcon';

interface ChatInterfaceProps {
    documentName: string;
    history: ChatMessage[];
    isQueryLoading: boolean;
    onSendMessage: (message: string) => void;
    onNewChat: () => void;
    exampleQuestions: string[];
    selectedLead?: Lead | null;
}

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
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [isContextOpen, setIsContextOpen] = useState(true); 
    
    // Sincroniza o estado local com o lead selecionado no Dashboard
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

    const renderMarkdown = (text: string) => {
        if (!text) return { __html: '' };

        const lines = text.split('\n');
        let html = '';
        let listType: 'ul' | 'ol' | null = null;
        let paraBuffer = '';

        function flushPara() {
            if (paraBuffer) {
                html += `<p class="my-2 leading-relaxed text-gem-offwhite/90">${paraBuffer}</p>`;
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
                .replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<strong class="font-bold text-gray-900">$1$2</strong>')
                .replace(/\*(.*?)\*|_(.*?)_/g, '<em class="italic text-gray-700">$1$2</em>')
                .replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-gem-blue px-1.5 py-0.5 rounded text-sm font-mono border border-gray-200">$1</code>')
                .replace(/^### (.*$)/g, '<h3 class="text-lg font-bold mt-4 mb-2 text-gem-teal">$1</h3>')
                .replace(/^## (.*$)/g, '<h2 class="text-xl font-bold mt-5 mb-3 text-gem-offwhite">$1</h2>');

            const isOl = line.match(/^\s*\d+\.\s(.*)/);
            const isUl = line.match(/^\s*[\*\-]\s(.*)/);
            const isBlockquote = line.match(/^>\s?(.*)/);

            if (isOl) {
                flushPara();
                if (listType !== 'ol') {
                    flushList();
                    html += '<ol class="list-decimal list-inside my-3 pl-2 space-y-2 marker:text-gem-blue marker:font-bold">';
                    listType = 'ol';
                }
                html += `<li>${isOl[1]}</li>`;
            } else if (isUl) {
                flushPara();
                if (listType !== 'ul') {
                    flushList();
                    html += '<ul class="list-disc list-inside my-3 pl-2 space-y-2 marker:text-gem-blue">';
                    listType = 'ul';
                }
                html += `<li>${isUl[1]}</li>`;
            } else if (isBlockquote) {
                flushPara();
                flushList();
                html += `<blockquote class="border-l-4 border-gem-blue pl-4 py-2 my-4 bg-blue-50/50 text-gray-700 italic rounded-r shadow-sm">${isBlockquote[1]}</blockquote>`;
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

        return { __html: html };
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            // No modo Dashboard, o contexto do Lead já está no state pai ou no DB
            // mas o ChatInterface visualiza. O geminiService usará o lead passado pelo Dashboard
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
    
    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, isQueryLoading]);

    return (
        <div className="flex h-full bg-gem-onyx overflow-hidden">
            {/* Main Chat Area */}
            <div className="flex-grow flex flex-col h-full relative">
                <header className="absolute top-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md z-10 flex justify-between items-center border-b border-gem-mist shadow-sm">
                    <div className="w-full max-w-4xl mx-auto flex justify-between items-center px-4">
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold text-gem-offwhite flex items-center gap-2">
                                <div className="relative">
                                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 absolute top-0 right-0 animate-pulse ring-2 ring-white"></span>
                                    <span className="text-2xl">👨‍⚕️</span>
                                </div>
                                Danilo | Sales OS
                            </h1>
                            <span className="text-xs text-gem-offwhite/50 truncate max-w-[200px] sm:max-w-md ml-9 -mt-1">
                                {leadProfile.name ? `Atendendo: ${leadProfile.name}` : 'Aguardando definição do Lead...'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsContextOpen(!isContextOpen)}
                                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${isContextOpen ? 'bg-gem-blue text-white border-gem-blue' : 'bg-white text-gem-offwhite border-gem-mist hover:bg-gray-50'}`}
                                title="Configurar contexto do lead"
                            >
                                📋 <span className="ml-2 hidden sm:inline">Lead Card</span>
                            </button>
                            <button
                                onClick={onNewChat}
                                className="flex items-center px-3 py-2 bg-white border border-gem-mist text-gem-offwhite hover:bg-gray-50 hover:text-red-500 rounded-lg text-sm font-medium transition-colors shadow-sm"
                                title="Encerrar Sessão"
                            >
                                <RefreshIcon />
                            </button>
                        </div>
                    </div>
                </header>

                <div className="flex-grow pt-24 pb-32 overflow-y-auto px-4 custom-scrollbar">
                    <div className="w-full max-w-4xl mx-auto space-y-6">
                        
                        {/* Empty State / Welcome */}
                        {history.length === 0 && !isQueryLoading && (
                            <div className="mt-10 animate-fadeIn">
                                <h2 className="text-2xl font-bold text-center text-gem-offwhite mb-2">Pronto para fechar inscrições?</h2>
                                <p className="text-center text-gem-offwhite/60 mb-8">Defina o lead ao lado (ou acima) e escolha um cenário.</p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {exampleQuestions.map((q, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => onSendMessage(q)}
                                            className="text-left p-5 bg-white border border-gem-mist rounded-xl hover:border-gem-blue hover:shadow-md hover:scale-[1.01] transition-all group"
                                        >
                                            <div className="flex items-start justify-between">
                                                <span className="font-medium text-gem-offwhite group-hover:text-gem-blue">{q}</span>
                                                <span className="text-gray-300 group-hover:text-gem-blue">→</span>
                                            </div>
                                            <span className="text-xs text-gray-400 mt-2 block uppercase tracking-wider font-bold">Simulação {idx + 1}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {history.map((message, index) => (
                            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {message.role === 'model' && (
                                    <div className="w-8 h-8 rounded-full bg-gem-teal flex items-center justify-center text-white text-sm font-bold mr-2 mt-2 flex-shrink-0 shadow-sm">
                                        D
                                    </div>
                                )}
                                
                                <div className={`max-w-xl lg:max-w-2xl px-6 py-4 rounded-2xl shadow-sm relative group transition-all ${
                                    message.role === 'user' 
                                    ? 'bg-gem-blue text-white rounded-tr-sm' 
                                    : 'bg-white border border-gem-mist text-gem-offwhite rounded-tl-sm'
                                }`}>
                                    <div dangerouslySetInnerHTML={renderMarkdown(message.parts[0].text)} />
                                    
                                    {message.role === 'model' && (
                                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                                            <div className="flex gap-2">
                                                {message.groundingChunks && message.groundingChunks.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {message.groundingChunks.map((chunk, chunkIndex) => (
                                                            chunk.retrievedContext?.text && (
                                                                <button
                                                                    key={chunkIndex}
                                                                    onClick={() => handleSourceClick(chunk.retrievedContext!.text!)}
                                                                    className="text-[10px] uppercase font-bold tracking-wider text-gem-blue bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                                                                    title="Ver contexto original"
                                                                >
                                                                    Ref {chunkIndex + 1}
                                                                </button>
                                                            )
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <button 
                                                onClick={() => copyToClipboard(message.parts[0].text, index)}
                                                className="flex items-center gap-2 text-xs font-bold text-gem-blue bg-blue-50 hover:bg-blue-100 border border-blue-100 hover:border-blue-200 transition-all px-3 py-1.5 rounded-lg shadow-sm"
                                                title="Copiar script para área de transferência"
                                            >
                                                {copiedIndex === index ? (
                                                    <>
                                                        <CheckIcon />
                                                        <span className="text-green-600">Copiado!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                                        </svg>
                                                        <span>Copiar Script</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isQueryLoading && (
                            <div className="flex justify-start">
                                <div className="w-8 h-8 rounded-full bg-gem-teal flex items-center justify-center text-white text-sm font-bold mr-2 mt-1 flex-shrink-0 animate-bounce">
                                    D
                                </div>
                                <div className="px-6 py-4 rounded-2xl bg-white border border-gem-mist shadow-sm flex items-center rounded-tl-sm">
                                    <Spinner />
                                    <span className="ml-3 text-sm text-gray-500 font-medium">Danilo está digitando...</span>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gem-mist z-20">
                    <div className="max-w-4xl mx-auto">
                        <form onSubmit={handleSubmit} className="flex items-center space-x-3 bg-white p-2 rounded-full border border-gem-mist shadow-lg focus-within:ring-2 focus-within:ring-gem-blue focus-within:border-transparent transition-all">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Digite a objeção do cirurgião ou cole a mensagem..."
                                className="flex-grow bg-transparent border-none py-3 px-6 focus:ring-0 text-gem-offwhite placeholder-gray-400 text-base"
                                disabled={isQueryLoading}
                                autoFocus
                            />
                            <button type="submit" disabled={isQueryLoading || !query.trim()} className="p-3 bg-gem-blue hover:bg-blue-600 rounded-full text-white disabled:bg-gray-200 disabled:text-gray-400 transition-all shadow-md transform active:scale-95" title="Enviar mensagem">
                                <SendIcon />
                            </button>
                        </form>
                        <p className="text-center text-xs text-gray-400 mt-3">
                            Danilo AI gera scripts baseados nos Playbooks do Brandão Facial Institute.
                        </p>
                    </div>
                </div>
            </div>

            {/* Sidebar Context Panel */}
            <div className={`
                fixed inset-y-0 right-0 w-80 bg-white border-l border-gem-mist shadow-2xl transform transition-transform duration-300 ease-in-out z-30
                ${isContextOpen ? 'translate-x-0' : 'translate-x-full'}
                lg:relative lg:transform-none lg:w-72 lg:flex-shrink-0 lg:border-l lg:shadow-none
                ${!isContextOpen && 'lg:hidden'} 
            `}>
                <div className="h-full flex flex-col p-6 overflow-y-auto bg-gray-50/50">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gem-offwhite flex items-center gap-2">
                            <span className="text-xl">📋</span> Lead Card
                        </h2>
                        <button onClick={() => setIsContextOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-600">
                            ✕
                        </button>
                    </div>

                    <div className="space-y-5">
                        <div className="p-3 bg-white rounded border border-gem-mist text-center">
                            <p className="text-xs text-gray-400 mb-1">Status do Lead</p>
                            <div className="font-bold text-gem-blue">{leadProfile.name || 'Não Selecionado'}</div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Especialidade</label>
                            <select
                                value={leadProfile.specialty}
                                onChange={(e) => setLeadProfile({ ...leadProfile, specialty: e.target.value as Lead['specialty'] })}
                                className="w-full bg-white border border-gem-mist rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gem-blue focus:border-transparent"
                            >
                                <option value="Cirurgião Plástico">Cirurgião Plástico</option>
                                <option value="Dermatologista">Dermatologista</option>
                                <option value="Otorrino">Otorrino</option>
                                <option value="Outro">Outro</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Estágio do Funil</label>
                            <select
                                value={leadProfile.stage}
                                onChange={(e) => setLeadProfile({ ...leadProfile, stage: e.target.value as Lead['stage'] })}
                                className="w-full bg-white border border-gem-mist rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gem-blue focus:border-transparent"
                            >
                                <option value="Descoberta">Descoberta (Lead Novo)</option>
                                <option value="Consideração">Consideração (Dúvidas)</option>
                                <option value="Negociação">Negociação (Preço)</option>
                                <option value="Fechamento">Fechamento (Checkout)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Temperatura</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['Frio', 'Morno', 'Quente'].map((temp) => (
                                    <button
                                        key={temp}
                                        onClick={() => setLeadProfile({ ...leadProfile, temperature: temp as Lead['temperature'] })}
                                        className={`px-2 py-2 text-xs font-bold rounded-md border transition-all ${
                                            leadProfile.temperature === temp
                                                ? temp === 'Quente' ? 'bg-red-50 text-red-600 border-red-200' : temp === 'Morno' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' : 'bg-blue-50 text-blue-600 border-blue-200'
                                                : 'bg-white text-gray-400 border-gem-mist hover:bg-gray-50'
                                        }`}
                                    >
                                        {temp === 'Quente' ? '🔥' : temp === 'Morno' ? '☀️' : '❄️'} {temp}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-gray-200">
                             <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                <h4 className="text-xs font-bold text-blue-800 mb-1">💡 Dica do Sales OS</h4>
                                <p className="text-xs text-blue-700 leading-relaxed">
                                    {leadProfile.temperature === 'Quente' 
                                        ? "Lead quente: Não explique demais. Envie o link de checkout e escassez." 
                                        : leadProfile.specialty === 'Cirurgião Plástico' 
                                            ? "Fale tecnicamente (ligamentos, plano profundo). Mostre autoridade." 
                                            : "Foque na segurança e na curva de aprendizado rápida."}
                                </p>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Source Modal */}
            {modalContent !== null && (
                <div 
                    className="fixed inset-0 bg-gem-offwhite/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
                    onClick={closeModal} 
                    role="dialog" 
                    aria-modal="true"
                    aria-labelledby="source-modal-title"
                >
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-gem-mist animate-fadeIn" onClick={e => e.stopPropagation()}>
                        <h3 id="source-modal-title" className="text-lg font-bold mb-4 text-gem-offwhite flex items-center">
                            <span className="bg-blue-100 text-gem-blue p-1 rounded mr-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H8z" clipRule="evenodd" />
                                </svg>
                            </span>
                            Contexto do Playbook Original
                        </h3>
                        <div 
                            className="flex-grow overflow-y-auto pr-4 text-gray-700 leading-relaxed border-y border-gray-100 py-4 font-mono text-sm bg-gray-50 p-4 rounded-md"
                            dangerouslySetInnerHTML={renderMarkdown(modalContent || '')}
                        >
                        </div>
                        <div className="flex justify-end mt-6">
                            <button onClick={closeModal} className="px-6 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors">
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