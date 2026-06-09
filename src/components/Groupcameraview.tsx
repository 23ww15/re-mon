import { useRef, useEffect, useState, useCallback } from "react";
import type { GroupEntry } from "../store/groupstore";
import type { FriendEntry } from "../store/friendstore";
import type { MediaItem } from "../types.ts";
import "./GroupCameraView.css";

interface Props {
  group: GroupEntry;
  friends: FriendEntry[];
  onCapture: (item: MediaItem) => void;
  onLeave: () => void;
}

function getGrid(n: number): { cols: number; rows: number } {
  if (n <= 1) return { cols: 1, rows: 1 };
  if (n === 2) return { cols: 2, rows: 1 };
  if (n === 3) return { cols: 2, rows: 2 };
  return { cols: 2, rows: 2 };
}

export default function GroupCameraView({
  group,
  friends,
  onCapture,
  onLeave,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [flash, setFlash] = useState(false);

  const myName = (() => {
    try {
      const u = JSON.parse(localStorage.getItem("remon_user") ?? "{}") as {
        name?: string;
      };
      return u.name ?? "나";
    } catch {
      return "나";
    }
  })();

  const memberList = [
    { id: "me", nickname: myName },
    ...(group.memberIds
      .slice(0, 3)
      .map((id) => friends.find((f) => f.id === id))
      .filter(Boolean) as FriendEntry[]),
  ].slice(0, 4);

  const { cols, rows } = getGrid(memberList.length);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadeddata = () => {
          void videoRef.current!.play();
          setCameraReady(true);
        };
      }
    } catch {
      /* */
    }
  }, []);

  useEffect(() => {
    void startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [startCamera]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    setFlash(true);
    setTimeout(() => setFlash(false), 200);
    const url = canvas.toDataURL("image/jpeg", 0.95);
    onCapture({
      type: "photo",
      url,
      id: String(Date.now()),
      capturedAt: Date.now(),
    });
  };

  return (
    <div className="gcv">
      {flash && <div className="gcv__flash" />}

      <div className="gcv__header">
        <button className="gcv__leave" onClick={onLeave}>
          ← 나가기
        </button>
        <span className="gcv__group-name">{group.name}</span>
        <div style={{ width: 60 }} />
      </div>

      <div
        className="gcv__grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
      >
        {Array.from({ length: cols * rows }).map((_, i) => {
          const member = memberList[i];
          const isMe = member?.id === "me";
          return (
            <div
              key={i}
              className={`gcv__cell ${!member ? "gcv__cell--empty" : ""}`}
            >
              {isMe && (
                <video
                  ref={videoRef}
                  className="gcv__video"
                  autoPlay
                  playsInline
                  muted
                />
              )}
              {!isMe && member && (
                <div className="gcv__placeholder">
                  <div className="gcv__avatar">
                    {member.nickname[0]?.toUpperCase()}
                  </div>
                </div>
              )}
              {member && (
                <div className="gcv__cell-label">{member.nickname}</div>
              )}
              {isMe && !cameraReady && (
                <div className="gcv__loading">카메라 준비 중...</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="gcv__bottom">
        <button
          className={`gcv__shutter ${!cameraReady ? "gcv__shutter--disabled" : ""}`}
          onClick={handleCapture}
          disabled={!cameraReady}
          aria-label="촬영"
        >
          <div className="gcv__shutter-inner" />
        </button>
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}
