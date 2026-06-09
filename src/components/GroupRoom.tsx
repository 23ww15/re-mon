import { useState, useEffect } from "react";
import {
  type FriendEntry,
  getFriends,
  subscribeFriends,
} from "../store/friendstore";
import {
  type GroupEntry,
  addGroup,
  getGroups,
  subscribeGroups,
} from "../store/groupstore";
import "./GroupRoom.css";

const COLORS = [
  "#FFE033",
  "#4E86FF",
  "#FF8C69",
  "#7EC8A4",
  "#D4A5E4",
  "#F4A261",
];

interface Props {
  onClose: () => void;
  onEnterGroup?: (group: GroupEntry) => void;
}

export default function GroupRoom({ onClose, onEnterGroup }: Props) {
  const [groups, setGroups] = useState<GroupEntry[]>(getGroups);
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [step, setStep] = useState<"list" | "name" | "members">("list");
  const [newName, setNewName] = useState("");
  const [selMembers, setSelMembers] = useState<string[]>([]);

  useEffect(() => {
    const syncFriends = () =>
      setFriends(getFriends().filter((f) => f.status === "accepted"));
    syncFriends();
    const u1 = subscribeFriends(syncFriends);
    const u2 = subscribeGroups(() => setGroups(getGroups()));
    return () => {
      u1();
      u2();
    };
  }, []);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const g: GroupEntry = {
      id: String(Date.now()),
      name: newName.trim(),
      memberIds: selMembers,
      color: COLORS[groups.length % COLORS.length],
      createdAt: Date.now(),
    };
    addGroup(g);
    setNewName("");
    setSelMembers([]);
    setStep("list");
  };

  const toggleMember = (id: string) =>
    setSelMembers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const cancelCreate = () => {
    setStep("list");
    setNewName("");
    setSelMembers([]);
  };

  const handleGroupClick = (g: GroupEntry) => {
    if (onEnterGroup) {
      onEnterGroup(g);
    }
  };

  return (
    <div className="grp__overlay" onClick={onClose}>
      <div className="grp__sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grp__handle" />

        <div className="grp__header">
          {step !== "list" ? (
            <button
              className="grp__back-btn"
              type="button"
              onClick={() =>
                step === "members" ? setStep("name") : cancelCreate()
              }
            >
              ←
            </button>
          ) : (
            <div style={{ width: 32 }} />
          )}
          <span className="grp__title">
            {step === "list"
              ? "그룹"
              : step === "name"
                ? "그룹 이름"
                : "멤버 선택"}
          </span>
          <button className="grp__close-btn" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        {step === "list" && (
          <>
            <div className="grp__body">
              {groups.length === 0 ? (
                <div className="grp__empty">
                  <span className="grp__empty-icon">🏠</span>
                  <p className="grp__empty-title">아직 그룹이 없어요</p>
                  <p className="grp__empty-sub">친구들과 일상을 나눠보세요</p>
                </div>
              ) : (
                <div className="grp__list">
                  {groups.map((g) => {
                    const memberNames = g.memberIds
                      .map((id) => friends.find((f) => f.id === id)?.nickname)
                      .filter(Boolean);
                    return (
                      <button
                        key={g.id}
                        className="grp__item"
                        type="button"
                        onClick={() => handleGroupClick(g)}
                      >
                        <div
                          className="grp__item-icon"
                          style={{ background: g.color }}
                        >
                          {g.name[0]}
                        </div>
                        <div className="grp__item-info">
                          <span className="grp__item-name">{g.name}</span>
                          <span className="grp__item-count">
                            {memberNames.length > 0
                              ? memberNames.join(", ")
                              : `멤버 ${g.memberIds.length + 1}명`}
                          </span>
                        </div>
                        <span className="grp__item-arrow">›</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="grp__footer">
              <button
                type="button"
                className="grp__new-btn"
                onClick={() => setStep("name")}
              >
                + 새 그룹 만들기
              </button>
            </div>
          </>
        )}

        {step === "name" && (
          <>
            <div className="grp__body grp__body--form">
              <p className="grp__form-label">그룹 이름을 입력해주세요</p>
              <input
                className="grp__input"
                placeholder="예: 유럽 여행 팀"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && newName.trim() && setStep("members")
                }
                autoFocus
                maxLength={20}
              />
            </div>
            <div className="grp__footer grp__footer--row">
              <button
                type="button"
                className="grp__btn grp__btn--cancel"
                onClick={cancelCreate}
              >
                취소
              </button>
              <button
                type="button"
                className="grp__btn grp__btn--confirm"
                onClick={() => setStep("members")}
                disabled={!newName.trim()}
              >
                다음
              </button>
            </div>
          </>
        )}

        {step === "members" && (
          <>
            <div className="grp__body">
              {friends.length === 0 ? (
                <div className="grp__empty">
                  <span className="grp__empty-icon">👥</span>
                  <p className="grp__empty-title">친구가 없어요</p>
                  <p className="grp__empty-sub">
                    친구 초대 후 그룹을 만들어보세요
                  </p>
                </div>
              ) : (
                <div className="grp__member-list">
                  <p className="grp__form-label">
                    함께할 친구를 선택하세요
                    {selMembers.length > 0 && (
                      <span className="grp__sel-count">
                        {" "}
                        ({selMembers.length}명 선택)
                      </span>
                    )}
                  </p>
                  {friends.map((f) => {
                    const on = selMembers.includes(f.id);
                    return (
                      <button
                        key={f.id}
                        type="button"
                        className={`grp__member-item ${on ? "grp__member-item--on" : ""}`}
                        onClick={() => toggleMember(f.id)}
                      >
                        <div
                          className="grp__member-avatar"
                          style={{ background: on ? "#4E86FF" : "#FFE033" }}
                        >
                          {f.nickname[0]?.toUpperCase()}
                        </div>
                        <div className="grp__member-info">
                          <span className="grp__member-name">{f.nickname}</span>
                          <span className="grp__member-id">@{f.username}</span>
                        </div>
                        <div
                          className={`grp__member-check ${on ? "grp__member-check--on" : ""}`}
                        >
                          {on ? "✓" : ""}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="grp__footer grp__footer--row">
              <button
                type="button"
                className="grp__btn grp__btn--cancel"
                onClick={cancelCreate}
              >
                취소
              </button>
              <button
                type="button"
                className="grp__btn grp__btn--confirm"
                onClick={handleCreate}
              >
                그룹 만들기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
