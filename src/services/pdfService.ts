import { PDFDocument, degrees, PageSizes, PDFPage } from 'pdf-lib';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt';
import type {
  MergeFileItem,
  SplitOptions,
  SplitResult,
  PageOrganizeItem,
  MetadataFields,
  ProtectOptions,
  ImageToPdfOptions,
} from '../types/pdf';
import { parsePageRange } from '../utils/formatters';
import { pdfRendererService } from './pdfRendererService';

export class PdfService {
  /**
   * Creates a new blank PDFDocument instance.
   */
  public async createDocument(): Promise<PDFDocument> {
    return await PDFDocument.create();
  }

  /**
   * Loads an existing PDF from ArrayBuffer or Uint8Array.
   */
  public async loadDocument(
    data: ArrayBuffer | Uint8Array,
    options?: { ignoreEncryption?: boolean }
  ): Promise<PDFDocument> {
    const rawBuffer = data instanceof Uint8Array ? data.buffer : data;
    const clonedData = new Uint8Array(rawBuffer.slice(0));
    return await PDFDocument.load(clonedData, {
      ignoreEncryption: options?.ignoreEncryption,
    });
  }

  /**
   * Copies pages from source document to destination document.
   */
  public async copyPages(
    srcDoc: PDFDocument,
    destDoc: PDFDocument,
    pageIndices: number[]
  ): Promise<PDFPage[]> {
    const copiedPages = await destDoc.copyPages(srcDoc, pageIndices);
    copiedPages.forEach((page) => destDoc.addPage(page));
    return copiedPages;
  }

  /**
   * Serializes a PDFDocument to Uint8Array.
   */
  public async saveDocument(
    doc: PDFDocument,
    options: { useObjectStreams?: boolean } = { useObjectStreams: true }
  ): Promise<Uint8Array> {
    return await doc.save({ useObjectStreams: options.useObjectStreams });
  }

  /**
   * Merge multiple PDF files into a single unified document.
   */
  public async mergePDFs(files: MergeFileItem[]): Promise<Uint8Array> {
    const mergedDoc = await PDFDocument.create();

    for (const fileItem of files) {
      const srcDoc = await PDFDocument.load(fileItem.bytes);
      const totalPages = srcDoc.getPageCount();
      const pageIndices = fileItem.selectedPages ?? Array.from({ length: totalPages }, (_, i) => i);

      const copiedPages = await mergedDoc.copyPages(srcDoc, pageIndices);

      copiedPages.forEach((page, idx) => {
        const originalPageIndex = pageIndices[idx];
        if (fileItem.rotations && fileItem.rotations[originalPageIndex] !== undefined) {
          const addRot = fileItem.rotations[originalPageIndex];
          const currAngle = page.getRotation().angle;
          page.setRotation(degrees((currAngle + addRot) % 360));
        }
        mergedDoc.addPage(page);
      });
    }

    return await mergedDoc.save({ useObjectStreams: true });
  }

  /**
   * Split a single PDF into multiple documents by ranges, interval, or extract-all.
   */
  public async splitPDF(
    fileBytes: ArrayBuffer,
    options: SplitOptions,
    baseFilename: string = 'document'
  ): Promise<SplitResult[]> {
    const srcDoc = await PDFDocument.load(fileBytes);
    const totalPages = srcDoc.getPageCount();
    const results: SplitResult[] = [];

    if (options.mode === 'extract-all') {
      for (let i = 0; i < totalPages; i++) {
        const singleDoc = await PDFDocument.create();
        const [copiedPage] = await singleDoc.copyPages(srcDoc, [i]);
        singleDoc.addPage(copiedPage);
        const bytes = await singleDoc.save({ useObjectStreams: true });
        results.push({
          name: `${baseFilename}_page_${i + 1}.pdf`,
          bytes,
          pageCount: 1,
          pageRangeStr: `${i + 1}`,
        });
      }
    } else if (options.mode === 'interval') {
      const interval = Math.max(1, options.interval || 1);
      for (let start = 0; start < totalPages; start += interval) {
        const end = Math.min(start + interval - 1, totalPages - 1);
        const rangeIndices: number[] = [];
        for (let j = start; j <= end; j++) rangeIndices.push(j);

        const chunkDoc = await PDFDocument.create();
        const copiedPages = await chunkDoc.copyPages(srcDoc, rangeIndices);
        copiedPages.forEach((p) => chunkDoc.addPage(p));
        const bytes = await chunkDoc.save({ useObjectStreams: true });

        results.push({
          name: `${baseFilename}_pages_${start + 1}-${end + 1}.pdf`,
          bytes,
          pageCount: rangeIndices.length,
          pageRangeStr: `${start + 1}-${end + 1}`,
        });
      }
    } else {
      // Range mode (e.g. "1-3, 5, 8-10")
      const rangeGroups = (options.ranges || `1-${totalPages}`)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      for (let idx = 0; idx < rangeGroups.length; idx++) {
        const groupStr = rangeGroups[idx];
        const pageIndices = parsePageRange(groupStr, totalPages);
        if (pageIndices.length === 0) continue;

        const rangeDoc = await PDFDocument.create();
        const copiedPages = await rangeDoc.copyPages(srcDoc, pageIndices);
        copiedPages.forEach((p) => rangeDoc.addPage(p));
        const bytes = await rangeDoc.save({ useObjectStreams: true });

        results.push({
          name: `${baseFilename}_split_${idx + 1}.pdf`,
          bytes,
          pageCount: pageIndices.length,
          pageRangeStr: groupStr,
        });
      }
    }

    return results;
  }

  /**
   * Organize, reorder, rotate, and delete pages.
   */
  public async organizePDF(
    fileBytes: ArrayBuffer,
    pageItems: PageOrganizeItem[]
  ): Promise<Uint8Array> {
    const srcDoc = await PDFDocument.load(fileBytes);
    const destDoc = await PDFDocument.create();

    const activeItems = pageItems.filter((item) => !item.isDeleted);
    const indicesToCopy = activeItems.map((item) => item.originalIndex);

    const copiedPages = await destDoc.copyPages(srcDoc, indicesToCopy);

    copiedPages.forEach((page, idx) => {
      const item = activeItems[idx];
      if (item.rotation !== 0) {
        const curr = page.getRotation().angle;
        page.setRotation(degrees((curr + item.rotation) % 360));
      }
      destDoc.addPage(page);
    });

    return await destDoc.save({ useObjectStreams: true });
  }

  /**
   * Rotate all or specific pages of a PDF.
   */
  public async rotatePDF(
    fileBytes: ArrayBuffer,
    globalAngle: number,
    overrides?: Record<number, number>
  ): Promise<Uint8Array> {
    const doc = await PDFDocument.load(fileBytes);
    const pages = doc.getPages();

    pages.forEach((page, idx) => {
      const angleToAdd = overrides && overrides[idx] !== undefined ? overrides[idx] : globalAngle;
      const current = page.getRotation().angle;
      page.setRotation(degrees((current + angleToAdd) % 360));
    });

    return await doc.save({ useObjectStreams: true });
  }

  /**
   * Extract selected pages into a standalone PDF or separate files.
   */
  public async extractPages(
    fileBytes: ArrayBuffer,
    pageIndices: number[],
    mergeIntoSingle: boolean = true,
    baseFilename: string = 'extracted'
  ): Promise<Uint8Array | SplitResult[]> {
    const srcDoc = await PDFDocument.load(fileBytes);

    if (mergeIntoSingle) {
      const destDoc = await PDFDocument.create();
      const copiedPages = await destDoc.copyPages(srcDoc, pageIndices);
      copiedPages.forEach((p) => destDoc.addPage(p));
      return await destDoc.save({ useObjectStreams: true });
    } else {
      const results: SplitResult[] = [];
      for (const pageIdx of pageIndices) {
        const singleDoc = await PDFDocument.create();
        const [copiedPage] = await singleDoc.copyPages(srcDoc, [pageIdx]);
        singleDoc.addPage(copiedPage);
        const bytes = await singleDoc.save({ useObjectStreams: true });
        results.push({
          name: `${baseFilename}_page_${pageIdx + 1}.pdf`,
          bytes,
          pageCount: 1,
          pageRangeStr: `${pageIdx + 1}`,
        });
      }
      return results;
    }
  }

  /**
   * Converts a list of image buffers into a structured PDF document.
   */
  public async imagesToPdf(
    images: { bytes: ArrayBuffer; mimeType: string }[],
    options: ImageToPdfOptions
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();

    const marginPt = options.margin === 'big' ? 40 : options.margin === 'small' ? 20 : 0;

    for (const img of images) {
      let embeddedImage;
      if (img.mimeType === 'image/jpeg' || img.mimeType === 'image/jpg') {
        embeddedImage = await pdfDoc.embedJpg(img.bytes);
      } else {
        // PNG or WebP
        embeddedImage = await pdfDoc.embedPng(img.bytes);
      }

      let pageWidth: number;
      let pageHeight: number;

      if (options.pageSize === 'Fit') {
        pageWidth = embeddedImage.width + 2 * marginPt;
        pageHeight = embeddedImage.height + 2 * marginPt;
      } else {
        const stdSize = PageSizes[options.pageSize as 'A4' | 'Letter' | 'Legal'] || PageSizes.A4;
        const [w, h] = stdSize;

        if (options.orientation === 'landscape') {
          pageWidth = Math.max(w, h);
          pageHeight = Math.min(w, h);
        } else if (options.orientation === 'portrait') {
          pageWidth = Math.min(w, h);
          pageHeight = Math.max(w, h);
        } else {
          // Auto orientation matching image aspect ratio
          if (embeddedImage.width > embeddedImage.height) {
            pageWidth = Math.max(w, h);
            pageHeight = Math.min(w, h);
          } else {
            pageWidth = Math.min(w, h);
            pageHeight = Math.max(w, h);
          }
        }
      }

      const availWidth = pageWidth - 2 * marginPt;
      const availHeight = pageHeight - 2 * marginPt;

      let drawWidth: number;
      let drawHeight: number;

      if (options.imageFit === 'fill') {
        drawWidth = availWidth;
        drawHeight = availHeight;
      } else if (options.imageFit === 'center-original') {
        drawWidth = embeddedImage.width;
        drawHeight = embeddedImage.height;
      } else {
        // Contain (preserve aspect ratio)
        const scale = Math.min(availWidth / embeddedImage.width, availHeight / embeddedImage.height);
        drawWidth = embeddedImage.width * scale;
        drawHeight = embeddedImage.height * scale;
      }

      const drawX = marginPt + (availWidth - drawWidth) / 2;
      const drawY = marginPt + (availHeight - drawHeight) / 2;

      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      page.drawImage(embeddedImage, {
        x: drawX,
        y: drawY,
        width: drawWidth,
        height: drawHeight,
      });
    }

    return await pdfDoc.save({ useObjectStreams: true });
  }

  /**
   * Retrieves document metadata dictionary.
   */
  public async getMetadata(fileBytes: ArrayBuffer): Promise<MetadataFields> {
    const doc = await PDFDocument.load(fileBytes);
    return {
      title: doc.getTitle() || '',
      author: doc.getAuthor() || '',
      subject: doc.getSubject() || '',
      keywords: doc.getKeywords() ? doc.getKeywords()!.split(' ') : [],
      creator: doc.getCreator() || '',
      producer: doc.getProducer() || '',
      creationDate: doc.getCreationDate(),
      modificationDate: doc.getModificationDate(),
    };
  }

  /**
   * Updates or sanitizes document metadata.
   */
  public async updateMetadata(
    fileBytes: ArrayBuffer,
    metadata: MetadataFields,
    sanitize: boolean = false
  ): Promise<Uint8Array> {
    const doc = await PDFDocument.load(fileBytes);

    if (sanitize) {
      doc.setTitle('');
      doc.setAuthor('');
      doc.setSubject('');
      doc.setKeywords([]);
      doc.setCreator('');
      doc.setProducer('');
      doc.setCreationDate(new Date());
      doc.setModificationDate(new Date());
    } else {
      if (metadata.title !== undefined) doc.setTitle(metadata.title);
      if (metadata.author !== undefined) doc.setAuthor(metadata.author);
      if (metadata.subject !== undefined) doc.setSubject(metadata.subject);
      if (metadata.keywords !== undefined) doc.setKeywords(metadata.keywords);
      if (metadata.creator !== undefined) doc.setCreator(metadata.creator);
      if (metadata.producer !== undefined) doc.setProducer(metadata.producer);
      doc.setModificationDate(new Date());
    }

    return await doc.save({ useObjectStreams: true });
  }

  /**
   * Protects a PDF with standard user/owner password encryption (AES-256 / RC4).
   */
  public async protectPDF(fileBytes: ArrayBuffer, options?: ProtectOptions): Promise<Uint8Array> {
    const rawBuffer = fileBytes instanceof Uint8Array ? fileBytes : new Uint8Array(fileBytes);
    const userPassword = options?.userPassword || options?.ownerPassword || '';

    if (!userPassword) {
      const doc = await PDFDocument.load(rawBuffer);
      return await doc.save({ useObjectStreams: true });
    }

    // First ensure clean standard PDF bytes from pdf-lib
    const cleanDoc = await PDFDocument.load(rawBuffer, { ignoreEncryption: true });
    const cleanBytes = await cleanDoc.save({ useObjectStreams: false });

    // Apply standard PDF AES-256 password encryption
    const encryptedBytes = await encryptPDF(cleanBytes, userPassword, {
      ownerPassword: options?.ownerPassword || userPassword,
      algorithm: 'AES-256',
      allowPrinting: options?.permissions?.printing ?? true,
      allowModifying: options?.permissions?.modifying ?? false,
      allowCopying: options?.permissions?.copying ?? true,
      allowAnnotating: options?.permissions?.annotating ?? true,
    });

    return encryptedBytes;
  }

  /**
   * Decrypts and permanently unlocks a password protected PDF.
   */
  public async unlockPDF(fileBytes: ArrayBuffer, password?: string): Promise<Uint8Array> {
    const rawBuffer = fileBytes instanceof Uint8Array ? fileBytes : new Uint8Array(fileBytes);
    const pwd = password?.trim() || undefined;

    // Load and decrypt using PDF.js cryptographic engine
    const docProxy = await pdfRendererService.loadDocument(rawBuffer, pwd);
    const numPages = docProxy.numPages;
    const cleanDoc = await PDFDocument.create();

    for (let i = 1; i <= numPages; i++) {
      const imgBlob = await pdfRendererService.renderPageToImageBlob(docProxy, i, {
        dpi: 300,
        format: 'png',
        quality: 1.0,
      });
      const imgBuffer = await imgBlob.arrayBuffer();
      const embeddedImg = await cleanDoc.embedPng(imgBuffer);
      const page = cleanDoc.addPage([embeddedImg.width, embeddedImg.height]);
      page.drawImage(embeddedImg, {
        x: 0,
        y: 0,
        width: embeddedImg.width,
        height: embeddedImg.height,
      });
    }

    pdfRendererService.destroyDocument(docProxy);
    return await cleanDoc.save({ useObjectStreams: true });
  }
}

export const pdfService = new PdfService();
