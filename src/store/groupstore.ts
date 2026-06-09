/**
 * groupStore.ts — 그룹 데이터 공유 스토어
 */
export interface GroupEntry {
  id: string;
  name: string;
  memberIds: string[]; // FriendEntry.id 배열
  color: string;
  createdAt: number;
}

const KEY = "remon:groups";
const CHG_EVT = "remon:groups-changed";

function load(): GroupEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}
function save(list: GroupEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(CHG_EVT));
}

export const getGroups = (): GroupEntry[] => load();
export const addGroup = (g: GroupEntry): void => save([g, ...load()]);
export const deleteGroup = (id: string): void =>
  save(load().filter((g) => g.id !== id));
export const subscribeGroups = (cb: () => void): (() => void) => {
  window.addEventListener(CHG_EVT, cb);
  return () => window.removeEventListener(CHG_EVT, cb);
};
