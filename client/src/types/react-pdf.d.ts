declare module 'react-pdf' {
  import { ComponentType, ReactNode } from 'react';

  export const pdfjs: {
    GlobalWorkerOptions: {
      workerSrc: string;
    };
  };

  export interface PdfDocumentLoadSuccess {
    numPages: number;
  }

  export interface DocumentProps {
    file: string;
    onLoadSuccess?: (document: PdfDocumentLoadSuccess) => void;
    onLoadError?: (error: Error) => void;
    loading?: ReactNode;
    children?: ReactNode;
  }

  export interface PageProps {
    pageNumber: number;
    width?: number;
    renderTextLayer?: boolean;
    renderAnnotationLayer?: boolean;
  }

  export const Document: ComponentType<DocumentProps>;
  export const Page: ComponentType<PageProps>;
}
