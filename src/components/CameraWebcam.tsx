import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";

const CameraAccess: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setImgSrc(imageSrc);
    }
  }, [webcamRef]);

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>TypeScript 카메라 접근</h2>

      <div style={{ marginBottom: "15px" }}>
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          width={400}
          videoConstraints={{
            width: 1280,
            height: 720,
            facingMode: "user",
          }}
        />
      </div>

      <button onClick={capture}>사진 촬영</button>

      {imgSrc && (
        <div style={{ marginTop: "20px" }}>
          <h3>촬영 결과:</h3>
          <img src={imgSrc} alt="Captured" width={400} />
        </div>
      )}
    </div>
  );
};

export default CameraAccess;
