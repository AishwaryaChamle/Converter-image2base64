
import React, { useState, useRef } from 'react';
import { ProcessedFile, FileStatus } from '../types';
import { toPng } from 'html-to-image';

interface FileRowProps {
  file: ProcessedFile;
}

const FileRow: React.FC<FileRowProps> = ({ file }) => {
  const [showFullText, setShowFullText] = useState(false);
  const [jsonImageUrl, setJsonImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const jsonRef = useRef<HTMLDivElement>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard!`);
  };

  const generateJsonImage = async () => {
    if (!jsonRef.current) return;
    setIsGeneratingImage(true);
    try {
      // Temporarily show full text to capture the whole JSON
      const originalShowFull = showFullText;
      setShowFullText(true);
      
      // Wait for re-render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const dataUrl = await toPng(jsonRef.current, {
        backgroundColor: '#f8fafc',
        style: {
          padding: '20px',
          borderRadius: '12px',
        },
        // Skip problematic fonts if they fail to load
        fontEmbedCSS: '', 
        cacheBust: true,
      });
      setJsonImageUrl(dataUrl);
      setShowFullText(originalShowFull);
    } catch (err) {
      console.error('Failed to generate image', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:border-blue-300 transition-colors">
      <div className="p-4 flex flex-col md:flex-row md:items-center gap-4">
        {/* Icon & File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              file.type.includes('pdf') ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
            }`}>
              {file.type.includes('pdf') ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              )}
            </div>
            <div className="truncate">
              <h3 className="font-semibold text-slate-800 truncate" title={file.name}>{file.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{file.folderName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-start md:items-end">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              file.status === FileStatus.COMPLETED ? 'bg-green-100 text-green-800' :
              file.status === FileStatus.PROCESSING ? 'bg-blue-100 text-blue-800' :
              file.status === FileStatus.ERROR ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'
            }`}>
              {file.status === FileStatus.PROCESSING && (
                <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-blue-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              )}
              {file.status}
            </span>
            {file.error && <p className="text-[10px] text-red-500 mt-1 max-w-[150px] truncate">{file.error}</p>}
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => copyToClipboard(file.base64, 'Base64')}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Copy Base64 (Raw)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
            </button>
            {file.extractedText && (
              <button 
                onClick={() => copyToClipboard(file.extractedText, 'JSON')}
                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Copy JSON Response"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Extracted Text Area */}
      {file.extractedText && (
        <div className="border-t border-slate-100 bg-slate-50/50 p-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Extracted Data (OCR)</h4>
              <div className="flex gap-3">
                <button 
                  onClick={generateJsonImage}
                  disabled={isGeneratingImage}
                  className="text-xs text-indigo-600 font-semibold hover:underline disabled:opacity-50"
                >
                  {isGeneratingImage ? 'Generating...' : 'Export as Image'}
                </button>
                <button 
                  onClick={() => setShowFullText(!showFullText)}
                  className="text-xs text-blue-600 font-semibold hover:underline"
                >
                  {showFullText ? 'Show Less' : 'Show Full'}
                </button>
              </div>
            </div>
            
            <div 
              ref={jsonRef}
              className={`text-sm text-slate-700 bg-slate-100 p-4 rounded-lg border border-slate-200 ${showFullText ? '' : 'max-h-[500px] overflow-y-auto'}`}
            >
              {(() => {
                try {
                  const parsed = JSON.parse(file.extractedText);
                  
                  // If we have document_details, show them nicely by default
                  if (parsed.document_details && !showFullText) {
                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                          {Object.entries(parsed.document_details).map(([key, value]) => (
                            value && (
                              <div key={key} className="flex flex-col sm:flex-row sm:justify-between border-b border-slate-200 pb-1 gap-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">{key.replace(/_/g, ' ')}</span>
                                <span className="font-semibold text-slate-800 break-words">{String(value)}</span>
                              </div>
                            )
                          ))}
                        </div>

                        {/* Multi-page PDF Section */}
                        {file.pages && file.pages.length > 1 && (
                          <div className="mt-6 pt-4 border-t border-slate-200">
                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Multi-Page Document (Base64 per Page)</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {file.pages.map((p) => (
                                <div key={p.pageNumber} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-blue-600">Page {p.pageNumber}</span>
                                    <button 
                                      onClick={() => copyToClipboard(p.base64, `Page ${p.pageNumber} Base64`)}
                                      className="text-[10px] bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded font-bold transition-colors"
                                    >
                                      Copy Base64
                                    </button>
                                  </div>
                                  <div className="aspect-[3/4] bg-slate-50 rounded-lg overflow-hidden border border-slate-100">
                                    <img src={`data:image/png;base64,${p.base64}`} alt={`Page ${p.pageNumber}`} className="w-full h-full object-contain" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-4 pt-2 border-t border-slate-300 flex justify-between items-center">
                           <div className="flex flex-col">
                             <span className="text-[10px] font-bold text-slate-400 uppercase">Category</span>
                             <p className="font-bold text-blue-600">{parsed.document_category}</p>
                           </div>
                           <div className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-bold uppercase">
                             AI Verified
                           </div>
                        </div>
                      </div>
                    );
                  }

                  // Helper to truncate long strings in the object for display
                  const truncateLongStrings = (obj: any): any => {
                    if (typeof obj === 'string' && obj.length > 1000) {
                      return obj.substring(0, 50) + '... [TRUNCATED] ...' + obj.substring(obj.length - 50);
                    }
                    if (Array.isArray(obj)) {
                      return obj.map(truncateLongStrings);
                    }
                    if (obj !== null && typeof obj === 'object') {
                      return Object.fromEntries(
                        Object.entries(obj).map(([k, v]) => [k, truncateLongStrings(v)])
                      );
                    }
                    return obj;
                  };

                  const displayObj = showFullText ? parsed : truncateLongStrings(parsed);
                  return <pre className="font-mono whitespace-pre-wrap text-xs">{JSON.stringify(displayObj, null, 2)}</pre>;
                } catch (e) {
                  return <pre className="font-mono whitespace-pre-wrap text-xs">{file.extractedText}</pre>;
                }
              })()}
            </div>
          </div>

          {/* Image Preview of JSON (Generated) */}
          {jsonImageUrl && (
            <div className="mt-6 p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100 shadow-inner">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Generated Visual JSON</span>
                <button 
                  onClick={() => setJsonImageUrl(null)}
                  className="text-[10px] text-red-500 hover:underline font-bold"
                >
                  Remove
                </button>
              </div>
              <div className="flex flex-col items-center">
                <img 
                  src={jsonImageUrl} 
                  alt="JSON Preview" 
                  className="max-w-full h-auto rounded-xl border border-white shadow-lg"
                />
                <div className="mt-4">
                  <a 
                    href={jsonImageUrl} 
                    download={`json-preview-${file.name}.png`}
                    className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    Download Exported Image
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileRow;
