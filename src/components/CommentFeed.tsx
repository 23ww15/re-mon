import { useState, useEffect, useMemo } from "react";
import type { MediaItem } from "../types";
import { getComments, subscribeToComments } from "../store/socialstore";
import "./CommentFeed.css";

interface Props {
  captures: MediaItem[];
  onClose: () => void;
}

const fmtTime = (ts: number) => {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "방금";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}분 전`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}시간 전`;
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

const fmtDateFull = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const TODAY_START = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export default function CommentFeed({ captures, onClose }: Props) {
  // ✅ remon_user는 JSON 객체로 저장되므로 name 파싱
  const myName = (() => {
    try {
      const obj = JSON.parse(localStorage.getItem("remon_user") ?? "{}");
      return obj.name ?? obj.email?.split("@")[0] ?? "나";
    } catch {
      return "나";
    }
  })();

  // ✅ 사진만 필터링 (video 타입 제거)
  const todayCaptures = useMemo(
    () =>
      captures.filter(
        (i) => i.type === "photo" && (i.capturedAt ?? 0) >= TODAY_START(),
      ),
    [captures],
  );

  const [allComments, setAllComments] = useState(() =>
    todayCaptures.flatMap((item) => getComments(item.id)),
  );

  useEffect(() => {
    const refresh = () =>
      setAllComments(todayCaptures.flatMap((item) => getComments(item.id)));
    return subscribeToComments(refresh);
  }, [todayCaptures]);

  const grouped = useMemo(() => {
    return todayCaptures
      .map((item) => ({
        item,
        comments: allComments
          .filter((c) => c.mediaId === item.id)
          .sort((a, b) => a.createdAt - b.createdAt),
      }))
      .filter((g) => g.comments.length > 0);
  }, [todayCaptures, allComments]);

  return (
    <div className="cf">
      <div className="cf__grain" />

      <div className="cf__header">
        <div>
          <span className="cf__logo">re-mon</span>
          <span className="cf__subtitle">오늘의 코멘트</span>
        </div>
        <button className="cf__close" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="cf__scroll">
        {grouped.length === 0 && (
          <div className="cf__empty">
            <p className="cf__empty-emoji">💬</p>
            <p>오늘 달린 코멘트가 없어요</p>
            <p className="cf__empty-sub">
              갤러리에서 사진을 선택해 코멘트를 남겨보세요
            </p>
          </div>
        )}

        {grouped.map(({ item, comments }) => (
          <div key={item.id} className="cf__group">
            <div className="cf__media-row">
              {/* ✅ 항상 사진이므로 img만 렌더 */}
              <div className="cf__thumb">
                <img src={item.url} alt="" />
              </div>
              <div className="cf__media-info">
                <span className="cf__media-type">📷 사진</span>
                <span className="cf__media-time">
                  {fmtDateFull(item.capturedAt ?? 0)}
                </span>
                <span className="cf__comment-count">
                  {comments.length}개의 코멘트
                </span>
              </div>
            </div>

            <div className="cf__comments">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className={`cf__comment ${c.authorName === myName ? "cf__comment--mine" : ""}`}
                >
                  <div className="cf__comment-bubble">
                    <div className="cf__comment-meta">
                      <span className="cf__comment-author">{c.authorName}</span>
                      <span className="cf__comment-time">
                        {fmtTime(c.createdAt)}
                      </span>
                    </div>
                    <p className="cf__comment-text">{c.text}</p>
                    {c.likes.length > 0 && (
                      <span className="cf__comment-likes">
                        ❤️ {c.likes.length}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
