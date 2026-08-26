import * as pdfjsLib from "pdfjs-dist";
import { PDFMaterial, PdfSourceType, UnifiedPdfDocument } from "../types";

// Configure PDF.js Worker with exact matching library version
const PDFJS_VERSION = (pdfjsLib as any).version || "4.10.38";
if (typeof window !== "undefined" && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.mjs`;
}

/**
 * Converts a Blob or File into ArrayBuffer using standard FileReader API
 * (Safe for AI Studio iframe sandboxes & Web Workers without blob: URL fetch errors)
 */
export function readBlobAsArrayBuffer(blob: Blob | File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    if (typeof FileReader === "undefined") {
      if (typeof (blob as any).arrayBuffer === "function") {
        return (blob as any).arrayBuffer().then(resolve).catch(reject);
      }
      return reject(new Error("FileReader / ArrayBuffer not supported in this environment"));
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error("FileReader did not produce an ArrayBuffer"));
      }
    };
    reader.onerror = () => {
      reject(reader.error || new Error("FileReader error while reading blob"));
    };
    reader.onabort = () => {
      reject(new Error("FileReader operation aborted"));
    };
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Converts a Blob or File into Uint8Array using FileReader
 */
export async function readBlobAsUint8Array(blob: Blob | File): Promise<Uint8Array> {
  const arrayBuffer = await readBlobAsArrayBuffer(blob);
  return new Uint8Array(arrayBuffer);
}

// In-memory binary and document caches for instant (0-second) offline & re-opened PDF rendering
const inMemoryBytesCache = new Map<string, Uint8Array>();
const inMemoryDocCache = new Map<string, any>();

export class PdfService {
  /**
   * Fast In-Memory cache access
   */
  static getCachedBytes(key: string): Uint8Array | undefined {
    return inMemoryBytesCache.get(key);
  }

  static setCachedBytes(key: string, data: Uint8Array): void {
    if (inMemoryBytesCache.size > 20) {
      const firstKey = inMemoryBytesCache.keys().next().value;
      if (firstKey) inMemoryBytesCache.delete(firstKey);
    }
    inMemoryBytesCache.set(key, data);
  }

  static getCachedDoc(key: string): any | undefined {
    return inMemoryDocCache.get(key);
  }

  static setCachedDoc(key: string, doc: any): void {
    if (inMemoryDocCache.size > 10) {
      const firstKey = inMemoryDocCache.keys().next().value;
      if (firstKey) inMemoryDocCache.delete(firstKey);
    }
    inMemoryDocCache.set(key, doc);
  }

  /**
   * Identifies whether the PDF is a Direct Upload, Google Drive Link, or Local File
   */
  static detectSourceType(fileUrl?: string): PdfSourceType {
    if (!fileUrl) return "DIRECT_UPLOAD";
    const url = fileUrl.trim();
    if (url.startsWith("blob:") || url.startsWith("data:") || url.startsWith("file:")) {
      return "OFFLINE_LOCAL";
    }
    if (url.includes("drive.google.com") || url.includes("docs.google.com")) {
      return "DRIVE_LINK";
    }
    return "DIRECT_UPLOAD";
  }

  /**
   * Converts a PDFMaterial into the unified PDF document model
   */
  static toUnifiedDocument(pdf: PDFMaterial, localFileUri?: string, offlineAvailable?: boolean): UnifiedPdfDocument {
    const sourceType = localFileUri || offlineAvailable ? "OFFLINE_LOCAL" : PdfService.detectSourceType(pdf.fileUrl);
    return {
      id: pdf.id,
      title: pdf.title,
      sourceType,
      remoteUrl: pdf.fileUrl,
      localFileUri: localFileUri || pdf.localFileUri,
      fileSizeMb: pdf.fileSizeMb,
      mimeType: "application/pdf",
      pageCount: pdf.pageCount,
      chapterTitle: pdf.chapterTitle,
      subjectId: pdf.subjectId,
      chapterId: pdf.chapterId,
      downloadStatus: offlineAvailable ? "completed" : "idle",
      downloadProgress: offlineAvailable ? 100 : 0,
      offlineAvailable: Boolean(offlineAvailable || pdf.offlineAvailable),
      lastUpdated: pdf.updatedDate || pdf.uploadDate
    };
  }

  /**
   * Verifies if binary data has the standard PDF magic header (%PDF-)
   */
  static validatePdfMagicBytes(buffer: ArrayBuffer | Uint8Array): boolean {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    if (bytes.length < 4) return false;

    // Check for "%PDF" -> [0x25, 0x50, 0x44, 0x46]
    return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  }

  /**
   * Resolves the best fetch/stream URL for PDF loading
   */
  static resolveFetchUrl(rawUrl: string): string {
    const clean = (rawUrl || "").trim();
    if (!clean) return "";

    // If local offline blob or data URI
    if (clean.startsWith("blob:") || clean.startsWith("data:")) {
      return clean;
    }

    // If Google Drive URL, route through proxy to bypass CORS and handle confirmation redirects
    const driveMatch =
      clean.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/) ||
      clean.match(/[?&]id=([a-zA-Z0-9_-]+)/);

    if (driveMatch && driveMatch[1]) {
      return `/api/pdf-proxy?id=${driveMatch[1]}`;
    }

    // If relative upload path
    if (clean.startsWith("/uploads/") || clean.startsWith("uploads/")) {
      return clean.startsWith("/") ? clean : `/${clean}`;
    }

    return clean;
  }

  /**
   * Fetches PDF binary bytes with real-time progress tracking and magic-header validation
   */
  static async fetchPdfBytes(
    url: string,
    onProgress?: (progressPercent: number, loadedBytes: number, totalBytes: number) => void,
    signal?: AbortSignal
  ): Promise<{ data: Uint8Array; totalBytes: number }> {
    const targetUrl = PdfService.resolveFetchUrl(url);

    let response = await fetch(targetUrl, { signal });

    // Fallback directly to raw URL if proxy fails or returns 404
    if (!response.ok && targetUrl.startsWith("/api/pdf-proxy")) {
      console.warn("Proxy returned status", response.status, "trying direct fetch...");
      response = await fetch(url, { signal });
    }

    if (!response.ok) {
      throw new Error(`PDF Server returned HTTP ${response.status}`);
    }

    const contentLengthHeader = response.headers.get("content-length");
    const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;
    let loadedBytes = 0;

    const reader = response.body?.getReader();
    const chunks: Uint8Array[] = [];

    if (reader) {
      while (true) {
        if (signal?.aborted) {
          throw new Error("Download cancelled");
        }

        const { done, value } = await reader.read();
        if (done) break;

        if (value) {
          chunks.push(value);
          loadedBytes += value.length;

          if (totalBytes > 0) {
            const percent = Math.min(Math.round((loadedBytes / totalBytes) * 100), 99);
            onProgress?.(percent, loadedBytes, totalBytes);
          } else {
            onProgress?.(0, loadedBytes, 0);
          }
        }
      }
    } else {
      const buffer = await response.arrayBuffer();
      chunks.push(new Uint8Array(buffer));
      loadedBytes = buffer.byteLength;
    }

    // Combine all chunks into a contiguous Uint8Array
    const fullData = new Uint8Array(loadedBytes);
    let offset = 0;
    for (const chunk of chunks) {
      fullData.set(chunk, offset);
      offset += chunk.length;
    }

    // Header validation
    if (!PdfService.validatePdfMagicBytes(fullData)) {
      // Check if it's HTML
      const firstStr = new TextDecoder().decode(fullData.slice(0, 100));
      if (firstStr.toLowerCase().includes("<html") || firstStr.toLowerCase().includes("<!doctype")) {
        throw new Error("Google Drive से वास्तविक PDF नहीं मिली। कृपया फ़ाइल शेयरिंग लिंक सार्वजनिक रखें।");
      }
      throw new Error("अमान्य PDF फ़ाइल (Invalid PDF magic header)");
    }

    onProgress?.(100, loadedBytes, totalBytes || loadedBytes);
    return { data: fullData, totalBytes: loadedBytes };
  }

  /**
   * Loads a PDF Document into PDF.js ALWAYS using binary ArrayBuffer/Uint8Array data
   * (Prevents 'Unexpected server response (0) while retrieving PDF blob:...' in sandboxed iframes)
   */
  static async loadPdfDocument(source: Uint8Array | ArrayBuffer | Blob | File | string, cacheKey?: string): Promise<any> {
    if (cacheKey) {
      const cached = PdfService.getCachedDoc(cacheKey);
      if (cached) return cached;
    }

    let typedData: Uint8Array;

    if (source instanceof Uint8Array) {
      typedData = source;
    } else if (source instanceof ArrayBuffer) {
      typedData = new Uint8Array(source);
    } else if (typeof Blob !== "undefined" && source instanceof Blob) {
      // Use FileReader to readAsArrayBuffer
      typedData = await readBlobAsUint8Array(source);
    } else if (typeof source === "string") {
      const trimmed = source.trim();
      const cachedBytes = PdfService.getCachedBytes(trimmed);
      if (cachedBytes) {
        typedData = cachedBytes;
      } else if (trimmed.startsWith("blob:")) {
        // Fetch blob and read via FileReader.readAsArrayBuffer
        const res = await fetch(trimmed);
        const blob = await res.blob();
        typedData = await readBlobAsUint8Array(blob);
      } else if (trimmed.startsWith("data:")) {
        // Base64 data URI
        const res = await fetch(trimmed);
        const blob = await res.blob();
        typedData = await readBlobAsUint8Array(blob);
      } else {
        // Remote URL, /uploads/... path, or Google Drive proxy
        const result = await PdfService.fetchPdfBytes(trimmed);
        typedData = result.data;
      }
      PdfService.setCachedBytes(trimmed, typedData);
    } else {
      throw new Error("Unsupported PDF source format");
    }

    // Cache typed bytes if cacheKey provided
    if (cacheKey) {
      PdfService.setCachedBytes(cacheKey, typedData);
    }

    // Pass direct typed array data into pdfjsLib.getDocument
    const loadingTask = pdfjsLib.getDocument({
      data: typedData,
      cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/cmaps/`,
      cMapPacked: true
    });

    const doc = await loadingTask.promise;
    if (cacheKey) {
      PdfService.setCachedDoc(cacheKey, doc);
    }
    return doc;
  }

  /**
   * Renders a specific page of a loaded PDF document to a Canvas
   */
  static async renderPageToCanvas(
    pdfDoc: any,
    pageNumber: number,
    canvas: HTMLCanvasElement,
    zoomLevel: number = 100,
    containerWidth?: number
  ): Promise<void> {
    if (!pdfDoc || !canvas) return;

    // If an active render task exists on this canvas, cancel it safely first
    if ((canvas as any)._activeRenderTask) {
      try {
        (canvas as any)._activeRenderTask.cancel();
      } catch {
        // Ignored
      }
      (canvas as any)._activeRenderTask = null;
    }

    const page = await pdfDoc.getPage(pageNumber);
    const baseViewport = page.getViewport({ scale: 1.0 });

    // Calculate responsive scale based on container width or zoom
    let computedScale = zoomLevel / 100;
    if (containerWidth && containerWidth > 320) {
      const fitScale = (containerWidth - 32) / baseViewport.width;
      computedScale = fitScale * (zoomLevel / 100);
    }

    // Keep scale within sensible high-def bounds (up to 3.5x for ultra crisp text)
    computedScale = Math.max(0.4, Math.min(computedScale, 3.5));

    // Handle high-DPI (Retina) screens for crystal clear text
    const pixelRatio = window.devicePixelRatio || 1;
    const viewport = page.getViewport({ scale: computedScale });

    canvas.width = Math.floor(viewport.width * pixelRatio);
    canvas.height = Math.floor(viewport.height * pixelRatio);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    const transform = pixelRatio !== 1 ? [pixelRatio, 0, 0, pixelRatio, 0, 0] : undefined;

    const renderContext = {
      canvasContext: context,
      viewport,
      transform
    };

    const renderTask = page.render(renderContext);
    (canvas as any)._activeRenderTask = renderTask;

    try {
      await renderTask.promise;
    } catch (err: any) {
      if (err?.name === "RenderingCancelledException") {
        return; // Normal cancellation during zoom/page changes
      }
      throw err;
    } finally {
      if ((canvas as any)._activeRenderTask === renderTask) {
        (canvas as any)._activeRenderTask = null;
      }
    }
  }
}
