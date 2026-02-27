
import React, { useState, useCallback, useRef } from 'react';
import Header from './components/Header';
import FileRow from './components/FileRow';
import Base64ToImage from './components/Base64ToImage';
import { ProcessedFile, FileStatus } from './types';
import { fileToBase64, exportToExcel, splitPdfToPages } from './utils/fileUtils';
import { extractTextFromBuffer } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'i2b' | 'b2i'>('i2b');
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []) as File[];
    if (selectedFiles.length === 0) return;

    const newProcessedFiles: ProcessedFile[] = selectedFiles.map(file => {
      const folderPath = (file as any).webkitRelativePath;
      const folderName = folderPath ? folderPath.split('/')[0] : 'Root';
      
      return {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        folderName: folderName,
        type: file.type,
        size: file.size,
        base64: '',
        extractedText: '',
        status: FileStatus.PENDING
      };
    });

    setFiles(prev => [...newProcessedFiles, ...prev]);
    
    // Automatically start processing
    processAllFiles(selectedFiles, newProcessedFiles);
    
    // Reset inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  const processAllFiles = async (rawFiles: File[], placeholders: ProcessedFile[]) => {
    setIsProcessing(true);

    // Process files one by one to avoid overwhelming memory or rate limits
    for (let i = 0; i < rawFiles.length; i++) {
      const rawFile = rawFiles[i];
      const placeholderId = placeholders[i].id;

      try {
        setFiles(prev => prev.map(f => 
          f.id === placeholderId ? { ...f, status: FileStatus.PROCESSING } : f
        ));

        // 1. Convert to Base64 (or split PDF)
        let base64 = '';
        let pages: { pageNumber: number; base64: string }[] | undefined = undefined;

        if (rawFile.type === 'application/pdf') {
          try {
            pages = await splitPdfToPages(rawFile);
            // Use first page as main base64 for thumbnail/compatibility
            base64 = pages[0]?.base64 || '';
          } catch (pdfError) {
            console.error("PDF Split Error:", pdfError);
            base64 = await fileToBase64(rawFile);
          }
        } else {
          base64 = await fileToBase64(rawFile);
        }

        // 2. OCR / Extraction with Gemini
        let extractedText = '';
        try {
          const aiResponse = await extractTextFromBuffer(pages || base64, rawFile.type);
          
          // If multi-page, we might want to include the structured page data in the text
          if (pages) {
            try {
              const parsed = JSON.parse(aiResponse);
              parsed.pages = pages.map(p => ({
                page_number: p.pageNumber,
                base64_preview: p.base64.substring(0, 100) + "..." // Truncate for JSON display
              }));
              extractedText = JSON.stringify(parsed, null, 2);
            } catch (e) {
              extractedText = aiResponse;
            }
          } else {
            extractedText = aiResponse.replace('{{image_data}}', base64);
          }
        } catch (ocrError: any) {
          extractedText = "Extraction failed: " + (ocrError.message || "Unknown error");
        }

        setFiles(prev => prev.map(f => 
          f.id === placeholderId ? { 
            ...f, 
            base64, 
            pages,
            extractedText, 
            status: FileStatus.COMPLETED 
          } : f
        ));
      } catch (err: any) {
        setFiles(prev => prev.map(f => 
          f.id === placeholderId ? { 
            ...f, 
            status: FileStatus.ERROR, 
            error: err.message || "Generic error" 
          } : f
        ));
      }
    }

    setIsProcessing(false);
  };

  const clearAll = () => {
    if (window.confirm("Are you sure you want to clear all files?")) {
      setFiles([]);
    }
  };

  const downloadExcel = () => {
    const completedFiles = files.filter(f => f.status === FileStatus.COMPLETED);
    if (completedFiles.length === 0) {
      alert("No completed files to export.");
      return;
    }
    exportToExcel(completedFiles);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <Header />

      {/* Tab Switcher */}
      <div className="flex justify-center mb-8">
        <div className="bg-slate-200/50 p-1 rounded-2xl flex gap-1">
          <button
            onClick={() => setActiveTab('i2b')}
            className={`px-6 py-2 rounded-xl font-semibold transition-all ${
              activeTab === 'i2b' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Image to Base64
          </button>
          <button
            onClick={() => setActiveTab('b2i')}
            className={`px-6 py-2 rounded-xl font-semibold transition-all ${
              activeTab === 'b2i' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Base64 to Image
          </button>
        </div>
      </div>

      {activeTab === 'i2b' ? (
        <>
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8 sticky top-4 z-10 glass p-4 rounded-2xl border border-white shadow-xl">
            <div className="flex-1 flex flex-wrap gap-2">
              <label className="relative cursor-pointer group flex items-center">
                <input 
                  ref={fileInputRef}
                  type="file" 
                  multiple 
                  onChange={handleFileChange}
                  accept="image/*,application/pdf"
                  className="hidden"
                />
                <div className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-blue-200 group-active:scale-95 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                  Upload Files
                </div>
              </label>

              <label className="relative cursor-pointer group flex items-center">
                <input 
                  ref={folderInputRef}
                  type="file" 
                  // @ts-ignore
                  webkitdirectory=""
                  // @ts-ignore
                  directory=""
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-200 group-active:scale-95 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
                  Upload Folder
                </div>
              </label>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={downloadExcel}
                disabled={!files.some(f => f.status === FileStatus.COMPLETED)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-200 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-emerald-100 active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                Excel Export
              </button>
              <button 
                onClick={clearAll}
                className="flex items-center justify-center gap-2 px-4 py-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-slate-200"
                title="Clear All"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                <span className="text-sm font-semibold">Clear Output</span>
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="space-y-4">
            {files.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">
                <div className="w-20 h-20 mb-4 rounded-full bg-slate-50 flex items-center justify-center">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                </div>
                <p className="text-lg font-medium">No files uploaded yet</p>
                <p className="text-sm">Drag and drop or click the button above</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {files.map(file => (
                  <FileRow key={file.id} file={file} />
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <Base64ToImage />
      )}

      {/* Footer Info */}
      <footer className="mt-12 pt-8 border-t border-slate-200 text-center text-slate-400 text-sm">
        <p>© 2024 image2base64 App • Powered by Gemini AI</p>
        <div className="mt-2 flex justify-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Ready to process
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            {isProcessing ? 'System Processing...' : 'Idle'}
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
