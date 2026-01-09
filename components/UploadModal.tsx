/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
'use client';

import React, { useState, useCallback } from 'react';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (files: File[]) => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUpload }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);

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
    }, []);

    const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
    }, []);

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleConfirmUpload = () => {
        onUpload(files);
        handleClose();
    };

    const handleClose = () => {
        setFiles([]);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-title"
            onClick={handleClose}
        >
            <div
                className="glass-card p-8 w-full max-w-2xl relative animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 rounded-xl text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-all"
                    aria-label="Fechar modal"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-jade-gradient shadow-jade mb-4">
                        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    </div>
                    <h3 id="upload-title" className="text-2xl font-display font-bold text-surface-800">
                        Upload de Materiais
                    </h3>
                    <p className="text-surface-500 mt-1">Adicione playbooks e documentos à base de conhecimento</p>
                </div>

                {/* Drop zone */}
                <div
                    className={`
                        relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 mb-6
                        ${isDragging
                            ? 'border-jade-400 bg-jade-50/50 scale-[1.02] shadow-lg shadow-jade-500/10'
                            : 'border-surface-300 hover:border-jade-300 hover:bg-surface-50 bg-white/50'
                        }
                    `}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                >
                    <div className="flex flex-col items-center justify-center">
                        {/* Upload icon with animation */}
                        <div className={`
                            w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300
                            ${isDragging ? 'bg-jade-100 scale-110' : 'bg-surface-100'}
                        `}>
                            <svg
                                className={`w-8 h-8 transition-colors ${isDragging ? 'text-jade-600' : 'text-surface-400'}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>

                        <p className="text-lg font-medium text-surface-700 mb-1">
                            {isDragging ? 'Solte os arquivos aqui' : 'Arraste e solte seus arquivos'}
                        </p>
                        <p className="text-sm text-surface-400 mb-6">ou clique para selecionar</p>

                        <input
                            id="modal-file-upload"
                            type="file"
                            multiple
                            className="hidden"
                            onChange={handleFileChange}
                            accept=".pdf,.txt,.md,.doc,.docx"
                        />
                        <label
                            htmlFor="modal-file-upload"
                            className="btn-jade cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Selecionar Arquivos
                        </label>

                        <p className="text-xs text-surface-400 mt-4">
                            Formatos aceitos: PDF, TXT, MD, DOC, DOCX
                        </p>
                    </div>
                </div>

                {/* File list */}
                {files.length > 0 && (
                    <div className="mb-6 animate-in slide-in-from-bottom-2 duration-200">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-surface-600 uppercase tracking-wider">
                                Arquivos Selecionados
                            </h4>
                            <span className="text-xs bg-jade-100 text-jade-700 px-2 py-1 rounded-full font-medium">
                                {files.length} {files.length === 1 ? 'arquivo' : 'arquivos'}
                            </span>
                        </div>
                        <ul className="max-h-40 overflow-y-auto custom-scrollbar space-y-2">
                            {files.map((file, idx) => (
                                <li
                                    key={idx}
                                    className="flex items-center justify-between bg-surface-50 hover:bg-surface-100 p-3 rounded-xl text-sm transition-colors group"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-jade-100 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-4 h-4 text-jade-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <span className="truncate text-surface-700 font-medium">{file.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-surface-400 font-mono">
                                            {(file.size / 1024).toFixed(0)} KB
                                        </span>
                                        <button
                                            onClick={() => removeFile(idx)}
                                            className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-100 text-surface-400 hover:text-red-600 transition-all"
                                            aria-label={`Remover ${file.name}`}
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t border-surface-200">
                    <button
                        onClick={handleClose}
                        className="px-5 py-2.5 rounded-xl text-surface-600 hover:bg-surface-100 transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirmUpload}
                        disabled={files.length === 0}
                        className="btn-jade disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Fazer Upload {files.length > 0 ? `(${files.length})` : ''}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UploadModal;