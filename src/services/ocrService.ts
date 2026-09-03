import { createWorker, Worker } from 'tesseract.js';

export interface OcrProgressInfo {
  status: string;
  progress: number; // 0.0 to 1.0
}

export interface OcrResult {
  text: string;
  confidence: number;
}

export class OcrService {
  private worker: Worker | null = null;

  public async performOcr(
    imageSource: HTMLCanvasElement | Blob | string,
    language: 'eng' | 'tha' | 'eng+tha' = 'eng+tha',
    onProgress?: (info: OcrProgressInfo) => void
  ): Promise<OcrResult> {
    // Create dedicated Web Worker
    const worker = await createWorker(language, 1, {
      logger: (m) => {
        if (onProgress && m.progress !== undefined) {
          onProgress({
            status: m.status || 'processing',
            progress: m.progress,
          });
        }
      },
    });

    try {
      const result = await worker.recognize(imageSource);
      return {
        text: result.data.text,
        confidence: result.data.confidence,
      };
    } finally {
      await worker.terminate();
    }
  }

  public async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

export const ocrService = new OcrService();
