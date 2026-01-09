/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
'use client';

import React, { useState, useCallback } from 'react';
import Spinner from './Spinner';
import UploadCloudIcon from './icons/UploadCloudIcon';
import TrashIcon from './icons/TrashIcon';

interface WelcomeScreenProps {
    onUpload: () => Promise<void>;
    apiKeyError: string | null;
    files: File[];
    setFiles: React.Dispatch<React.SetStateAction<File[]>>;
    isApiKeySelected: boolean;
    onSelectKey: () => Promise<void>;
}

const sampleDocuments = [
    {
        name: 'Infos Congresso 2025',
        details: 'Preços, Lotes & Palestrantes',
        url: 'https://www.hubspot.com/hubfs/Sales_Playbook_Template.pdf',
        fileName: 'modern-face-congress-info.txt'
    },
    {
        name: 'FAQ Técnico Deep Plane',
        details: 'Objeções Cirúrgicas Comuns',
        url: 'https://docs.google.com/document/d/1wZzX9X9wZzX9X9wZzX9X9wZzX9X9wZzX9X9wZzX9/export?format=pdf',
        fileName: 'faq-tecnico-roberio.txt'
    }
];

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onUpload, apiKeyError, files, setFiles, isApiKeySelected, onSelectKey }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [loadingSample, setLoadingSample] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFiles(prev => [...prev, ...Array.from(event.target.files!)]);
        }
    };
    
    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
        if (event.dataTransfer.files) {
            setFiles(prev => [...prev, ...Array.from(event.dataTransfer.files)]);
        }
    }, [setFiles]);

    const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (!isDragging) setIsDragging(true);
    }, [isDragging]);
    
    const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
    }, []);

    const createDummyFile = (fileName: string, content: string) => {
        const blob = new Blob([content], { type: 'text/plain' });
        return new File([blob], fileName, { type: 'text/plain' });
    };

    const handleSelectSample = async (name: string, url: string, fileName: string) => {
        if (loadingSample) return;
        setLoadingSample(name);
        
        try {
            let content = "";
            if (name.includes("Congresso")) {
                content = `
                MODERN FACE CONGRESS 2025 - INFORMAÇÕES GERAIS
                DATA: 22 e 23 de Março de 2025
                LOCAL: 100% Online e Ao Vivo
                `;
            } else {
                content = `
                FAQ TÉCNICO - DR. ROBÉRIO BRANDÃO
                Q: Preciso de torre de vídeo?
                A: Não. O conceito "Video-Less Video" permite visão direta.
                `;
            }
            const file = createDummyFile(fileName, content);
            setFiles(prev => [...prev, file]);
        } catch (error) {
            console.error("Error creating sample file:", error);
        } finally {
            setLoadingSample(null);
        }
    };

    const handleConfirmUpload = async () => {
        try {
            await onUpload();
        } catch (error) {
            console.error("Upload process failed:", error);
        }
    };

    const handleRemoveFile = (indexToRemove: number) => {
        setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
    };

    const handleSelectKeyClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        await onSelectKey();
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8 bg-gem-onyx text-gem-offwhite">
            <div className="w-full max-w-3xl text-center">
                <div className="mb-4 inline-block p-4 rounded-full bg-white shadow-md">
                    <span className="text-4xl">👨‍⚕️</span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold mb-2 tracking-tight text-gem-offwhite">Modern Face Sales AI</h1>
                <p className="text-gem-offwhite/60 mb-8 text-lg">
                    Treine o <strong>Danilo</strong>, seu especialista em fechamento.
                </p>

                <div className="w-full max-w-xl mx-auto mb-8">
                     {!isApiKeySelected ? (
                        <button
                            onClick={handleSelectKeyClick}
                            className="w-full bg-gem-blue hover:bg-blue-600 shadow-lg shadow-blue-200 text-white font-semibold rounded-lg py-3 px-5 text-center transition-all"
                        >
                            Connect Gemini API Key
                        </button>
                    ) : (
                        <div className="w-full bg-green-50 border border-green-200 rounded-lg py-3 px-5 text-center text-green-700 font-semibold flex items-center justify-center gap-2">
                            API Key Connected
                        </div>
                    )}
                     {apiKeyError && <p className="text-red-500 text-sm mt-2 font-medium">{apiKeyError}</p>}
                </div>

                {/* Upload Area */}
                <div 
                    className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 mb-6 bg-white ${isDragging ? 'border-gem-blue bg-blue-50 scale-[1.02]' : 'border-gem-mist hover:border-gem-mist/80'}`}
                    onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
                >
                    <div className="flex flex-col items-center justify-center">
                        <UploadCloudIcon />
                        <p className="mt-4 text-lg text-gem-offwhite font-medium">Arraste Playbooks ou PDFs</p>
                        <input id="file-upload" type="file" multiple className="hidden" onChange={handleFileChange} accept=".pdf,.txt,.md"/>
                         <label 
                            htmlFor="file-upload" 
                            className="cursor-pointer px-6 py-2 bg-white border border-gem-mist text-gem-offwhite rounded-full font-semibold hover:bg-gray-50 transition-colors shadow-sm" 
                            tabIndex={0}
                         >
                            Buscar Arquivos
                        </label>
                    </div>
                </div>

                {files.length > 0 && (
                    <div className="w-full max-w-xl mx-auto mb-6 text-left">
                        <h4 className="font-semibold mb-3 text-gem-offwhite">Documentos Selecionados ({files.length}):</h4>
                        <ul className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {files.map((file, index) => (
                                <li key={`${file.name}-${index}`} className="text-sm bg-white border border-gem-mist p-3 rounded-lg flex justify-between items-center group shadow-sm">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <span className="text-xl">📄</span>
                                        <span className="truncate font-medium text-gem-offwhite" title={file.name}>{file.name}</span>
                                    </div>
                                    <div className="flex items-center flex-shrink-0">
                                        <span className="text-xs text-gem-offwhite/50 mr-3">{(file.size / 1024).toFixed(0)} KB</span>
                                        <button 
                                            onClick={() => handleRemoveFile(index)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <button 
                            onClick={handleConfirmUpload}
                            disabled={!isApiKeySelected}
                            className="w-full mt-4 px-6 py-4 rounded-xl bg-gem-blue hover:bg-blue-600 shadow-lg shadow-blue-200 text-white font-bold text-lg transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            Treinar Danilo Agora →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WelcomeScreen;