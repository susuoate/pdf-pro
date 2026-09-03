import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export interface ZipFileEntry {
  filename: string;
  content: Blob | Uint8Array | ArrayBuffer | string;
}

export class ZipService {
  /**
   * Creates an in-memory ZIP archive from a list of file entries.
   */
  public async createZip(
    files: ZipFileEntry[],
    onProgress?: (percent: number, currentFile: string) => void
  ): Promise<Blob> {
    const zip = new JSZip();

    for (const file of files) {
      zip.file(file.filename, file.content, { binary: typeof file.content !== 'string' });
    }

    return await zip.generateAsync(
      {
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      },
      (metadata) => {
        if (onProgress) {
          onProgress(Math.round(metadata.percent), metadata.currentFile || '');
        }
      }
    );
  }

  /**
   * Triggers a browser download for any Blob with a specified filename.
   */
  public saveBlobAs(blob: Blob, filename: string): void {
    saveAs(blob, filename);
  }

  /**
   * Convenience method to build ZIP archive and immediately trigger file download.
   */
  public async generateZipAndDownload(
    files: ZipFileEntry[],
    zipFilename: string = 'archive.zip',
    onProgress?: (percent: number) => void
  ): Promise<void> {
    const zipBlob = await this.createZip(files, (pct) => {
      if (onProgress) onProgress(pct);
    });
    this.saveBlobAs(zipBlob, zipFilename);
  }
}

export const zipService = new ZipService();
