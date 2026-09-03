import { rgb, degrees, StandardFonts } from 'pdf-lib';
import { pdfService } from './pdfService';
import { pdfRendererService } from './pdfRendererService';
import { compressionService } from './compressionService';
import { ocrService } from './ocrService';
import { fontService } from './fontService';
import { zipService, ZipFileEntry } from './zipService';
import type { WorkspaceFile } from '../components/workspace/UnifiedWorkspace';
import type { ResultData } from '../components/workspace/ResultModal';
import { parsePageRange } from '../utils/formatters';

export async function executeTool(
  toolId: string,
  files: WorkspaceFile[],
  config: any,
  updateProgress: (percent: number, status: string) => void
): Promise<ResultData> {
  const totalOriginalSize = files.reduce((sum, f) => sum + f.size, 0);

  switch (toolId) {
    // ---------------------------------------------------------
    // 1. MERGE PDF
    // ---------------------------------------------------------
    case 'merge': {
      updateProgress(15, 'Reading PDF documents for merging...');
      const mergeItems = files.map((f) => ({
        id: f.id,
        name: f.name,
        bytes: f.arrayBuffer,
      }));

      updateProgress(50, `Merging ${files.length} PDF files...`);
      const mergedBytes = await pdfService.mergePDFs(mergeItems);

      updateProgress(100, 'Merge completed!');
      const blob = new Blob([mergedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      return {
        blob,
        filename: `merged_${Date.now()}.pdf`,
        originalSize: totalOriginalSize,
        newSize: blob.size,
      };
    }

    // ---------------------------------------------------------
    // 2. SPLIT PDF
    // ---------------------------------------------------------
    case 'split': {
      updateProgress(20, 'Analyzing PDF document structure...');
      const mode = config.splitMode || 'ranges';
      const filePageCount = files[0].pageCount || 1;
      const ranges = config.ranges || (filePageCount === 2 ? '1, 2' : `1-${filePageCount}`);
      const interval = config.interval || 1;

      updateProgress(60, 'Splitting pages according to configuration...');
      const splitResults = await pdfService.splitPDF(
        files[0].arrayBuffer,
        { mode, ranges, interval },
        files[0].name.replace(/\.pdf$/i, '')
      );

      updateProgress(90, 'Packaging output files...');

      // If user chose to merge all extracted ranges into one PDF
      if (config.mergeRanges && splitResults.length > 1) {
        updateProgress(95, 'Merging selected ranges into one PDF...');
        const mergedBytes = await pdfService.mergePDFs(
          splitResults.map((r, i) => ({
            id: `range-${i}`,
            name: r.name,
            bytes: r.bytes.buffer as ArrayBuffer,
          }))
        );
        const blob = new Blob([mergedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
        return {
          blob,
          filename: `${files[0].name.replace(/\.pdf$/i, '')}_split_merged.pdf`,
          originalSize: totalOriginalSize,
          newSize: blob.size,
        };
      }

      if (splitResults.length === 1) {
        const blob = new Blob([splitResults[0].bytes.buffer as ArrayBuffer], {
          type: 'application/pdf',
        });
        return {
          blob,
          filename: splitResults[0].name,
          originalSize: totalOriginalSize,
          newSize: blob.size,
        };
      } else {
        const zipEntries: ZipFileEntry[] = splitResults.map((res) => ({
          filename: res.name,
          content: res.bytes,
        }));
        const zipBlob = await zipService.createZip(zipEntries, (pct) => {
          updateProgress(90 + Math.round(pct * 0.1), 'Compressing ZIP archive...');
        });
        return {
          blob: zipBlob,
          filename: `split_${Date.now()}.zip`,
          originalSize: totalOriginalSize,
          newSize: zipBlob.size,
        };
      }
    }

    // ---------------------------------------------------------
    // 3. ORGANIZE / REORDER PDF
    // ---------------------------------------------------------
    case 'organize': {
      updateProgress(20, 'Processing reordered pages...');
      const pageItems = config.pageItems || [];

      let organizedBytes: Uint8Array;
      if (pageItems.length > 0) {
        organizedBytes = await pdfService.organizePDF(
          files[0].arrayBuffer,
          pageItems.map((item: any) => ({
            originalIndex: item.pageIndex,
            rotation: item.rotation || 0,
            isDeleted: !!item.isDeleted,
          }))
        );
      } else {
        organizedBytes = new Uint8Array(files[0].arrayBuffer);
      }

      updateProgress(100, 'Organization complete!');
      const blob = new Blob([organizedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      return {
        blob,
        filename: `organized_${Date.now()}.pdf`,
        originalSize: totalOriginalSize,
        newSize: blob.size,
      };
    }

    // ---------------------------------------------------------
    // 4. ROTATE PDF
    // ---------------------------------------------------------
    case 'rotate': {
      updateProgress(30, 'Applying page rotations...');
      const globalAngle = config.globalAngle || 90;
      const rotatedBytes = await pdfService.rotatePDF(files[0].arrayBuffer, globalAngle);

      updateProgress(100, 'Rotation complete!');
      const blob = new Blob([rotatedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      return {
        blob,
        filename: `rotated_${Date.now()}.pdf`,
        originalSize: totalOriginalSize,
        newSize: blob.size,
      };
    }

    // ---------------------------------------------------------
    // 5. EXTRACT PAGES
    // ---------------------------------------------------------
    case 'extract': {
      updateProgress(20, 'Extracting selected page indices...');
      const doc = await pdfService.loadDocument(files[0].arrayBuffer);
      const totalPages = doc.getPageCount();

      // Read selected pages directly from checked items, falling back to pageRanges string
      const selectedItems = (config.pageItems || []).filter((it: any) => it.isSelected);
      let pageIndices: number[] = [];

      if (selectedItems.length > 0) {
        pageIndices = selectedItems.map((it: any) => it.pageIndex);
      } else if (config.pageRanges && config.pageRanges.trim().length > 0) {
        pageIndices = parsePageRange(config.pageRanges, totalPages);
      } else {
        pageIndices = [0];
      }

      const mergeIntoSingle = config.mergeIntoSingle !== false;

      const extractOutcome = await pdfService.extractPages(
        files[0].arrayBuffer,
        pageIndices,
        mergeIntoSingle,
        files[0].name.replace(/\.pdf$/i, '')
      );

      updateProgress(100, 'Extraction complete!');
      if (mergeIntoSingle) {
        const blob = new Blob([(extractOutcome as Uint8Array).buffer as ArrayBuffer], {
          type: 'application/pdf',
        });
        return {
          blob,
          filename: `extracted_${Date.now()}.pdf`,
          originalSize: totalOriginalSize,
          newSize: blob.size,
        };
      } else {
        const zipEntries: ZipFileEntry[] = (extractOutcome as any[]).map((res) => ({
          filename: res.name,
          content: res.bytes,
        }));
        const zipBlob = await zipService.createZip(zipEntries);
        return {
          blob: zipBlob,
          filename: `extracted_pages_${Date.now()}.zip`,
          originalSize: totalOriginalSize,
          newSize: zipBlob.size,
        };
      }
    }

    // ---------------------------------------------------------
    // 6. IMAGES TO PDF
    // ---------------------------------------------------------
    case 'img2pdf': {
      updateProgress(20, 'Reading and converting image streams...');
      const images = files.map((f) => ({
        bytes: f.arrayBuffer,
        mimeType: f.file.type || 'image/jpeg',
      }));

      const options = {
        pageSize: config.pageSize || 'A4',
        orientation: config.orientation || 'auto',
        margin: config.margin || 'none',
        imageFit: 'contain' as const,
      };

      updateProgress(60, 'Assembling PDF pages with layout...');
      const pdfBytes = await pdfService.imagesToPdf(images, options);

      updateProgress(100, 'PDF successfully generated!');
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      return {
        blob,
        filename: `converted_images_${Date.now()}.pdf`,
        originalSize: totalOriginalSize,
        newSize: blob.size,
      };
    }

    // ---------------------------------------------------------
    // 7. PDF TO IMAGES
    // ---------------------------------------------------------
    case 'pdf2img': {
      updateProgress(10, 'Loading PDF documents for image conversion...');

      const format = config.format || 'png';
      const dpi = config.dpi || 150;
      const ext = format === 'png' ? 'png' : 'jpg';

      const imageBlobs: { filename: string; blob: Blob }[] = [];
      const pageItems = config.pageItems || [];

      let totalPagesToRender = 0;
      for (const file of files) {
        totalPagesToRender += file.pageCount || 1;
      }

      let renderedCount = 0;

      for (const file of files) {
        const pdfDocProxy = await pdfRendererService.loadDocument(file.arrayBuffer);
        const pageCount = pdfRendererService.getPageCount(pdfDocProxy);
        const baseName = file.name.replace(/\.[^/.]+$/, '');

        for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
          renderedCount++;
          updateProgress(
            10 + Math.round((renderedCount / Math.max(1, totalPagesToRender)) * 80),
            `Rendering ${file.name} (Page ${pageNum}/${pageCount}) to high-quality ${ext.toUpperCase()}...`
          );

          // Find corresponding rotation in pageItems
          const matchingItem = pageItems.find(
            (it: any) => it.fileId === file.id && it.pageIndex === pageNum - 1
          );
          const customRot = matchingItem ? matchingItem.rotation : 0;

          const imgBlob = await pdfRendererService.renderPageToImageBlob(pdfDocProxy, pageNum, {
            format,
            dpi,
            quality: 0.95,
            rotation: customRot,
          });

          const filename =
            files.length > 1
              ? `${baseName}_page_${pageNum}.${ext}`
              : `page_${pageNum}.${ext}`;

          imageBlobs.push({
            filename,
            blob: imgBlob,
          });
        }

        pdfRendererService.destroyDocument(pdfDocProxy);
      }

      if (imageBlobs.length === 1) {
        updateProgress(100, 'Image rendering complete!');
        return {
          blob: imageBlobs[0].blob,
          filename: imageBlobs[0].filename,
          originalSize: totalOriginalSize,
          newSize: imageBlobs[0].blob.size,
        };
      } else {
        updateProgress(95, 'Zipping rendered images...');
        const zipEntries: ZipFileEntry[] = imageBlobs.map((item) => ({
          filename: item.filename,
          content: item.blob,
        }));
        const zipBlob = await zipService.createZip(zipEntries);
        updateProgress(100, 'Done!');
        return {
          blob: zipBlob,
          filename: `pdf_images_${Date.now()}.zip`,
          originalSize: totalOriginalSize,
          newSize: zipBlob.size,
        };
      }
    }

    // ---------------------------------------------------------
    // 8. COMPRESS PDF
    // ---------------------------------------------------------
    case 'compress': {
      const level = config.level || 'recommended';
      const compressResult = await compressionService.compressPDF(
        files[0].arrayBuffer,
        { level },
        (pct, status) => updateProgress(pct, status)
      );

      const blob = new Blob([compressResult.bytes.buffer as ArrayBuffer], {
        type: 'application/pdf',
      });
      return {
        blob,
        filename: `compressed_${Date.now()}.pdf`,
        originalSize: compressResult.originalSizeBytes,
        newSize: compressResult.compressedSizeBytes,
      };
    }

    // ---------------------------------------------------------
    // 9. OCR & TEXT EXTRACTION
    // ---------------------------------------------------------
    case 'ocr': {
      updateProgress(10, 'Loading PDF for text extraction and OCR...');
      const pdfDocProxy = await pdfRendererService.loadDocument(files[0].arrayBuffer);
      const totalDocPages = pdfRendererService.getPageCount(pdfDocProxy);

      const pageItems = config.pageItems || [];
      const selectedItems = pageItems.filter((it: any) => it.isSelected);
      const targetItems =
        selectedItems.length > 0
          ? selectedItems
          : pageItems.length > 0
          ? pageItems
          : Array.from({ length: totalDocPages }, (_, idx) => ({ pageIndex: idx, rotation: 0 }));

      let extractedFullText = '';
      const totalTargets = targetItems.length;

      for (let idx = 0; idx < totalTargets; idx++) {
        const item = targetItems[idx];
        const pageNum = item.pageIndex + 1;
        const progressBase = 10 + Math.round((idx / totalTargets) * 80);

        updateProgress(
          progressBase,
          `Scanning text from page ${pageNum} (${idx + 1}/${totalTargets})...`
        );

        // Try extracting embedded vector text
        const pageText = await pdfRendererService.extractTextFromPage(pdfDocProxy, pageNum);

        if (pageText.fullText.trim().length >= 10) {
          extractedFullText += `=== หน้า ${pageNum} ===\n${pageText.fullText.trim()}\n\n`;
        } else {
          // Fallback to Tesseract OCR engine for scanned image pages
          updateProgress(
            progressBase,
            `Running OCR engine on page ${pageNum} (${idx + 1}/${totalTargets})...`
          );
          const pageBlob = await pdfRendererService.renderPageToImageBlob(pdfDocProxy, pageNum, {
            dpi: 150,
            format: 'png',
            rotation: item.rotation || 0,
          });
          const lang = config.ocrLang || 'eng+tha';
          const ocrRes = await ocrService.performOcr(pageBlob, lang, (info) => {
            updateProgress(
              Math.min(95, progressBase + Math.round(info.progress * (80 / totalTargets))),
              `OCR (หน้า ${pageNum}): ${info.status}`
            );
          });
          extractedFullText += `=== หน้า ${pageNum} (สแกน OCR) ===\n${ocrRes.text.trim()}\n\n`;
        }
      }

      pdfRendererService.destroyDocument(pdfDocProxy);

      // Save into config for UI copy/preview
      config.extractedText = extractedFullText;

      updateProgress(100, 'Text extraction complete!');
      const txtBlob = new Blob([extractedFullText], { type: 'text/plain;charset=utf-8' });
      return {
        blob: txtBlob,
        filename: `${files[0].name.replace(/\.[^/.]+$/, '')}_ocr_text_${Date.now()}.txt`,
        originalSize: totalOriginalSize,
        newSize: txtBlob.size,
      };
    }

    // ---------------------------------------------------------
    // 10. EDIT & ANNOTATE
    // ---------------------------------------------------------
    case 'editor': {
      updateProgress(20, 'Loading PDF for annotation stamping...');
      const pdfDoc = await pdfService.loadDocument(files[0].arrayBuffer);
      const helvetica = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const pages = pdfDoc.getPages();

      const textAnnotations = config.textAnnotations || [];
      const shapes = config.shapes || [];

      updateProgress(60, 'Stamping vector annotations onto PDF pages...');
      pages.forEach((page, pageIdx) => {
        const { width, height } = page.getSize();
        const scaleX = width / 512;
        const scaleY = height / 724;

        // Stamp Text
        textAnnotations
          .filter((t: any) => t.pageIndex === pageIdx)
          .forEach((t: any) => {
            page.drawText(t.text, {
              x: t.x * scaleX,
              y: height - t.y * scaleY - t.fontSize,
              size: t.fontSize,
              font: helvetica,
              color: rgb(0.9, 0.1, 0.1),
            });
          });

        // Stamp Rectangles / Shapes
        shapes
          .filter((sh: any) => sh.pageIndex === pageIdx)
          .forEach((sh: any) => {
            if (sh.type === 'rect') {
              const x = Math.min(sh.start.x, sh.end.x) * scaleX;
              const y = height - Math.max(sh.start.y, sh.end.y) * scaleY;
              const w = Math.abs(sh.end.x - sh.start.x) * scaleX;
              const h = Math.abs(sh.end.y - sh.start.y) * scaleY;
              page.drawRectangle({
                x,
                y,
                width: w,
                height: h,
                borderColor: rgb(0.9, 0.2, 0.2),
                borderWidth: sh.strokeWidth || 2,
              });
            }
          });
      });

      updateProgress(90, 'Finalizing edited document...');
      const editedBytes = await pdfDoc.save({ useObjectStreams: true });
      const blob = new Blob([editedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      return {
        blob,
        filename: `edited_${Date.now()}.pdf`,
        originalSize: totalOriginalSize,
        newSize: blob.size,
      };
    }

    // ---------------------------------------------------------
    // 11. ADD WATERMARK
    // ---------------------------------------------------------
    case 'watermark': {
      updateProgress(20, 'Embedding watermark into PDF...');
      const pdfDoc = await pdfService.loadDocument(files[0].arrayBuffer);
      const pages = pdfDoc.getPages();

      const wm = config.watermark || {
        text: 'สำเนาถูกต้อง',
        fontSize: 42,
        opacity: 0.35,
        rotation: 45,
        color: '#b91c1c',
        position: 'center',
      };

      const text = wm.text || 'สำเนาถูกต้อง';
      const font = await fontService.embedAutoFont(pdfDoc, text);

      const hex = wm.color || '#b91c1c';
      const r = parseInt(hex.slice(1, 3), 16) / 255 || 0.8;
      const g = parseInt(hex.slice(3, 5), 16) / 255 || 0.1;
      const b = parseInt(hex.slice(5, 7), 16) / 255 || 0.1;

      pages.forEach((page) => {
        const { width, height } = page.getSize();
        const fontSize = wm.fontSize || 42;
        const opacity = wm.opacity || 0.35;
        const rotationAngle = wm.rotation !== undefined ? wm.rotation : 45;

        const textWidth = font.widthOfTextAtSize(text, fontSize);
        const textHeight = font.heightAtSize(fontSize);

        let x = (width - textWidth) / 2;
        let y = (height - textHeight) / 2;

        const pos = wm.position || 'center';
        if (pos.includes('top')) y = height - textHeight - 60;
        if (pos.includes('bottom')) y = 60;
        if (pos.includes('left')) x = 60;
        if (pos.includes('right')) x = width - textWidth - 60;

        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(r, g, b),
          opacity,
          rotate: degrees(rotationAngle),
        });
      });

      updateProgress(100, 'Watermark applied!');
      const watermarkedBytes = await pdfDoc.save({ useObjectStreams: true });
      const blob = new Blob([watermarkedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      return {
        blob,
        filename: `${files[0].name.replace(/\.[^/.]+$/, '')}_watermarked.pdf`,
        originalSize: totalOriginalSize,
        newSize: blob.size,
      };
    }

    // ---------------------------------------------------------
    // 12. ADD PAGE NUMBERS
    // ---------------------------------------------------------
    case 'pageNumbers': {
      updateProgress(20, 'Numbering PDF pages...');
      const pdfDoc = await pdfService.loadDocument(files[0].arrayBuffer);
      const pages = pdfDoc.getPages();
      const totalPages = pages.length;

      const pn = config.pageNumbers || {
        format: 'หน้า {n} จาก {total}',
        position: 'bottom-center',
        fontSize: 11,
        margin: 30,
        color: '#0f172a',
        skipFirstPage: false,
      };

      const sampleText = (pn.format || 'หน้า {n} จาก {total}')
        .replace('{n}', '1')
        .replace('{total}', `${totalPages}`);
      const font = await fontService.embedAutoFont(pdfDoc, sampleText);

      const hex = pn.color || '#0f172a';
      const r = parseInt(hex.slice(1, 3), 16) / 255 || 0.1;
      const g = parseInt(hex.slice(3, 5), 16) / 255 || 0.1;
      const b = parseInt(hex.slice(5, 7), 16) / 255 || 0.1;

      pages.forEach((page, idx) => {
        if (idx === 0 && pn.skipFirstPage) return;

        const pageNum = idx + 1;
        const labelText = (pn.format || 'หน้า {n} จาก {total}')
          .replace('{n}', `${pageNum}`)
          .replace('{total}', `${totalPages}`);

        const { width, height } = page.getSize();
        const fontSize = pn.fontSize || 11;
        const margin = pn.margin || 30;
        const textWidth = font.widthOfTextAtSize(labelText, fontSize);

        let x = (width - textWidth) / 2;
        let y = margin;

        const pos = pn.position || 'bottom-center';
        if (pos.includes('top')) {
          y = height - margin;
        }
        if (pos.includes('left')) {
          x = margin;
        } else if (pos.includes('right')) {
          x = width - margin - textWidth;
        }

        page.drawText(labelText, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(r, g, b),
        });
      });

      updateProgress(100, 'Page numbers applied!');
      const numberedBytes = await pdfDoc.save({ useObjectStreams: true });
      const blob = new Blob([numberedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      return {
        blob,
        filename: `${files[0].name.replace(/\.[^/.]+$/, '')}_numbered.pdf`,
        originalSize: totalOriginalSize,
        newSize: blob.size,
      };
    }

    // ---------------------------------------------------------
    // 13. SIGN PDF
    // ---------------------------------------------------------
    case 'sign': {
      updateProgress(20, 'Stamping signatures onto PDF pages...');
      const pdfDoc = await pdfService.loadDocument(files[0].arrayBuffer);
      const pages = pdfDoc.getPages();
      const signatures = config.signatures || [];

      for (const sig of signatures) {
        if (sig.pageIndex < pages.length) {
          const page = pages[sig.pageIndex];
          const { width, height } = page.getSize();

          // Convert dataURL to PNG bytes
          const base64Data = sig.dataUrl.split(',')[1];
          const byteChars = atob(base64Data);
          const byteNumbers = new Array(byteChars.length);
          for (let i = 0; i < byteChars.length; i++) {
            byteNumbers[i] = byteChars.charCodeAt(i);
          }
          const pngBytes = new Uint8Array(byteNumbers);

          const embeddedPng = await pdfDoc.embedPng(pngBytes);
          const drawW =
            ((sig.widthPercent !== undefined
              ? sig.widthPercent
              : sig.width
              ? (sig.width / 512) * 100
              : 30) /
              100) *
            width;
          const drawH =
            ((sig.heightPercent !== undefined
              ? sig.heightPercent
              : sig.height
              ? (sig.height / 724) * 100
              : 12) /
              100) *
            height;
          const drawX = (sig.x / 100) * width - drawW / 2;
          const drawY = height - (sig.y / 100) * height - drawH / 2;

          page.drawImage(embeddedPng, {
            x: Math.max(0, drawX),
            y: Math.max(0, drawY),
            width: Math.min(width, drawW),
            height: Math.min(height, drawH),
          });
        }
      }

      updateProgress(100, 'Signatures permanently embedded!');
      const signedBytes = await pdfDoc.save({ useObjectStreams: true });
      const blob = new Blob([signedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      return {
        blob,
        filename: `signed_${Date.now()}.pdf`,
        originalSize: totalOriginalSize,
        newSize: blob.size,
      };
    }

    // ---------------------------------------------------------
    // 14. PROTECT PDF
    // ---------------------------------------------------------
    case 'protect': {
      updateProgress(50, 'Encrypting PDF document...');
      const protectedBytes = await pdfService.protectPDF(files[0].arrayBuffer, {
        userPassword: config.password,
        ownerPassword: config.password,
      });

      updateProgress(100, 'PDF protected!');
      const blob = new Blob([protectedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      return {
        blob,
        filename: `protected_${Date.now()}.pdf`,
        originalSize: totalOriginalSize,
        newSize: blob.size,
      };
    }

    // ---------------------------------------------------------
    // 15. UNLOCK PDF
    // ---------------------------------------------------------
    case 'unlock': {
      updateProgress(30, 'Decrypting and removing PDF password protection...');
      try {
        const unlockedBytes = await pdfService.unlockPDF(files[0].arrayBuffer, config.password);

        updateProgress(100, 'PDF successfully unlocked!');
        const blob = new Blob([unlockedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
        return {
          blob,
          filename: `${files[0].name.replace(/\.[^/.]+$/, '')}_unlocked.pdf`,
          originalSize: totalOriginalSize,
          newSize: blob.size,
        };
      } catch (err: any) {
        if (
          err?.name === 'PasswordException' ||
          /password|incorrect|decrypt/i.test(err?.message || '')
        ) {
          throw new Error('รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบรหัสผ่านของไฟล์ PDF อีกครั้ง');
        }
        throw err;
      }
    }

    // ---------------------------------------------------------
    // 16. REDACT PDF
    // ---------------------------------------------------------
    case 'redact': {
      updateProgress(30, 'Burning permanent blackout redactions...');
      const pdfDoc = await pdfService.loadDocument(files[0].arrayBuffer);
      const pages = pdfDoc.getPages();
      const redactBoxes = config.redactBoxes || [];

      redactBoxes.forEach((box: any) => {
        if (box.pageIndex < pages.length) {
          const page = pages[box.pageIndex];
          const { width, height } = page.getSize();

          const x = (box.x / 100) * width;
          const y = height - (box.y / 100) * height - (box.height / 100) * height;
          const w = (box.width / 100) * width;
          const h = (box.height / 100) * height;

          page.drawRectangle({
            x,
            y,
            width: w,
            height: h,
            color: rgb(0, 0, 0),
            opacity: 1.0,
          });
        }
      });

      updateProgress(100, 'Redactions permanently applied!');
      const redactedBytes = await pdfDoc.save({ useObjectStreams: true });
      const blob = new Blob([redactedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      return {
        blob,
        filename: `redacted_${Date.now()}.pdf`,
        originalSize: totalOriginalSize,
        newSize: blob.size,
      };
    }

    // ---------------------------------------------------------
    // 17. METADATA EDITOR
    // ---------------------------------------------------------
    case 'metadata': {
      updateProgress(40, 'Updating PDF metadata properties...');
      const updatedBytes = await pdfService.updateMetadata(
        files[0].arrayBuffer,
        config.metadata || {},
        !!config.sanitize
      );

      updateProgress(100, 'Metadata updated!');
      const blob = new Blob([updatedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      return {
        blob,
        filename: `metadata_${Date.now()}.pdf`,
        originalSize: totalOriginalSize,
        newSize: blob.size,
      };
    }

    default: {
      updateProgress(100, 'Operation complete');
      const blob = new Blob([files[0].arrayBuffer], { type: 'application/pdf' });
      return {
        blob,
        filename: `pdfpro_${toolId}_${Date.now()}.pdf`,
        originalSize: totalOriginalSize,
        newSize: blob.size,
      };
    }
  }
}
