export interface FriendEntry {
  id: string;
  nickname: string;
  username: string;
  status: "pending" | "accepted";
  addedAt: number;
}

const KEY = "remon:friends";

function load(): FriendEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as FriendEntry[];
  } catch {
    return [];
  }
}

function save(list: FriendEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("remon:friends-changed"));
}

export function getFriends(): FriendEntry[] {
  return load();
}

export function addFriend(f: Omit<FriendEntry, "id" | "addedAt">): FriendEntry {
  const list = load();
  const entry: FriendEntry = {
    ...f,
    id: String(Date.now()),
    addedAt: Date.now(),
  };
  save([entry, ...list]);
  return entry;
}

export function removeFriend(id: string): void {
  save(load().filter((f) => f.id !== id));
}

export function acceptFriend(id: string): void {
  save(
    load().map((f) =>
      f.id === id ? { ...f, status: "accepted" as const } : f,
    ),
  );
}

export function subscribeFriends(cb: () => void): () => void {
  window.addEventListener("remon:friends-changed", cb);
  return () => window.removeEventListener("remon:friends-changed", cb);
}
