import { DownloadedItem, SubjectId } from "../types";

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

// Load initial downloads
try {
  const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("skmb_downloads_v1");
  if (saved) {
    cachedDownloads = JSON.parse(saved);
    // Reset any interrupted "downloading" states to failed/retryable
    cachedDownloads = cachedDownloads.map((item) => {
      if (item.status === "downloading" || item.status === "queued") {
        return { ...item, status: "failed", errorMsg: "Download interrupted. Click retry to resume." };
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
      (item) => (item.id === idOrUrl || item.fileUrl === idOrUrl) && item.status === "completed"
    );
  },

  getDownloadItem: (idOrUrl: string): DownloadedItem | undefined => {
    return cachedDownloads.find((item) => item.id === idOrUrl || item.fileUrl === idOrUrl);
  },

  async getOfflineBlobUrl(idOrUrl: string): Promise<string | null> {
    const item = cachedDownloads.find((d) => d.id === idOrUrl || d.fileUrl === idOrUrl);
    if (!item) return null;
    const blob = await getOfflineBlob(item.id);
    if (blob) {
      return URL.createObjectURL(blob);
    }
    return null;
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

    // 1. Check if already downloading (prevent duplicate active downloads)
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
      fileSize: metadata?.fileSize || "2.4 MB",
      downloadedAt: new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      }),
      status: "downloading",
      progress: 5,
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

    // 2. Start streaming background download
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
    return DownloadService.triggerDeviceDownload(metadata.fileUrl, `${metadata.title}.${metadata.fileType === "music" ? "mp3" : "pdf"}`, metadata);
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
    return DownloadService.triggerDeviceDownload(item.fileUrl, `${item.title}.${item.fileType === "music" ? "mp3" : "pdf"}`, item);
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

      // Handle Google Drive / External URLs:
      const driveMatch =
        rawUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/) ||
        rawUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);

      let fetchUrl = rawUrl;
      if (driveMatch && driveMatch[1]) {
        fetchUrl = `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
      }

      // Check if data URL
      if (rawUrl.startsWith("data:")) {
        const res = await fetch(rawUrl);
        const blob = await res.blob();
        await saveBlobOffline(item.id, blob, item.fileType === "music" ? "audio/mpeg" : "application/pdf");
        
        // Trigger browser save
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = safeName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        updateItem({
          status: "completed",
          progress: 100,
          isOfflineAvailable: true,
          errorMsg: undefined
        });
        activeAbortControllers.delete(item.id);
        return;
      }

      // Attempt streaming fetch with progress tracking
      let response: Response;
      try {
        response = await fetch(fetchUrl, {
          signal: abortController.signal,
          mode: "cors"
        });
      } catch {
        // Fallback fetch if cors strict
        response = await fetch(rawUrl, {
          signal: abortController.signal
        });
      }

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const contentLength = response.headers.get("content-length");
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
      let loadedBytes = 0;

      if (totalBytes > 0) {
        updateItem({ totalBytes });
      }

      const reader = response.body?.getReader();
      const chunks: Uint8Array[] = [];

      if (reader) {
        let isDone = false;
        let simulatedPercent = 10;

        while (!isDone) {
          if (abortController.signal.aborted) {
            throw new Error("Download cancelled");
          }

          const { done, value } = await reader.read();
          if (done) {
            isDone = true;
            break;
          }

          if (value) {
            chunks.push(value);
            loadedBytes += value.length;

            if (totalBytes > 0) {
              const currentProgress = Math.min(Math.round((loadedBytes / totalBytes) * 100), 98);
              updateItem({
                downloadedBytes: loadedBytes,
                progress: currentProgress
              });
            } else {
              // Simulated incremental progress
              simulatedPercent = Math.min(simulatedPercent + 6, 92);
              updateItem({
                downloadedBytes: loadedBytes,
                progress: simulatedPercent
              });
            }
          }
        }
      } else {
        // Direct blob fallback
        const blob = await response.blob();
        chunks.push(new Uint8Array(await blob.arrayBuffer()));
      }

      // Construct final blob
      const finalBlob = new Blob(chunks, {
        type: item.fileType === "music" ? "audio/mpeg" : "application/pdf"
      });

      // Save genuinely to offline storage
      await saveBlobOffline(item.id, finalBlob, item.fileType === "music" ? "audio/mpeg" : "application/pdf");

      // Physical download to user's device Downloads directory
      const blobObjectUrl = URL.createObjectURL(finalBlob);
      const a = document.createElement("a");
      a.href = blobObjectUrl;
      a.download = safeName;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
      }, 500);

      // Update formatted file size
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
    } catch (err: any) {
      if (abortController.signal.aborted) {
        updateItem({
          status: "failed",
          errorMsg: "Download cancelled by user."
        });
      } else {
        console.warn("Download failed for item:", item.title, err);
        // If Direct Fetch failed due to external drive CORS limitations, trigger window.open fallback safely
        try {
          const driveMatch =
            item.fileUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/) ||
            item.fileUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
          if (driveMatch && driveMatch[1]) {
            window.open(`https://drive.google.com/uc?export=download&id=${driveMatch[1]}`, "_blank");
            updateItem({
              status: "completed",
              progress: 100,
              errorMsg: undefined
            });
            return;
          }
        } catch {
          // ignore
        }

        updateItem({
          status: "failed",
          errorMsg: err?.message || "Connection failed. Click retry to download."
        });
      }
    } finally {
      activeAbortControllers.delete(item.id);
    }
  },

  retryDownload: (id: string) => {
    const item = cachedDownloads.find((d) => d.id === id);
    if (!item) return;

    // Reset status
    item.status = "downloading";
    item.progress = 5;
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
      item.errorMsg = "Download cancelled.";
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
    // Abort all active downloads
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
