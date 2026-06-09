/**
 * CommentPanel.tsx
 * 사진 상세보기에서 코멘트 버튼 클릭 시 표시
 * · 사진은 고정 크기로 항상 위쪽에 표시
 * · 코멘트 영역은 최대 7.5cm까지 확장, 이후 스크롤
 * · 작성자 이름(오른쪽) + 시간(왼쪽) 표시
 */
import { useState, useRef, useEffect } from "react";
import type { MediaItem } from "../types.ts";
import "./CommentPanel.css";

export interface Comment {
  id: string;
  mediaId: string;
  authorName: string;
  text: string;
  createdAt: number;
}

const C_KEY = "remon:comments";
function loadComments(): Comment[] {
  try {
    return JSON.parse(localStorage.getItem(C_KEY) ?? "[]");
  } catch {
    return [];
  }
}
function saveComments(list: Comment[]) {
  localStorage.setItem(C_KEY, JSON.stringify(list));
}

function getCurrentUserName(): string {
  try {
    const raw = localStorage.getItem("remon_user");
    if (!raw) return "익명";
    const obj = JSON.parse(raw) as {
      name?: string;
      email?: string;
      username?: string;
    };
    if (obj.name && obj.name.trim()) return obj.name.trim();
    if (obj.username && obj.username.trim()) return obj.username.trim();
    if (obj.email) return obj.email.split("@")[0];
    return "익명";
  } catch {
    return "익명";
  }
}

const fmtTime = (ts: number) =>
  new Date(ts).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });

interface Props {
  item: MediaItem;
  onClose: () => void;
}

export default function CommentPanel({ item, onClose }: Props) {
  const [comments, setComments] = useState<Comment[]>(() =>
    loadComments().filter((c) => c.mediaId === item.id),
  );
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSend = () => {
    if (!text.trim()) return;
    const c: Comment = {
      id: String(Date.now()),
      mediaId: item.id,
      authorName: getCurrentUserName(),
      text: text.trim(),
      createdAt: Date.now(),
    };
    const all = loadComments();
    saveComments([...all, c]);
    setComments((prev) => [...prev, c]);
    setText("");
  };

  return (
    <div className="cmt__overlay" onClick={onClose}>
      <div className="cmt__sheet" onClick={(e) => e.stopPropagation()}>
        <div className="cmt__header">
          <span className="cmt__title">코멘트</span>
          <button className="cmt__close" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        {/* ✅ 사진만 — video 분기 완전 제거 */}
        <div className="cmt__media-wrap">
          <img src={item.url} alt="comment target" className="cmt__media" />
        </div>

        <div className="cmt__list" ref={listRef}>
          {comments.length === 0 ? (
            <p className="cmt__empty">첫 코멘트를 남겨보세요 ↓</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="cmt__row">
                <span className="cmt__time">{fmtTime(c.createdAt)}</span>
                <span className="cmt__text">{c.text}</span>
                <span className="cmt__author">{c.authorName}</span>
              </div>
            ))
          )}
        </div>

        <div className="cmt__input-bar">
          <input
            className="cmt__input"
            placeholder="코멘트를 입력하세요..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            maxLength={200}
          />
          <button
            className="cmt__send"
            onClick={handleSend}
            disabled={!text.trim()}
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
}
