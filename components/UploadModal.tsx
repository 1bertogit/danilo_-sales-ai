/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
'use client';

import React, { useState, useCallback } from 'react';
import UploadCloudIcon from './icons/UploadCloudIcon';
import CarIcon from './icons/CarIcon';
import WashingMachineIcon from './icons/WashingMachineIcon';
import Spinner from './Spinner';

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

    const handleConfirmUpload = () => {
        onUpload(files);
        handleClose();
    };

    const handleClose = () => {
        setFiles([]);
        onClose();
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="upload-title">
            <div className="bg-gem-slate p-8 rounded-2xl shadow-2xl w-full max-w-2xl border border-gem-mist relative animate-fadeIn">
                <button 
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-gem-offwhite/50 hover:text-white transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h3 id="upload-title" className="text-2xl font-bold mb-6 text-gem-offwhite text-center">Upload Sales Materials</h3>
                
                <div 
                    className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 mb-6 bg-gem-onyx/50 ${isDragging ? 'border-gem-blue bg-blue-900/20 scale-[1.02]' : 'border-gem-mist hover:border-gem-mist/80'}`}
                    onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
                >
                    <div className="flex flex-col items-center justify-center">
                        <UploadCloudIcon />
                        <p className="mt-4 text-lg text-gem-offwhite font-medium">Drag & Drop Playbooks</p>
                        <p className="text-sm text-gem-offwhite/50 mb-6">or click to browse</p>
                        
                        <input 
                            id="modal-file-upload" 
                            type="file" 
                            multiple 
                            className="hidden" 
                            onChange={handleFileChange} 
                            accept=".pdf,.txt,.md"
                        />
                        <label 
                            htmlFor="modal-file-upload" 
                            className="cursor-pointer px-6 py-2 bg-gem-blue hover:bg-blue-600 text-white rounded-full font-semibold transition-colors shadow-lg shadow-blue-900/20"
                        >
                            Browse Files
                        </label>
                    </div>
                </div>

                {files.length > 0 && (
                    <div className="mb-6">
                        <h4 className="text-sm font-semibold text-gem-offwhite/70 mb-2 uppercase tracking-wider">Ready to Upload</h4>
                        <ul className="max-h-32 overflow-y-auto custom-scrollbar space-y-2">
                            {files.map((file, idx) => (
                                <li key={idx} className="flex items-center justify-between bg-gem-mist/30 p-2 rounded text-sm text-gem-offwhite">
                                    <span className="truncate max-w-[80%]">{file.name}</span>
                                    <span className="text-xs text-gem-offwhite/50">{(file.size / 1024).toFixed(0)} KB</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gem-mist">
                    <button 
                        onClick={handleClose}
                        className="px-5 py-2.5 rounded-lg text-gem-offwhite hover:bg-gem-mist transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleConfirmUpload}
                        disabled={files.length === 0}
                        className="px-6 py-2.5 rounded-lg bg-gem-blue hover:bg-blue-600 text-white font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Upload {files.length > 0 ? `(${files.length})` : ''}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UploadModal;