import type { Point, Size, Rect, PDFBox } from '../types/annotation';

export type GridAnchor =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'center'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

/**
 * Normalizes any rotation angle to standard 0, 90, 180, 270 degrees.
 */
export function normalizeRotation(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

/**
 * Converts screen viewport bounding box to PDF point coordinates with rotation handling.
 */
export function screenToPdfCoordinates(
  screenBox: Rect,
  viewportSize: Size,
  pdfPageSize: Size,
  rotationAngle: number = 0
): PDFBox {
  const scaleX = pdfPageSize.width / viewportSize.width;
  const scaleY = pdfPageSize.height / viewportSize.height;
  const rot = normalizeRotation(rotationAngle);

  switch (rot) {
    case 90:
      return {
        x: screenBox.y * scaleX,
        y: screenBox.x * scaleY,
        width: screenBox.height * scaleX,
        height: screenBox.width * scaleY,
      };
    case 180:
      return {
        x: (viewportSize.width - screenBox.x - screenBox.width) * scaleX,
        y: screenBox.y * scaleY,
        width: screenBox.width * scaleX,
        height: screenBox.height * scaleY,
      };
    case 270:
      return {
        x: (viewportSize.height - screenBox.y - screenBox.height) * scaleX,
        y: (viewportSize.width - screenBox.x - screenBox.width) * scaleY,
        width: screenBox.height * scaleX,
        height: screenBox.width * scaleY,
      };
    case 0:
    default:
      return {
        x: screenBox.x * scaleX,
        y: (viewportSize.height - screenBox.y - screenBox.height) * scaleY,
        width: screenBox.width * scaleX,
        height: screenBox.height * scaleY,
      };
  }
}

/**
 * Converts PDF point coordinates back to screen viewport bounding box.
 */
export function pdfToScreenCoordinates(
  pdfBox: PDFBox,
  viewportSize: Size,
  pdfPageSize: Size,
  rotationAngle: number = 0
): Rect {
  const scaleX = viewportSize.width / pdfPageSize.width;
  const scaleY = viewportSize.height / pdfPageSize.height;
  const rot = normalizeRotation(rotationAngle);

  switch (rot) {
    case 90:
      return {
        x: pdfBox.y * scaleX,
        y: pdfBox.x * scaleY,
        width: pdfBox.height * scaleX,
        height: pdfBox.width * scaleY,
      };
    case 180:
      return {
        x: viewportSize.width - (pdfBox.x + pdfBox.width) * scaleX,
        y: pdfBox.y * scaleY,
        width: pdfBox.width * scaleX,
        height: pdfBox.height * scaleY,
      };
    case 270:
      return {
        x: viewportSize.width - (pdfBox.y + pdfBox.height) * scaleX,
        y: viewportSize.height - (pdfBox.x + pdfBox.width) * scaleY,
        width: pdfBox.height * scaleX,
        height: pdfBox.width * scaleY,
      };
    case 0:
    default:
      return {
        x: pdfBox.x * scaleX,
        y: viewportSize.height - (pdfBox.y + pdfBox.height) * scaleY,
        width: pdfBox.width * scaleX,
        height: pdfBox.height * scaleY,
      };
  }
}

/**
 * Converts a single screen point to a PDF point.
 */
export function screenToPdfPoint(
  point: Point,
  viewportSize: Size,
  pdfPageSize: Size,
  rotationAngle: number = 0
): Point {
  const box = screenToPdfCoordinates(
    { x: point.x, y: point.y, width: 0, height: 0 },
    viewportSize,
    pdfPageSize,
    rotationAngle
  );
  return { x: box.x, y: box.y };
}

/**
 * Calculates fit dimensions for images and canvases maintaining aspect ratio.
 */
export function calculateFitDimensions(
  srcWidth: number,
  srcHeight: number,
  maxWidth: number,
  maxHeight: number,
  fitMode: 'contain' | 'cover' | 'fill' = 'contain'
): { width: number; height: number; x: number; y: number } {
  if (fitMode === 'fill') {
    return { width: maxWidth, height: maxHeight, x: 0, y: 0 };
  }

  const scale =
    fitMode === 'contain'
      ? Math.min(maxWidth / srcWidth, maxHeight / srcHeight)
      : Math.max(maxWidth / srcWidth, maxHeight / srcHeight);

  const width = srcWidth * scale;
  const height = srcHeight * scale;
  const x = (maxWidth - width) / 2;
  const y = (maxHeight - height) / 2;

  return { width, height, x, y };
}

/**
 * Computes 9-grid anchor coordinate in PDF point space.
 */
export function getAnchorPosition(
  anchor: GridAnchor,
  pageSize: Size,
  contentSize: Size,
  margin: number = 30
): Point {
  let x = margin;
  let y = margin;

  // X coordinate
  if (anchor === 'top-left' || anchor === 'middle-left' || anchor === 'bottom-left') {
    x = margin;
  } else if (anchor === 'top-center' || anchor === 'center' || anchor === 'bottom-center') {
    x = (pageSize.width - contentSize.width) / 2;
  } else {
    // right
    x = pageSize.width - contentSize.width - margin;
  }

  // Y coordinate (PDF space: 0 is bottom)
  if (anchor === 'bottom-left' || anchor === 'bottom-center' || anchor === 'bottom-right') {
    y = margin;
  } else if (anchor === 'middle-left' || anchor === 'center' || anchor === 'middle-right') {
    y = (pageSize.height - contentSize.height) / 2;
  } else {
    // top
    y = pageSize.height - contentSize.height - margin;
  }

  return { x, y };
}
