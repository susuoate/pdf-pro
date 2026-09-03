/**
 * Standard PDF Page Sizes in PostScript Points (72 points = 1 inch)
 */
export const PDF_PAGE_SIZES = {
  A4: { width: 595.28, height: 841.89 },
  A3: { width: 841.89, height: 1190.55 },
  A5: { width: 419.53, height: 595.28 },
  LETTER: { width: 612.0, height: 792.0 },
  LEGAL: { width: 612.0, height: 1008.0 },
  TABLOID: { width: 792.0, height: 1224.0 },
} as const;

export type StandardPageSizeKey = keyof typeof PDF_PAGE_SIZES;

export interface PageDimensions {
  width: number;
  height: number;
  rotation: number; // 0, 90, 180, 270
}

export interface PDFFileInfo {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount: number;
  dimensions: PageDimensions[];
  bytes?: ArrayBuffer;
  isEncrypted?: boolean;
  thumbnailUrls?: string[];
}

export interface PDFPageInfo {
  pageIndex: number; // 0-indexed
  pageNumber: number; // 1-indexed
  width: number;
  height: number;
  rotation: number; // 0, 90, 180, 270
  thumbnailUrl?: string;
  isDeleted?: boolean;
  customRotation?: number;
}

export interface MetadataFields {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

export interface MergeFileItem {
  id: string;
  name: string;
  bytes: ArrayBuffer;
  selectedPages?: number[]; // 0-indexed page indices
  rotations?: Record<number, number>; // pageIndex -> rotation angle
}

export interface SplitOptions {
  mode: 'ranges' | 'extract-all' | 'interval';
  ranges?: string; // e.g. "1-3, 5, 8-10"
  interval?: number; // e.g. every 2 pages
}

export interface SplitResult {
  name: string;
  bytes: Uint8Array;
  pageCount: number;
  pageRangeStr: string;
}

export interface PageOrganizeItem {
  originalIndex: number;
  rotation: number; // 0, 90, 180, 270
  isDeleted: boolean;
}

export interface RotateOptions {
  globalAngle: number; // +90, -90, 180, 270
  overrides?: Record<number, number>; // pageIndex -> rotation angle
}

export interface ExtractOptions {
  pageIndices: number[]; // 0-indexed
  mode: 'merge-single' | 'separate-files';
}

export interface ImageToPdfOptions {
  pageSize: 'A4' | 'Letter' | 'Legal' | 'Fit';
  orientation: 'auto' | 'portrait' | 'landscape';
  margin: 'none' | 'small' | 'big'; // 0, 20, 40 pt
  imageFit: 'contain' | 'fill' | 'center-original';
}

export interface CompressOptions {
  level: 'extreme' | 'recommended' | 'low';
  dpi?: number;
  quality?: number; // 0.1 to 1.0
}

export interface CompressionResult {
  originalSizeBytes: number;
  compressedSizeBytes: number;
  reductionPercentage: number;
  bytes: Uint8Array;
}

export interface WatermarkOptions {
  type: 'text' | 'image';
  text?: string;
  imageBytes?: ArrayBuffer;
  imageMime?: 'image/png' | 'image/jpeg';
  fontName?: 'Sarabun-Regular' | 'Sarabun-Bold' | 'Prompt-Regular' | 'Helvetica' | 'TimesRoman';
  fontSize?: number;
  fontColor?: string; // Hex e.g. "#FF0000"
  opacity?: number; // 0.0 to 1.0
  rotation?: number; // degrees e.g. 45
  positionMode: 'grid' | 'mosaic' | 'custom';
  gridAnchor?:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'middle-left'
    | 'center'
    | 'middle-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';
  offsetX?: number;
  offsetY?: number;
  pageRange?: string; // "all", "odd", "even", "1-5"
  layer?: 'over' | 'under';
}

export interface PageNumberOptions {
  template: string; // e.g. "Page {n} of {total}" or "หน้า {n} จาก {total}"
  position:
    | 'header-left'
    | 'header-center'
    | 'header-right'
    | 'footer-left'
    | 'footer-center'
    | 'footer-right';
  fontName?: 'Sarabun-Regular' | 'Sarabun-Bold' | 'Prompt-Regular' | 'Helvetica' | 'TimesRoman';
  fontSize?: number;
  fontColor?: string; // Hex e.g. "#000000"
  margin?: number; // points from edge (default: 30)
  startPageNumber?: number; // First numbered index (default 1)
  startFromDocPage?: number; // 1-indexed doc page to begin numbering (default 1)
  excludeFirstPage?: boolean;
  pageRange?: string; // e.g. "2-end"
}

export interface ProtectOptions {
  userPassword?: string;
  ownerPassword?: string;
  permissions?: {
    printing?: boolean;
    modifying?: boolean;
    copying?: boolean;
    annotating?: boolean;
  };
}

export interface UnlockOptions {
  password?: string;
}

export interface ProcessingProgress {
  status: string;
  percent: number; // 0 to 100
  currentStep?: number;
  totalSteps?: number;
}
