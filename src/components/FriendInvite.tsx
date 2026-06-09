import { useState, useEffect } from "react";
import {
  type FriendEntry,
  getFriends,
  addFriend,
  removeFriend,
  subscribeFriends,
} from "../store/friendstore";
import "./FriendInvite.css";

interface Props {
  onClose: () => void;
}

export default function FriendInvite({ onClose }: Props) {
  const [tab, setTab] = useState<"list" | "invite">("list");
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{
    nickname: string;
    username: string;
  } | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeFriends(() => {
      setFriends(getFriends());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const shareLink = async () => {
    const url = `${window.location.origin}?invite=remon-${Date.now()}`;
    if (navigator.share) {
      await navigator.share({ title: "re-mon 친구 초대", url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSearch = () => {
    const q = query.trim().replace(/^@/, "");
    if (!q) return;
    const alreadyAdded = friends.some((f) => f.username === q);
    if (alreadyAdded) {
      setResult(null);
      setNotFound(true);
      return;
    }
    if (q.length >= 2) {
      setResult({ nickname: q, username: q });
      setNotFound(false);
    } else {
      setResult(null);
      setNotFound(true);
    }
  };

  const handleAdd = () => {
    if (!result) return;
    addFriend({
      nickname: result.nickname,
      username: result.username,
      status: "accepted",
    });
    setResult(null);
    setQuery("");
    setNotFound(false);
  };

  const handleRemove = (id: string) => {
    if (window.confirm("친구를 삭제하시겠어요?")) removeFriend(id);
  };

  const accepted = friends.filter((f) => f.status === "accepted");

  return (
    <div className="fri__overlay" onClick={onClose}>
      <div className="fri__sheet" onClick={(e) => e.stopPropagation()}>
        <div className="fri__handle" />

        <div className="fri__header">
          <span className="fri__title">친구와 함께</span>
          <button className="fri__close-btn" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <div className="fri__tabs">
          <button
            type="button"
            className={`fri__tab ${tab === "list" ? "fri__tab--on" : ""}`}
            onClick={() => setTab("list")}
          >
            친구 목록
            {accepted.length > 0 && (
              <span className="fri__tab-badge">{accepted.length}</span>
            )}
          </button>
          <button
            type="button"
            className={`fri__tab ${tab === "invite" ? "fri__tab--on" : ""}`}
            onClick={() => setTab("invite")}
          >
            초대하기
          </button>
        </div>

        {tab === "list" && (
          <div className="fri__body">
            {accepted.length === 0 ? (
              <div className="fri__empty">
                <span className="fri__empty-icon">👥</span>
                <p className="fri__empty-title">아직 친구가 없어요</p>
                <p className="fri__empty-sub">
                  초대하기 탭에서 친구를 추가해보세요
                </p>
              </div>
            ) : (
              <div className="fri__list">
                <p className="fri__list-label">친구 ({accepted.length})</p>
                {accepted.map((f) => (
                  <div key={f.id} className="fri__item">
                    <div className="fri__item-avatar">
                      {f.nickname[0]?.toUpperCase()}
                    </div>
                    <div className="fri__item-info">
                      <span className="fri__item-name">{f.nickname}</span>
                      <span className="fri__item-id">@{f.username}</span>
                    </div>
                    <button
                      type="button"
                      className="fri__item-del"
                      onClick={() => handleRemove(f.id)}
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "invite" && (
          <div className="fri__body fri__body--invite">
            {/* ✅ 초대 링크 공유하기 버튼 */}
            <button
              type="button"
              className={`fri__link-btn ${copied ? "fri__link-btn--copied" : ""}`}
              onClick={shareLink}
            >
              <span className="fri__link-icon">🔗</span>
              {copied ? "링크가 복사되었어요!" : "초대 링크 공유하기"}
            </button>

            <div className="fri__divider">
              <span>또는 직접 입력</span>
            </div>

            <div className="fri__field-label">사용자 이름 / 아이디</div>
            <div className="fri__search-row">
              <input
                className="fri__input"
                placeholder="예: golden_hour"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setResult(null);
                  setNotFound(false);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>

            {result && (
              <div className="fri__result">
                <div className="fri__result-avatar">
                  {result.nickname[0]?.toUpperCase()}
                </div>
                <div className="fri__result-info">
                  <span className="fri__result-name">{result.nickname}</span>
                  <span className="fri__result-id">@{result.username}</span>
                </div>
              </div>
            )}
            {notFound && (
              <p className="fri__not-found">사용자를 찾을 수 없어요</p>
            )}

            <button
              type="button"
              className="fri__send-btn"
              onClick={result ? handleAdd : handleSearch}
              disabled={!query.trim()}
            >
              {result ? "친구 추가" : "초대 요청 보내기"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
