import { useState, useEffect, useRef } from "react";
import { FiCamera, FiX, FiRefreshCw, FiCheck, FiAlertTriangle } from "react-icons/fi";
import "./CameraCapture.scss";

const CameraCapture = ({ open, onClose, onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [facingMode, setFacingMode] = useState("environment");
  const [status, setStatus] = useState("loading");
  const [capturedImage, setCapturedImage] = useState(null);

  useEffect(() => {
    if (open) startCamera(facingMode);
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, facingMode]);

  const startCamera = async (mode) => {
    stopCamera();
    setCapturedImage(null);
    setStatus("loading");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus("unsupported");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
        audio: false,
      });
      streamRef.current = stream;

      // ✅ videoRef is now ALWAYS mounted (see JSX below), so this never
      // silently does nothing — that was the actual black-screen bug.
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setStatus("ready");
    } catch (err) {
      setStatus("denied");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const takeSnapshot = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    setCapturedImage(canvas.toDataURL("image/jpeg", 0.9));
  };

  const retake = () => setCapturedImage(null);

  const confirmPhoto = () => {
    canvasRef.current.toBlob((blob) => {
      const file = new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" });
      onCapture(file);
      handleClose();
    }, "image/jpeg", 0.9);
  };

  const flipCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  if (!open) return null;

  const showVideo = status === "ready" && !capturedImage;

  return (
    <div className="camera-overlay" onClick={handleClose}>
      <div className="camera-box" onClick={(e) => e.stopPropagation()}>
        <div className="camera-head">
          <span><FiCamera size={17} /> Take a photo</span>
          <button className="camera-close" onClick={handleClose}><FiX size={19} /></button>
        </div>

        <div className="camera-stage">
          {status === "loading" && <p className="camera-msg">Starting camera…</p>}

          {status === "denied" && (
            <div className="camera-msg camera-msg-error">
              <FiAlertTriangle size={20} />
              <p>Camera access was denied or blocked.</p>
              <span>Please allow camera permission, or choose a photo from your gallery instead.</span>
            </div>
          )}

          {status === "unsupported" && (
            <div className="camera-msg camera-msg-error">
              <FiAlertTriangle size={20} />
              <p>Camera isn't available here.</p>
              <span>This page needs to be on HTTPS (or localhost) for camera access. Try choosing a photo instead.</span>
            </div>
          )}

          {/* ✅ Always mounted, hidden via CSS instead of conditionally
              rendered — this is the fix for the black screen. */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`camera-video ${showVideo ? "is-visible" : ""}`}
          />

          {capturedImage && <img src={capturedImage} alt="Captured" className="camera-preview-img" />}

          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>

        <div className="camera-actions">
          {showVideo && (
            <>
              <button className="btn btn-outline btn-sm" onClick={flipCamera}>
                <FiRefreshCw size={14} /> Flip camera
              </button>
              <button className="camera-shutter" onClick={takeSnapshot} aria-label="Capture photo" />
            </>
          )}

          {capturedImage && (
            <>
              <button className="btn btn-outline btn-block" onClick={retake}>Retake</button>
              <button className="btn btn-primary btn-block" onClick={confirmPhoto}>
                <FiCheck size={15} /> Use this photo
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;