
export interface ProcessedFile {
  id: string;
  name: string;
  folderName: string;
  type: string;
  size: number;
  base64: string;
  pages?: { pageNumber: number; base64: string }[];
  extractedText: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

export enum FileStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error'
}
