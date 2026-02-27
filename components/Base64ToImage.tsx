
import React, { useState } from 'react';

const Base64ToImage: React.FC = () => {
  const [base64Input, setBase64Input] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConvert = (input?: string) => {
    const textToConvert = input !== undefined ? input : base64Input;
    setError(null);
    setPreviewUrl(null);
    setMimeType(null);

    if (!textToConvert.trim()) {
      if (input === undefined) setError('Please enter a base64 string.');
      return;
    }

    try {
      // Clean up the string (remove whitespace, newlines)
      const cleanBase64 = textToConvert.trim().replace(/\s/g, '');
      
      let finalBase64 = cleanBase64;
      let detectedMime = 'image/png'; // Default

      // Check if it already has a data URI prefix
      const match = cleanBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        detectedMime = match[1];
        finalBase64 = match[2];
      } else {
        // Try to guess mime type from the first few characters of base64
        if (cleanBase64.startsWith('iVBORw0KGgo')) detectedMime = 'image/png';
        else if (cleanBase64.startsWith('/9j/')) detectedMime = 'image/jpeg';
        else if (cleanBase64.startsWith('JVBERi0')) detectedMime = 'application/pdf';
        else if (cleanBase64.startsWith('R0lGOD')) detectedMime = 'image/gif';
        else if (cleanBase64.startsWith('UklGR')) detectedMime = 'image/webp';
      }

      const dataUrl = `data:${detectedMime};base64,${finalBase64}`;
      setPreviewUrl(dataUrl);
      setMimeType(detectedMime);
    } catch (err) {
      setError('Invalid base64 string format.');
    }
  };

  // Auto-convert on paste/change
  React.useEffect(() => {
    if (base64Input.length > 20) {
      const timer = setTimeout(() => {
        handleConvert(base64Input);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [base64Input]);

  const downloadFile = () => {
    if (!previewUrl) return;
    const link = document.createElement('a');
    link.href = previewUrl;
    const extension = mimeType?.split('/')[1] || 'png';
    link.download = `converted-file.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClear = () => {
    setBase64Input('');
    setPreviewUrl(null);
    setMimeType(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          Base64 to Image / PDF
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 uppercase tracking-wider text-[10px]">Paste Base64 String</label>
            <textarea
              value={base64Input}
              onChange={(e) => setBase64Input(e.target.value)}
              placeholder="Paste your base64 string here (with or without data:image/... prefix)"
              className="w-full h-40 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-xs resize-none bg-slate-50"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleConvert}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-100 active:scale-95 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              Convert to Preview
            </button>
            <button
              onClick={handleClear}
              className="px-6 py-3 border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100 rounded-xl font-semibold transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              Clear Output
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              {error}
            </div>
          )}
        </div>
      </div>

      {previewUrl && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              Preview
              <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase">{mimeType}</span>
            </h3>
            <button
              onClick={downloadFile}
              className="text-sm text-blue-600 font-semibold hover:underline flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              Download File
            </button>
          </div>

          <div className="rounded-2xl border border-slate-100 overflow-hidden bg-slate-50 flex items-center justify-center min-h-[300px]">
            {mimeType?.includes('pdf') ? (
              <iframe
                src={previewUrl}
                className="w-full h-[600px]"
                title="PDF Preview"
              />
            ) : (
              <img
                src={previewUrl}
                alt="Base64 Preview"
                className="max-w-full max-h-[600px] object-contain shadow-inner"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Base64ToImage;
