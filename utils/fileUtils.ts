
import * as XLSX from 'xlsx';
import { ProcessedFile } from '../types';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Extract only the base64 portion by splitting at the comma
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const exportToExcel = (files: ProcessedFile[]) => {
  const cleanObject = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(cleanObject).filter(v => v !== undefined && v !== '');
    } else if (obj !== null && typeof obj === 'object') {
      const entries = Object.entries(obj)
        .map(([k, v]) => [k, cleanObject(v)])
        .filter(([_, v]) => v !== undefined && v !== '');
      return entries.length > 0 ? Object.fromEntries(entries) : null;
    }
    return obj;
  };

  const data = files.map(f => {
    let extractedJson: any = {};
    try {
      extractedJson = JSON.parse(f.extractedText);
      extractedJson = cleanObject(extractedJson) || {};
    } catch (e) {
      extractedJson = { error: 'Invalid JSON', raw: f.extractedText };
    }

    return {
      'Folder Name': f.folderName,
      'File Name': f.name,
      'Extracted Data (JSON)': JSON.stringify(extractedJson),
      'Base64 Content': f.base64.substring(0, 32000)
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Processed Data");
  
  XLSX.writeFile(workbook, "processed_documents.xlsx");
};

export const truncateString = (str: string, length: number): string => {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
};

export const splitPdfToPages = async (file: File): Promise<{ pageNumber: number; base64: string }[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: { pageNumber: number; base64: string }[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 }); // High quality
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) continue;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await (page as any).render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    const dataUrl = canvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];
    pages.push({ pageNumber: i, base64 });
  }

  return pages;
};
