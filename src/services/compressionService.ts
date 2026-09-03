import { pdfRendererService } from './pdfRendererService';
import { pdfService } from './pdfService';
import type { CompressOptions, CompressionResult } from '../types/pdf';

export class CompressionService {
  /**
   * Compresses a PDF file buffer using dual strategies:
   * 1. Low: Structural object stream stripping and metadata optimization
   * 2. Recommended / Extreme: Canvas rasterization and JPEG stream downsampling
   */
  public async compressPDF(
    fileBytes: ArrayBuffer,
    options: CompressOptions,
    onProgress?: (percent: number, status: string) => void
  ): Promise<CompressionResult> {
    const originalSize = fileBytes.byteLength;

    if (options.level === 'low') {
      if (onProgress) onProgress(30, 'Optimizing PDF object streams...');
      const doc = await pdfService.loadDocument(fileBytes);
      if (onProgress) onProgress(70, 'Stripping redundant object dictionaries...');
      const compressedBytes = await pdfService.saveDocument(doc, { useObjectStreams: true });
      if (onProgress) onProgress(100, 'Optimization complete');

      const compressedSize = compressedBytes.byteLength;
      const reduction = Math.max(0, ((originalSize - compressedSize) / originalSize) * 100);

      return {
        originalSizeBytes: originalSize,
        compressedSizeBytes: compressedSize,
        reductionPercentage: reduction,
        bytes: compressedBytes,
      };
    }

    // Recommended or Extreme mode: rasterize pages at target DPI & Quality
    if (onProgress) onProgress(10, 'Loading PDF document into renderer...');
    const pdfDocProxy = await pdfRendererService.loadDocument(fileBytes);
    const totalPages = pdfRendererService.getPageCount(pdfDocProxy);

    const dpi = options.level === 'extreme' ? 72 : options.dpi || 120;
    const quality = options.level === 'extreme' ? 0.45 : options.quality || 0.72;

    const compressedImages: { bytes: ArrayBuffer; mimeType: string }[] = [];

    for (let i = 1; i <= totalPages; i++) {
      const pct = 10 + Math.round((i / totalPages) * 70);
      if (onProgress) onProgress(pct, `Downsampling page ${i} of ${totalPages}...`);

      const blob = await pdfRendererService.renderPageToImageBlob(pdfDocProxy, i, {
        dpi,
        format: 'jpeg',
        quality,
      });

      const buffer = await blob.arrayBuffer();
      compressedImages.push({
        bytes: buffer,
        mimeType: 'image/jpeg',
      });
    }

    if (onProgress) onProgress(85, 'Reassembling optimized document...');
    const outputBytes = await pdfService.imagesToPdf(compressedImages, {
      pageSize: 'Fit',
      orientation: 'auto',
      margin: 'none',
      imageFit: 'fill',
    });

    pdfRendererService.destroyDocument(pdfDocProxy);

    if (onProgress) onProgress(100, 'Compression complete');

    const compressedSize = outputBytes.byteLength;
    const reduction = Math.max(0, ((originalSize - compressedSize) / originalSize) * 100);

    return {
      originalSizeBytes: originalSize,
      compressedSizeBytes: compressedSize,
      reductionPercentage: reduction,
      bytes: outputBytes,
    };
  }
}

export const compressionService = new CompressionService();
