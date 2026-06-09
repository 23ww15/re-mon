import React, { useRef, useState, useEffect, useCallback } from "react";
import type { FacingMode, MediaItem, Screen } from "../types.ts";
import Gallery from "../components/Gallery.tsx";
import FrameStudio from "../components/FrameStudio.tsx";
import FriendInvite from "../components/FriendInvite.tsx";
import GroupRoom from "../components/GroupRoom.tsx";
import GroupCameraView from "../components/Groupcameraview.tsx";
import { getFriends } from "../store/friendstore";
import type { GroupEntry } from "../store/groupstore";
import "./CameraScreen.css";

interface CameraScreenProps {
  onCapture?: (item: MediaItem) => void;
  onNavigate?: (screen: Screen) => void;
  onLogout?: () => void;
}

const CompositionIcon: React.FC = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="1.5" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <line x1="15" y1="3" x2="15" y2="21" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="3" y1="15" x2="21" y2="15" />
  </svg>
);
const FriendsIcon: React.FC = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3z" />
    <path d="M8 11c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3z" />
    <path d="M8 13c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    <path d="M16 13c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2c0-2.66-5.33-4-7-4z" />
  </svg>
);
const GroupIcon: React.FC = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const FlipIcon: React.FC = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 7L16 3L12 7" />
    <path d="M16 3V15C16 16.1046 15.1046 17 14 17H4" />
    <path d="M4 17L8 21L12 17" />
    <path d="M8 21V9C8 7.89543 8.89543 7 10 7H20" />
  </svg>
);

const CameraScreen: React.FC<CameraScreenProps> = ({ onCapture, onLogout }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<FacingMode>("environment");
  const [captures, setCaptures] = useState<MediaItem[]>([]);

  const [showGallery, setShowGallery] = useState(false);
  const [showFrameStudio, setShowFrameStudio] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [showGroupRoom, setShowGroupRoom] = useState(false);
  const [activeGroup, setActiveGroup] = useState<GroupEntry | null>(null);

  const [flashVisible, setFlashVisible] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [zoom, setZoom] = useState(1);
  const [showZoomUI, setShowZoomUI] = useState(false);
  const zoomRef = useRef(1);
  const zoomHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pinchStartDist = useRef(0);
  const pinchStartZoom = useRef(1);
  const isPinching = useRef(false);

  const startCamera = useCallback(async () => {
    setCameraReady(false);
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
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
      setError(null);
    } catch {
      setError("카메라 접근 권한을 허용해 주세요.");
    }
  }, [facingMode]);

  useEffect(() => {
    if (activeGroup) return;
    const timer = setTimeout(() => {
      void startCamera();
    }, 0);
    return () => {
      clearTimeout(timer);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [startCamera, activeGroup]);

  const applyZoom = useCallback(
    async (newZoom: number) => {
      const clamped = Math.round(Math.max(0.5, Math.min(5, newZoom)) * 10) / 10;
      zoomRef.current = clamped;
      setZoom(clamped);
      setShowZoomUI(true);

      if (zoomHideTimer.current) clearTimeout(zoomHideTimer.current);
      zoomHideTimer.current = setTimeout(() => setShowZoomUI(false), 1800);

      try {
        const track = streamRef.current?.getVideoTracks()[0];
        if (track) {
          const capabilities =
            track.getCapabilities() as MediaTrackCapabilities & {
              zoom?: { min: number; max: number };
            };
          if (capabilities.zoom) {
            const minZ = capabilities.zoom.min;
            const maxZ = capabilities.zoom.max;
            const mappedZoom = minZ + ((clamped - 0.5) / 4.5) * (maxZ - minZ);
            await track.applyConstraints({
              advanced: [
                {
                  zoom: Math.max(minZ, Math.min(maxZ, mappedZoom)),
                } as MediaTrackConstraintSet,
              ],
            });
          } else {
            if (videoRef.current) {
              const scale = clamped < 1 ? 1 : clamped;
              const mirror = facingMode === "user" ? "scaleX(-1)" : "";
              videoRef.current.style.transform =
                `scale(${scale}) ${mirror}`.trim();
            }
          }
        }
      } catch {
        /* */
      }
    },
    [facingMode],
  );

  const getTouchDist = (touches: React.TouchList | TouchList) => {
    const dx = touches[1].clientX - touches[0].clientX;
    const dy = touches[1].clientY - touches[0].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleVideoTouchStart = useCallback(
    (e: React.TouchEvent<HTMLVideoElement>) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        isPinching.current = true;
        pinchStartDist.current = getTouchDist(e.touches);
        pinchStartZoom.current = zoomRef.current;
      }
    },
    [],
  );

  const handleVideoTouchMove = useCallback(
    (e: React.TouchEvent<HTMLVideoElement>) => {
      if (!isPinching.current || e.touches.length !== 2) return;
      e.preventDefault();
      const dist = getTouchDist(e.touches);
      const scale = dist / pinchStartDist.current;
      void applyZoom(pinchStartZoom.current * scale);
    },
    [applyZoom],
  );

  const handleVideoTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLVideoElement>) => {
      if (e.touches.length < 2) isPinching.current = false;
    },
    [],
  );

  const takePhoto = () => {
    const video = videoRef.current,
      canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    setFlashVisible(true);
    setTimeout(() => setFlashVisible(false), 250);
    const url = canvas.toDataURL("image/jpeg", 0.95);
    const currentTime = Date.now();
    const item: MediaItem = {
      type: "photo",
      url,
      id: String(currentTime),
      capturedAt: currentTime,
    };
    setCaptures((prev) => [item, ...prev]);
    onCapture?.(item);
  };

  const flipCamera = () => {
    setZoom(1);
    zoomRef.current = 1;
    if (videoRef.current) videoRef.current.style.transform = "";
    setFacingMode((f) => (f === "environment" ? "user" : "environment"));
  };

  const handleDelete = (ids: string | string[]) => {
    setCaptures((prev) => {
      if (Array.isArray(ids)) return prev.filter((c) => !ids.includes(c.id));
      return prev.filter((c) => c.id !== ids);
    });
  };

  const handleGroupCapture = (item: MediaItem) => {
    setCaptures((prev) => [item, ...prev]);
    onCapture?.(item);
  };

  const shutterClass = [
    "cam__shutter",
    !cameraReady ? "cam__shutter--disabled" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (activeGroup) {
    return (
      <GroupCameraView
        group={activeGroup}
        friends={getFriends()}
        onCapture={handleGroupCapture}
        onLeave={() => setActiveGroup(null)}
      />
    );
  }

  return (
    <div className="cam">
      <div className={`cam__flash ${flashVisible ? "cam__flash--on" : ""}`} />
      <div className="cam__grain" />

      <video
        ref={videoRef}
        className={`cam__video ${facingMode === "user" ? "cam__video--mirrored" : ""}`}
        autoPlay
        playsInline
        muted
        onTouchStart={handleVideoTouchStart}
        onTouchMove={handleVideoTouchMove}
        onTouchEnd={handleVideoTouchEnd}
        style={{ touchAction: "none" }}
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {showGrid && <div className="cam__grid" />}

      <div
        className={`cam__zoom-overlay ${showZoomUI ? "cam__zoom-overlay--visible" : ""}`}
      >
        <div className="cam__zoom-value">{zoom.toFixed(1)}x</div>
        <div className="cam__zoom-bar">
          <span className="cam__zoom-limit">0.5x</span>
          <div className="cam__zoom-track">
            <div
              className="cam__zoom-fill"
              style={{ width: `${((zoom - 0.5) / 4.5) * 100}%` }}
            />
          </div>
          <span className="cam__zoom-limit">5x</span>
        </div>
      </div>

      <div className="cam__header">
        <div className="cam__logo">re-mon</div>
        <div className="cam__header-actions">
          <button
            className="cam__icon-btn"
            onClick={() => setShowFriends(true)}
            aria-label="친구 초대"
          >
            <FriendsIcon />
          </button>
          <button
            className="cam__icon-btn"
            onClick={() => setShowGroupRoom(true)}
            aria-label="그룹"
          >
            <GroupIcon />
          </button>
          <button
            className={`cam__icon-btn ${showGrid ? "cam__icon-btn--active" : ""}`}
            onClick={() => setShowGrid((v) => !v)}
            aria-label="toggle grid"
          >
            <CompositionIcon />
          </button>
          {onLogout && (
            <button
              className="cam__icon-btn"
              onClick={onLogout}
              aria-label="로그아웃"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="cam__bottom">
        <div className="cam__controls">
          <button
            className="cam__gallery-thumb"
            onClick={() => captures.length > 0 && setShowGallery(true)}
            aria-label="갤러리 열기"
          >
            {captures[0] ? (
              <img src={captures[0].url} alt="최근 캡처" />
            ) : (
              <div className="cam__gallery-thumb-empty" />
            )}
            {captures.length > 0 && (
              <span className="cam__gallery-count">{captures.length}</span>
            )}
          </button>

          <div className="cam__shutter-group">
            <button
              className="cam__flip-btn"
              onClick={flipCamera}
              aria-label="카메라 전환"
            >
              <FlipIcon />
            </button>
            <button
              className={shutterClass}
              onClick={takePhoto}
              disabled={!cameraReady}
              aria-label="사진 촬영"
            >
              <div className="cam__shutter-inner" />
            </button>
          </div>

          <button
            className="cam__frame-btn"
            onClick={() => setShowFrameStudio(true)}
            aria-label="프레임 스튜디오"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
            <span>프레임</span>
          </button>
        </div>
      </div>

      {showGallery && (
        <Gallery
          captures={captures}
          onClose={() => setShowGallery(false)}
          onDelete={handleDelete}
        />
      )}
      {showFrameStudio && (
        <FrameStudio
          captures={captures}
          onClose={() => setShowFrameStudio(false)}
        />
      )}
      {showFriends && <FriendInvite onClose={() => setShowFriends(false)} />}
      {showGroupRoom && (
        <GroupRoom
          onClose={() => setShowGroupRoom(false)}
          onEnterGroup={(group) => {
            setShowGroupRoom(false);
            setActiveGroup(group);
          }}
        />
      )}

      {error && (
        <div className="cam__error">
          <span>⚠ {error}</span>
        </div>
      )}
    </div>
  );
};

export default CameraScreen;
