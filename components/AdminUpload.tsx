'use client';

import { useState, useCallback, useRef } from 'react';

interface AdminUploadProps {
  password: string;
  onUploadSuccess: () => void;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export default function AdminUpload({ password, onUploadSuccess }: AdminUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [message, setMessage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setStatus('idle');
      setMessage('');
    } else {
      setStatus('error');
      setMessage('Please upload a PDF file only.');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStatus('idle');
      setMessage('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus('uploading');
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('password', password);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Upload failed on server.');
        }

        setStatus('success');
        setMessage(`✅ ${data.chunksIndexed} menu chunks indexed successfully from "${data.fileName}"`);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        onUploadSuccess();
      } else {
        const textError = await response.text();
        console.error("Server returned non-JSON response:", textError.substring(0, 200));
        throw new Error(
          `Server error (${response.status}). The server encountered an issue and could not process the file.`
        );
      }
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-amber-100 p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        Upload Menu PDF
      </h2>

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragOver
            ? 'border-amber-500 bg-amber-50 scale-[1.02]'
            : file
            ? 'border-green-400 bg-green-50'
            : 'border-gray-300 hover:border-amber-400 hover:bg-amber-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        {file ? (
          <div className="flex flex-col items-center">
            <div className="text-4xl mb-2">📄</div>
            <p className="font-medium text-gray-800">{file.name}</p>
            <p className="text-sm text-gray-500 mt-1">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="text-4xl mb-2">📤</div>
            <p className="font-medium text-gray-700">
              Drag & drop your menu PDF here
            </p>
            <p className="text-sm text-gray-500 mt-1">
              or click to browse files
            </p>
          </div>
        )}
      </div>

      {/* Upload button */}
      <button
        onClick={handleUpload}
        disabled={!file || status === 'uploading'}
        className={`mt-4 w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 ${
          !file || status === 'uploading'
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg hover:shadow-xl active:scale-[0.98]'
        }`}
      >
        {status === 'uploading' ? (
          <>
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing & Embedding...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload & Index Menu
          </>
        )}
      </button>

      {/* Status message */}
      {message && (
        <div
          className={`mt-4 p-3 rounded-xl text-sm font-medium ${
            status === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
}
