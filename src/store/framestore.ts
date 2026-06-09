export interface PhotoInset {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ManagedFrame {
  id: string;
  name: string;
  tag: string;
  overlayDataUrl: string;
  bgColor: string;
  inset: PhotoInset;
  numSlots: number;
  slotInsets?: PhotoInset[];
  createdAt: number;
}

const DB_NAME = "remon_db_v2";
const DB_VER = 1;
const STORE = "frames";
const CHANGE_EVT = "remon:frames-changed";

let _db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = (e) => {
      _db = (e.target as IDBOpenDBRequest).result;
      _db!.onclose = () => {
        _db = null;
      };
      resolve(_db!);
    };
    req.onerror = (e) => reject((e.target as IDBOpenDBRequest).error);
  });
}

function notify() {
  window.dispatchEvent(new CustomEvent(CHANGE_EVT));
}

export async function getFramesAsync(): Promise<ManagedFrame[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
      req.onsuccess = () =>
        resolve(
          (req.result as ManagedFrame[]).sort(
            (a, b) => b.createdAt - a.createdAt,
          ),
        );
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error("[frameStore] getFramesAsync error:", e);
    return [];
  }
}

export async function addFrameAsync(
  data: Omit<ManagedFrame, "id" | "createdAt">,
): Promise<ManagedFrame> {
  const frame: ManagedFrame = {
    ...data,
    numSlots: data.numSlots ?? 1,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).put(frame);
    req.onsuccess = () => {
      notify();
      resolve(frame);
    };
    req.onerror = () => reject(req.error);
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteFrameAsync(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db
      .transaction(STORE, "readwrite")
      .objectStore(STORE)
      .delete(id);
    req.onsuccess = () => {
      notify();
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

export function subscribeToFrames(cb: () => void): () => void {
  window.addEventListener(CHANGE_EVT, cb);
  return () => window.removeEventListener(CHANGE_EVT, cb);
}

export function compressFrame(dataUrl: string, maxLong = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(
        maxLong / Math.max(img.naturalWidth, img.naturalHeight),
        1,
      );
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d")!;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

const imgCache = new Map<string, HTMLImageElement>();
export function loadOverlayImage(dataUrl: string): Promise<HTMLImageElement> {
  if (imgCache.has(dataUrl)) return Promise.resolve(imgCache.get(dataUrl)!);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imgCache.set(dataUrl, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}
