export interface SocialComment {
  id: string;
  mediaId: string;
  authorName: string;
  text: string;
  createdAt: number;
  likes: string[];
}

const C_KEY = "remon:comments";
const CHANGE_EVT = "remon:comments-changed";

function loadAll(): SocialComment[] {
  try {
    const raw = JSON.parse(localStorage.getItem(C_KEY) ?? "[]") as Array<{
      id: string;
      mediaId: string;
      authorName: string;
      text: string;
      createdAt: number;
      likes?: string[];
    }>;
    return raw.map((c) => ({ ...c, likes: c.likes ?? [] }));
  } catch {
    return [];
  }
}

export function getComments(mediaId: string): SocialComment[] {
  return loadAll().filter((c) => c.mediaId === mediaId);
}

export function subscribeToComments(cb: () => void): () => void {
  const handleStorage = (e: StorageEvent) => {
    if (e.key === C_KEY) cb();
  };
  window.addEventListener(CHANGE_EVT, cb);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(CHANGE_EVT, cb);
    window.removeEventListener("storage", handleStorage);
  };
}

export function toggleLike(commentId: string, userName: string): void {
  try {
    const all = loadAll();
    const updated = all.map((c) => {
      if (c.id !== commentId) return c;
      const likes = c.likes.includes(userName)
        ? c.likes.filter((u) => u !== userName)
        : [...c.likes, userName];
      return { ...c, likes };
    });
    localStorage.setItem(C_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(CHANGE_EVT));
  } catch {
    /**/
  }
}
