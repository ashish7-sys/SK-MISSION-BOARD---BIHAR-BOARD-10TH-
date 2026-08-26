import { DownloadedItem, SubjectId } from "../types";
import { PdfService } from "./pdfService";

const STORAGE_KEY = "skmb_downloads_v2";
const DB_NAME = "skmb_offline_storage_v1";
const STORE_NAME = "offline_blobs";

type DownloadListener = () => void;
const listeners: Set<DownloadListener> = new Set();

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error("Download listener error:", e);
    }
  });
}

// In-memory cache
let cachedDownloads: DownloadedItem[] = [];
const activeAbortControllers = new Map<string, AbortController>();

// 1. IndexedDB Helper for Genuine Offline Storage
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      return reject(new Error("IndexedDB not supported"));
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveBlobOffline(id: string, blob: Blob, mimeType: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.put({ id, blob, mimeType, savedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("Failed to store blob in IndexedDB:", err);
  }
}

async function getOfflineBlob(id: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        resolve(req.result ? req.result.blob : null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function removeOfflineBlob(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // ignore
  }
}

// 2. Storage Persistence Helper
function persistDownloads() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedDownloads));
  } catch (e) {
    console.warn("Error saving downloads to localStorage:", e);
  }
}

// Load initial downloads and auto-verify
try {
  const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("skmb_downloads_v1");
  if (saved) {
    cachedDownloads = JSON.parse(saved);
    // Reset any interrupted "downloading" states to failed/retryable
    cachedDownloads = cachedDownloads.map((item) => {
      if (item.status === "downloading" || item.status === "queued") {
        return { ...item, status: "failed", errorMsg: "डाउनलोड अधूरा रह गया था। पुनः प्रयास करें।" };
      }
      return item;
    });
  }
} catch (e) {
  console.warn("Error loading downloaded files from storage:", e);
}

function sanitizeFileName(name: string, fileType: "pdf" | "music" | "other"): string {
  const clean = name.replace(/[/\\?%*:|"<>]/g, "_").trim();
  const ext = fileType === "music" ? ".mp3" : ".pdf";
  return clean.toLowerCase().endsWith(ext) ? clean : `${clean}${ext}`;
}

export const DownloadService = {
  subscribe: (listener: DownloadListener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getDownloads: (): DownloadedItem[] => {
    return [...cachedDownloads];
  },

  isDownloaded: (idOrUrl: string): boolean => {
    return cachedDownloads.some(
      (item) => (item.id === idOrUrl || item.fileUrl === idOrUrl) && item.status === "completed" && item.isOfflineAvailable
    );
  },

  isDownloading: (idOrUrl: string): boolean => {
    return cachedDownloads.some(
      (item) => (item.id === idOrUrl || item.fileUrl === idOrUrl) && item.status === "downloading"
    );
  },

  getDownloadItem: (idOrUrl: string): DownloadedItem | undefined => {
    return cachedDownloads.find((item) => item.id === idOrUrl || item.fileUrl === idOrUrl);
  },

  async verifyOfflineAvailability(idOrUrl: string): Promise<boolean> {
    const item = cachedDownloads.find((d) => d.id === idOrUrl || d.fileUrl === idOrUrl);
    if (!item) return false;
    const blob = await getOfflineBlob(item.id);
    const isValid = Boolean(blob && blob.size > 0);
    if (!isValid && item.isOfflineAvailable) {
      item.isOfflineAvailable = false;
      persistDownloads();
      notifyListeners();
    }
    return isValid;
  },

  async getOfflineBlobUrl(idOrUrl: string): Promise<string | null> {
    const item = cachedDownloads.find((d) => d.id === idOrUrl || d.fileUrl === idOrUrl);
    if (!item) return null;
    const blob = await getOfflineBlob(item.id);
    if (blob && blob.size > 0) {
      return URL.createObjectURL(blob);
    }
    return null;
  },

  async getOfflineBlob(idOrUrl: string): Promise<Blob | null> {
    const item = cachedDownloads.find((d) => d.id === idOrUrl || d.fileUrl === idOrUrl);
    if (!item) return null;
    return await getOfflineBlob(item.id);
  },

  triggerDeviceDownload: (
    fileUrl: string,
    fileName: string,
    metadata?: {
      id?: string;
      title?: string;
      fileType?: "pdf" | "music" | "other";
      subjectId?: SubjectId;
      subjectName?: string;
      chapterTitle?: string;
      fileSize?: string;
    }
  ): DownloadedItem => {
    const rawUrl = (fileUrl || "").trim();
    const id = metadata?.id || `dl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const cleanTitle = metadata?.title || fileName || "SK MISSION BOARD File";
    const fileType = metadata?.fileType || "pdf";

    // Check if already downloading (prevent duplicate active downloads)
    const existing = cachedDownloads.find((d) => d.id === id || d.fileUrl === rawUrl);
    if (existing && existing.status === "downloading") {
      return existing;
    }

    const downloadRecord: DownloadedItem = {
      id,
      title: cleanTitle,
      fileType,
      fileUrl: rawUrl,
      subjectId: metadata?.subjectId,
      subjectName: metadata?.subjectName,
      chapterTitle: metadata?.chapterTitle,
      fileSize: metadata?.fileSize || "3.5 MB",
      downloadedAt: new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      }),
      status: "downloading",
      progress: 0,
      downloadedBytes: 0,
      totalBytes: 0,
      isOfflineAvailable: false
    };

    if (existing) {
      const idx = cachedDownloads.indexOf(existing);
      cachedDownloads[idx] = downloadRecord;
    } else {
      cachedDownloads.unshift(downloadRecord);
    }

    persistDownloads();
    notifyListeners();

    // Start streaming background download
    DownloadService.executeDownloadTask(downloadRecord, fileName);

    return downloadRecord;
  },

  startDownload: (metadata: {
    id: string;
    title: string;
    fileType?: "pdf" | "music" | "other";
    fileUrl: string;
    subjectId?: SubjectId;
    subjectName?: string;
    chapterTitle?: string;
    fileSize?: string;
  }): DownloadedItem => {
    return DownloadService.triggerDeviceDownload(
      metadata.fileUrl,
      `${metadata.title}.${metadata.fileType === "music" ? "mp3" : "pdf"}`,
      metadata
    );
  },

  addDownload: (item: {
    id: string;
    title: string;
    fileType?: "pdf" | "music" | "other";
    fileUrl: string;
    subjectId?: SubjectId;
    subjectName?: string;
    chapterTitle?: string;
    fileSize?: string;
  }) => {
    return DownloadService.triggerDeviceDownload(
      item.fileUrl,
      `${item.title}.${item.fileType === "music" ? "mp3" : "pdf"}`,
      item
    );
  },

  executeDownloadTask: async (item: DownloadedItem, requestedFileName?: string) => {
    const abortController = new AbortController();
    activeAbortControllers.set(item.id, abortController);

    const updateItem = (patches: Partial<DownloadedItem>) => {
      const target = cachedDownloads.find((d) => d.id === item.id);
      if (target) {
        Object.assign(target, patches);
        persistDownloads();
        notifyListeners();
      }
    };

    try {
      const rawUrl = item.fileUrl;
      const safeName = sanitizeFileName(requestedFileName || item.title, item.fileType);

      // 1. Data URL or Blob URL directly
      if (rawUrl.startsWith("data:") || rawUrl.startsWith("blob:")) {
        const res = await fetch(rawUrl);
        const blob = await res.blob();
        await saveBlobOffline(item.id, blob, item.fileType === "music" ? "audio/mpeg" : "application/pdf");

        // Trigger browser physical download
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = safeName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
        }, 500);

        updateItem({
          status: "completed",
          progress: 100,
          isOfflineAvailable: true,
          errorMsg: undefined
        });
        activeAbortControllers.delete(item.id);
        return;
      }

      // 2. Stream fetch with progress and header validation
      if (item.fileType === "pdf") {
        const { data, totalBytes } = await PdfService.fetchPdfBytes(
          rawUrl,
          (percent, loaded, total) => {
            updateItem({
              status: "downloading",
              progress: percent,
              downloadedBytes: loaded,
              totalBytes: total
            });
          },
          abortController.signal
        );

        const finalBlob = new Blob([data], { type: "application/pdf" });
        await saveBlobOffline(item.id, finalBlob, "application/pdf");
        PdfService.setCachedBytes(item.id, data);
        if (item.fileUrl) {
          PdfService.setCachedBytes(item.fileUrl, data);
        }

        // Trigger physical device file save
        const blobUrl = URL.createObjectURL(finalBlob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = safeName;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
        }, 500);

        const finalMb = (finalBlob.size / (1024 * 1024)).toFixed(1);

        updateItem({
          status: "completed",
          progress: 100,
          downloadedBytes: finalBlob.size,
          totalBytes: finalBlob.size,
          fileSize: `${finalMb} MB`,
          isOfflineAvailable: true,
          errorMsg: undefined
        });
      } else {
        // Audio / Other Streaming Fetch
        const response = await fetch(rawUrl, { signal: abortController.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const contentLength = response.headers.get("content-length");
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        let loaded = 0;

        const reader = response.body?.getReader();
        const chunks: Uint8Array[] = [];

        if (reader) {
          while (true) {
            if (abortController.signal.aborted) throw new Error("Download cancelled");
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              chunks.push(value);
              loaded += value.length;
              const percent = total > 0 ? Math.min(Math.round((loaded / total) * 100), 99) : 50;
              updateItem({
                status: "downloading",
                progress: percent,
                downloadedBytes: loaded,
                totalBytes: total
              });
            }
          }
        } else {
          const blob = await response.blob();
          chunks.push(new Uint8Array(await blob.arrayBuffer()));
          loaded = blob.size;
        }

        const finalBlob = new Blob(chunks, { type: "audio/mpeg" });
        await saveBlobOffline(item.id, finalBlob, "audio/mpeg");

        const blobUrl = URL.createObjectURL(finalBlob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = safeName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
        }, 500);

        updateItem({
          status: "completed",
          progress: 100,
          downloadedBytes: finalBlob.size,
          totalBytes: finalBlob.size,
          isOfflineAvailable: true,
          errorMsg: undefined
        });
      }
    } catch (err: any) {
      if (abortController.signal.aborted) {
        updateItem({
          status: "failed",
          errorMsg: "उपयोगकर्ता द्वारा डाउनलोड रद्द कर दिया गया।"
        });
      } else {
        console.warn("Download error:", err);
        updateItem({
          status: "failed",
          errorMsg: err?.message || "डाउनलोड विफल हुआ। कृपया दोबारा प्रयास करें।"
        });
      }
    } finally {
      activeAbortControllers.delete(item.id);
    }
  },

  retryDownload: (id: string) => {
    const item = cachedDownloads.find((d) => d.id === id);
    if (!item) return;

    item.status = "downloading";
    item.progress = 0;
    item.errorMsg = undefined;
    persistDownloads();
    notifyListeners();

    DownloadService.executeDownloadTask(item, item.title);
  },

  cancelDownload: (id: string) => {
    const controller = activeAbortControllers.get(id);
    if (controller) {
      controller.abort();
      activeAbortControllers.delete(id);
    }
    const item = cachedDownloads.find((d) => d.id === id);
    if (item && item.status === "downloading") {
      item.status = "failed";
      item.errorMsg = "डाउनलोड रद्द कर दिया गया।";
      persistDownloads();
      notifyListeners();
    }
  },

  removeDownload: async (id: string) => {
    DownloadService.cancelDownload(id);
    await removeOfflineBlob(id);
    cachedDownloads = cachedDownloads.filter((d) => d.id !== id);
    persistDownloads();
    notifyListeners();
  },

  clearAllDownloads: async () => {
    activeAbortControllers.forEach((ctrl) => ctrl.abort());
    activeAbortControllers.clear();

    for (const item of cachedDownloads) {
      await removeOfflineBlob(item.id);
    }

    cachedDownloads = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("skmb_downloads_v1");
    } catch (e) {
      console.warn("Error clearing downloads:", e);
    }
    notifyListeners();
  }
};
