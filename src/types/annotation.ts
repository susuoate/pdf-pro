export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect extends Point, Size {}

export interface PDFBox {
  x: number; // PostScript point X (bottom-left origin)
  y: number; // PostScript point Y (bottom-left origin)
  width: number; // PostScript point width
  height: number; // PostScript point height
}

export type AnnotationToolType =
  | 'select'
  | 'draw'
  | 'highlighter'
  | 'text'
  | 'rect'
  | 'circle'
  | 'line'
  | 'arrow'
  | 'image'
  | 'stamp'
  | 'signature'
  | 'redact';

export interface BaseAnnotation {
  id: string;
  pageIndex: number;
  toolType: AnnotationToolType;
  screenBounds: Rect; // Position & size on screen viewport
  pdfBounds: PDFBox; // Translated PostScript coordinates
  opacity: number; // 0.0 to 1.0
  rotation: number; // 0 to 360 degrees
  isLocked?: boolean;
}

export interface DrawingAnnotation extends BaseAnnotation {
  toolType: 'draw' | 'highlighter';
  points: Point[]; // Screen coordinate points
  strokeColor: string; // Hex color
  strokeWidth: number; // Pixels
  isHighlighter: boolean;
}

export interface TextAnnotation extends BaseAnnotation {
  toolType: 'text';
  text: string;
  fontFamily: 'Sarabun-Regular' | 'Sarabun-Bold' | 'Prompt-Regular' | 'Helvetica' | 'TimesRoman';
  fontSize: number; // PostScript points
  fontColor: string;
  isBold: boolean;
  isItalic: boolean;
  textAlign: 'left' | 'center' | 'right';
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  padding?: number;
}

export interface ShapeAnnotation extends BaseAnnotation {
  toolType: 'rect' | 'circle' | 'line' | 'arrow';
  shapeType: 'rect' | 'circle' | 'line' | 'arrow';
  strokeColor: string;
  strokeWidth: number;
  fillColor?: string; // undefined or transparent
  startPoint: Point;
  endPoint: Point;
  lineDash?: number[];
}

export interface ImageAnnotation extends BaseAnnotation {
  toolType: 'image' | 'stamp';
  dataUrl: string;
  imageBytes?: ArrayBuffer;
  mimeType: 'image/png' | 'image/jpeg';
  naturalWidth: number;
  naturalHeight: number;
  label?: string;
}

export interface SignatureAnnotation extends BaseAnnotation {
  toolType: 'signature';
  signatureType: 'draw' | 'type' | 'upload';
  dataUrl: string; // PNG transparent data URL
  signerName?: string;
  dateStr?: string;
}

export interface RedactionAnnotation extends BaseAnnotation {
  toolType: 'redact';
  reason?: string;
  overlayText?: string;
}

export type AnnotationItem =
  | DrawingAnnotation
  | TextAnnotation
  | ShapeAnnotation
  | ImageAnnotation
  | SignatureAnnotation
  | RedactionAnnotation;
