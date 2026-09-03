/**
 * Formats byte size into human-readable string (KB, MB, GB).
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Formats reduction percentage.
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Parses user range strings (e.g. "1-3, 5, 8-10, end") into 0-indexed integer array.
 */
export function parsePageRange(rangeStr: string, totalPages: number): number[] {
  const pages = new Set<number>();
  const parts = rangeStr.split(',').map((p) => p.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map((s) => s.trim());
      const start = parseInt(startStr, 10);
      let end = endStr.toLowerCase() === 'end' ? totalPages : parseInt(endStr, 10);

      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(totalPages, Math.max(start, end));
        for (let i = min; i <= max; i++) {
          pages.add(i - 1); // 0-indexed
        }
      }
    } else {
      const pageNum = parseInt(part, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        pages.add(pageNum - 1);
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

/**
 * Converts 0-indexed page array into compact human range string (e.g. [0, 1, 2, 4] -> "1-3, 5").
 */
export function formatPageRange(pageIndices: number[]): string {
  if (pageIndices.length === 0) return '';
  const sorted = Array.from(new Set(pageIndices)).sort((a, b) => a - b);
  const ranges: string[] = [];

  let start = sorted[0];
  let end = start;

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      ranges.push(start === end ? `${start + 1}` : `${start + 1}-${end + 1}`);
      start = sorted[i];
      end = start;
    }
  }
  ranges.push(start === end ? `${start + 1}` : `${start + 1}-${end + 1}`);

  return ranges.join(', ');
}

/**
 * Sanitizes output filenames removing unsafe OS filesystem characters.
 */
export function sanitizeFilename(filename: string, fallback: string = 'document.pdf'): string {
  if (!filename || filename.trim().length === 0) return fallback;
  // Preserve Thai unicode characters while removing illegal filename chars: \ / : * ? " < > |
  const cleaned = filename.replace(/[\\/:*?"<>|]/g, '_').trim();
  return cleaned.length > 0 ? cleaned : fallback;
}
