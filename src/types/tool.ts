export type ToolCategory = 'organize' | 'convert' | 'edit' | 'security';

export type ToolId =
  | 'merge'
  | 'split'
  | 'organize'
  | 'rotate'
  | 'extract'
  | 'img2pdf'
  | 'pdf2img'
  | 'compress'
  | 'ocr'
  | 'editor'
  | 'watermark'
  | 'pageNumbers'
  | 'sign'
  | 'protect'
  | 'unlock'
  | 'redact'
  | 'metadata';

export interface ToolMeta {
  id: ToolId;
  titleKey: string;
  descriptionKey: string;
  iconName: string;
  category: ToolCategory;
  badge?: 'popular' | 'new' | 'privacy';
  path: string;
  acceptedMimeTypes: string[];
  maxFiles: number;
  minFiles: number;
  allowsMultiFile: boolean;
  requiresPasswordSupport?: boolean;
}

export type WorkspacePhase = 'upload' | 'configure' | 'processing' | 'result';

export interface ToolExecutionResult {
  success: boolean;
  outputBlob?: Blob;
  outputFilename: string;
  originalSizeBytes?: number;
  outputSizeBytes?: number;
  zipEntries?: Array<{ name: string; blob: Blob }>;
  error?: string;
}
