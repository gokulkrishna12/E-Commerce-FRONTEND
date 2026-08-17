import { FiAlertTriangle, FiX } from "react-icons/fi";
import "./ConfirmModal.scss";

const ConfirmModal = ({
  open,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmLabel = "Yes, continue",
  cancelLabel = "Cancel",
  danger = true,
  busy = false,
  onConfirm,
  onClose,
}) => {
  if (!open) return null;

  return (
    <div className="confirm-overlay" onClick={onClose}>
      <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-head">
          <div className="confirm-head-left">
            <FiAlertTriangle size={19} />
            <h3>{title}</h3>
          </div>
          <button className="confirm-close" onClick={onClose}>
            <FiX size={19} />
          </button>
        </div>

        <p className="confirm-message">{message}</p>

        <div className="confirm-actions">
          <button className="btn btn-outline btn-block" onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            className={`btn ${danger ? "btn-danger" : "btn-primary"} btn-block`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;