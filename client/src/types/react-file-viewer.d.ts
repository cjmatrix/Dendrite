declare module 'react-file-viewer' {
  import { ComponentType } from 'react';

  export interface ReactFileViewerProps {
    fileType: string;
    filePath: string;
    onError?: (error: Error) => void;
    errorComponent?: ComponentType<{ error: Error }>;
    unsupportedComponent?: ComponentType;
  }

  const FileViewer: ComponentType<ReactFileViewerProps>;
  export default FileViewer;
}
