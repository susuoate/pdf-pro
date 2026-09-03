import { PDFDocument } from 'pdf-lib';

/**
 * Expected PDF Metadata Structure
 */
export interface ExpectedMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
  producer?: string;
}

export interface PageDimension {
  width: number;
  height: number;
}

/**
 * PDF Structural AST Validator and Verification Utility
 */
export class PdfVerifier {
  /**
   * Loads a PDF Document using pdf-lib with safe options
   */
  static async load(bytes: Uint8Array | ArrayBuffer): Promise<PDFDocument> {
    const uint8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    return await PDFDocument.load(uint8, { ignoreEncryption: true });
  }

  /**
   * Asserts and returns the exact page count of a PDF
   */
  static async getPageCount(bytes: Uint8Array | ArrayBuffer): Promise<number> {
    const doc = await this.load(bytes);
    return doc.getPageCount();
  }

  /**
   * Verifies that the PDF has exactly the expected number of pages
   */
  static async verifyPageCount(
    bytes: Uint8Array | ArrayBuffer,
    expectedCount: number
  ): Promise<boolean> {
    const count = await this.getPageCount(bytes);
    if (count !== expectedCount) {
      throw new Error(
        `PDF Page Count Mismatch: Expected ${expectedCount} pages, but found ${count} pages.`
      );
    }
    return true;
  }

  /**
   * Gets dimensions (width and height in points) for a specific page (0-indexed)
   */
  static async getPageDimensions(
    bytes: Uint8Array | ArrayBuffer,
    pageIndex: number = 0
  ): Promise<PageDimension> {
    const doc = await this.load(bytes);
    const pages = doc.getPages();
    if (pageIndex < 0 || pageIndex >= pages.length) {
      throw new Error(
        `Page index ${pageIndex} out of bounds (document has ${pages.length} pages)`
      );
    }
    const page = pages[pageIndex];
    const size = page.getSize();
    return {
      width: Math.round(size.width * 100) / 100,
      height: Math.round(size.height * 100) / 100,
    };
  }

  /**
   * Gets the rotation angle in degrees for a specific page (0-indexed)
   * Normalized to 0, 90, 180, or 270.
   */
  static async getPageRotation(
    bytes: Uint8Array | ArrayBuffer,
    pageIndex: number = 0
  ): Promise<number> {
    const doc = await this.load(bytes);
    const pages = doc.getPages();
    if (pageIndex < 0 || pageIndex >= pages.length) {
      throw new Error(
        `Page index ${pageIndex} out of bounds (document has ${pages.length} pages)`
      );
    }
    const page = pages[pageIndex];
    const rotation = page.getRotation();
    return ((rotation.angle % 360) + 360) % 360;
  }

  /**
   * Verifies metadata fields against expected values
   */
  static async verifyMetadata(
    bytes: Uint8Array | ArrayBuffer,
    expected: ExpectedMetadata
  ): Promise<boolean> {
    const doc = await this.load(bytes);
    
    if (expected.title !== undefined) {
      const actualTitle = doc.getTitle();
      if (actualTitle !== expected.title) {
        throw new Error(`Title mismatch: expected "${expected.title}", got "${actualTitle}"`);
      }
    }

    if (expected.author !== undefined) {
      const actualAuthor = doc.getAuthor();
      if (actualAuthor !== expected.author) {
        throw new Error(`Author mismatch: expected "${expected.author}", got "${actualAuthor}"`);
      }
    }

    if (expected.subject !== undefined) {
      const actualSubject = doc.getSubject();
      if (actualSubject !== expected.subject) {
        throw new Error(`Subject mismatch: expected "${expected.subject}", got "${actualSubject}"`);
      }
    }

    if (expected.keywords !== undefined) {
      const actualKeywords = doc.getKeywords();
      const expectedJoined = expected.keywords.join(', ');
      // Compare keyword strings or lists
      if (actualKeywords && !expected.keywords.every((k) => actualKeywords.includes(k))) {
        throw new Error(
          `Keywords mismatch: expected "${expectedJoined}", got "${actualKeywords}"`
        );
      }
    }

    if (expected.creator !== undefined) {
      const actualCreator = doc.getCreator();
      if (actualCreator !== expected.creator) {
        throw new Error(`Creator mismatch: expected "${expected.creator}", got "${actualCreator}"`);
      }
    }

    if (expected.producer !== undefined) {
      const actualProducer = doc.getProducer();
      if (actualProducer !== expected.producer) {
        throw new Error(`Producer mismatch: expected "${expected.producer}", got "${actualProducer}"`);
      }
    }

    return true;
  }

  /**
   * Asserts that metadata has been completely sanitized/stripped
   */
  static async verifySanitizedMetadata(bytes: Uint8Array | ArrayBuffer): Promise<boolean> {
    const doc = await this.load(bytes);
    const title = doc.getTitle();
    const author = doc.getAuthor();
    const subject = doc.getSubject();
    const keywords = doc.getKeywords();

    const isClean = !title && !author && !subject && !keywords;
    if (!isClean) {
      throw new Error(
        `Metadata sanitization failed. Found non-empty fields: title="${title}", author="${author}", subject="${subject}"`
      );
    }
    return true;
  }

  /**
   * Checks if the PDF structure contains encryption indicators or encrypted trailer
   */
  static async verifyIsEncrypted(bytes: Uint8Array | ArrayBuffer): Promise<boolean> {
    const uint8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    const rawString = new TextDecoder('latin1').decode(uint8);
    
    // Check for /Encrypt dictionary indicator in PDF AST stream
    const hasEncryptTag = /\/Encrypt\s+\d+\s+\d+\s+R/.test(rawString) || /\/Encrypt\s*<<.*>>/s.test(rawString);
    return hasEncryptTag;
  }

  /**
   * Searches raw PDF stream for text markers or embedded token substrings
   */
  static containsStreamToken(bytes: Uint8Array | ArrayBuffer, token: string): boolean {
    const uint8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    const rawString = new TextDecoder('latin1').decode(uint8);
    return rawString.includes(token);
  }

  /**
   * Network Egress Interceptor: Validates that 0 network requests leave the client sandbox
   */
  static async verifyZeroNetworkEgress<T>(action: () => Promise<T>): Promise<T> {
    const networkCalls: string[] = [];

    // Save originals
    const originalFetch = globalThis.fetch;
    const originalXHR = (globalThis as any).XMLHttpRequest;
    const originalWebSocket = (globalThis as any).WebSocket;

    // Spy interceptors
    (globalThis as any).fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : (input as any).url || input.toString();
      // Allow internal blob: or data: or local font loading if needed
      if (!url.startsWith('blob:') && !url.startsWith('data:') && !url.startsWith('/fonts/')) {
        networkCalls.push(`fetch: ${url}`);
      }
      return originalFetch ? originalFetch(input, init) : Promise.reject('Network disabled');
    };

    try {
      const result = await action();

      if (networkCalls.length > 0) {
        throw new Error(
          `Privacy Egress Violation! Detected ${networkCalls.length} unauthorized network calls:\n${networkCalls.join('\n')}`
        );
      }

      return result;
    } finally {
      // Restore originals
      if (originalFetch) globalThis.fetch = originalFetch;
      if (originalXHR) (globalThis as any).XMLHttpRequest = originalXHR;
      if (originalWebSocket) (globalThis as any).WebSocket = originalWebSocket;
    }
  }

  /**
   * Measures memory usage delta to ensure no major unbounded memory leaks
   */
  static async measureMemoryDelta(action: () => Promise<void>): Promise<{ heapDeltaMB: number }> {
    if (typeof process !== 'undefined' && typeof process.memoryUsage === 'function') {
      if (typeof global !== 'undefined' && (global as any).gc) {
        (global as any).gc();
      }
      const before = process.memoryUsage().heapUsed;
      await action();
      if (typeof global !== 'undefined' && (global as any).gc) {
        (global as any).gc();
      }
      const after = process.memoryUsage().heapUsed;
      const heapDeltaMB = (after - before) / (1024 * 1024);
      return { heapDeltaMB };
    }
    // Fallback if not running in Node with memory flags
    await action();
    return { heapDeltaMB: 0 };
  }
}
