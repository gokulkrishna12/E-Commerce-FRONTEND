import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import toast from "react-hot-toast";
import { FiPackage, FiMapPin, FiX, FiAlertTriangle, FiTrash2, FiMessageSquare } from "react-icons/fi";
import ConfirmModal from "../components/ConfirmModal";
import OrderTimeline from "../components/OrderTimeline";
import { useAuth } from "../context/AuthContext";
import "./Orders.scss";

const STATUS_CLASS = {
  PENDING: "status-pending",
  CONFIRMED: "status-confirmed",
  SHIPPED: "status-shipped",
  DELIVERED: "status-delivered",
  CANCELLED: "status-cancelled",
};

const CANCEL_REASONS = [
  "Ordered by mistake",
  "Found a better price elsewhere",
  "Changed my mind",
  "Delivery time is too long",
  "Duplicate order",
  "Other",
];

const resolveImageUrl = (url) => {
  if (!url) return "";
  return url.replace(/^http:\/\/54\.235\.58\.181:8080/, "");
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cancelId, setCancelId] = useState(null);
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [busy, setBusy] = useState(false);

  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token && !user) {
      navigate("/login");
      return;
    }
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const res = await API.get("/orders/my-orders");
      const raw = res.data;

      let list = [];
      if (Array.isArray(raw)) {
        list = raw;
      } else if (Array.isArray(raw?.content)) {
        list = raw.content;
      } else if (Array.isArray(raw?.orders)) {
        list = raw.orders;
      } else if (Array.isArray(raw?.data)) {
        list = raw.data;
      } else if (raw && typeof raw === "object") {
        const foundArray = Object.values(raw).find((v) => Array.isArray(v));
        if (foundArray) list = foundArray;
      }

      setOrders(list);
    } catch {
      toast.error("Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const openCancel = (id) => {
    setCancelId(id);
    setReason("Ordered by mistake");
    setCustomReason("");
  };

  const closeCancel = () => {
    setCancelId(null);
    setReason("");
    setCustomReason("");
  };

  const confirmCancel = async () => {
    const finalReason = reason === "Other" ? customReason.trim() : reason;
    if (!finalReason) {
      toast.error("Please choose or describe a reason");
      return;
    }
    setBusy(true);
    try {
      await API.put(`/orders/cancel/${cancelId}?reason=${encodeURIComponent(finalReason)}`);
      toast.success("Order cancelled");
      closeCancel();
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not cancel this order");
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await API.delete(`/orders/delete/${deleteId}`);
      toast.success("Removed from history");
      setOrders((prev) => (Array.isArray(prev) ? prev.filter((o) => o?.id !== deleteId) : []));
      setDeleteId(null);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to remove order");
    } finally {
      setDeleting(false);
    }
  };

  const splitAddress = (address) => {
    const [addr, reasonPart] = (address || "").split("| Cancel reason:");
    return { addr: addr?.trim() || "Standard Delivery Address", cancelReason: reasonPart?.trim() };
  };

  const validOrders = Array.isArray(orders) ? orders : [];

  return (
    <div className="page-shell">
      {cancelId && (
        <div className="modal-overlay" onClick={closeCancel}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-head-left">
                <FiAlertTriangle size={19} />
                <h3>Cancel this order?</h3>
              </div>
              <button className="modal-close" onClick={closeCancel}><FiX size={19} /></button>
            </div>
            <p className="modal-sub">Let us know why — it helps us improve.</p>
            <div className="reason-list">
              {CANCEL_REASONS.map((r) => (
                <button
                  key={r}
                  className={`reason-btn ${reason === r ? "is-active" : ""}`}
                  onClick={() => setReason(r)}
                >
                  {r}
                </button>
              ))}
            </div>
            {reason === "Other" && (
              <textarea
                className="field-textarea reason-textarea"
                placeholder="Tell us what happened…"
                rows={3}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
              />
            )}
            <div className="modal-actions">
              <button className="btn btn-outline btn-block" onClick={closeCancel}>Keep order</button>
              <button className="btn btn-danger btn-block" onClick={confirmCancel} disabled={busy || !reason}>
                {busy ? "Cancelling…" : "Confirm cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        title="Remove this order?"
        message="This will permanently remove the cancelled order from your history. This cannot be undone."
        confirmLabel="Yes, remove it"
        cancelLabel="Keep it"
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteId(null)}
      />

      <div className="orders-head">
        <span className="eyebrow">History</span>
        <h1>My orders</h1>
      </div>

      {loading ? (
        <div className="state-block"><p>Loading orders…</p></div>
      ) : !validOrders.length ? (
        <div className="state-block">
          <div className="state-icon"><FiPackage size={24} /></div>
          <h3>No orders yet</h3>
          <p>Once you place an order, it'll show up here.</p>
        </div>
      ) : (
        <div className="order-list">
          {validOrders.map((order, idx) => {
            if (!order) return null;
            const { addr, cancelReason } = splitAddress(order.shippingAddress);
            const rawItems = order.orderItems || order.items || order.products || [];
            const orderItems = Array.isArray(rawItems) ? rawItems : [];
            const statusKey = order.status || "PENDING";
            const orderTotal = Number(order.totalAmount || order.total || 0).toFixed(2);

            return (
              <div key={order.id || `order-${idx}`} className="order-card">
                <div className="order-card-head">
                  <div>
                    <h3>Order #{order.id || "—"}</h3>
                    <p className="order-date">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ""}
                    </p>
                  </div>
                  <span className={`status-pill ${STATUS_CLASS[statusKey] || "status-pending"}`}>
                    {statusKey}
                  </span>
                </div>

                <OrderTimeline status={statusKey} />

                <div className="order-items">
                  {orderItems.map((item, i) => {
                    const product = item?.product || item || {};
                    const price = Number(item?.unitPrice || item?.price || product?.price || 0).toFixed(2);
                    const qty = item?.quantity || 1;
                    const imgUrl = resolveImageUrl(product?.imageUrl || item?.imageUrl);

                    return (
                      <div key={item?.id || `item-${i}`} className="order-item">
                        <div className="order-item-img">
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt={product?.name || "Product"}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://placehold.co/80x80?text=Item";
                              }}
                            />
                          ) : (
                            <FiPackage size={16} color="var(--muted-soft)" />
                          )}
                        </div>
                        <span className="order-item-name">{product?.name || "Product item"}</span>
                        <span className="order-item-qty">×{qty}</span>
                        <span className="price-tag">₹{price}</span>
                      </div>
                    );
                  })}
                </div>

                {cancelReason && (
                  <div className="cancel-reason-note">
                    <FiMessageSquare size={13} /> Reason: {cancelReason}
                  </div>
                )}

                <div className="order-card-foot">
                  <p className="order-address"><FiMapPin size={13} /> {addr}</p>
                  <div className="order-foot-right">
                    <p className="order-total">
                      Total: <strong className="price-tag">₹{orderTotal}</strong>
                    </p>
                    {(statusKey === "PENDING" || statusKey === "CONFIRMED") && (
                      <button className="btn btn-danger btn-sm" onClick={() => openCancel(order.id)}>
                        Cancel order
                      </button>
                    )}
                    {statusKey === "CANCELLED" && (
                      <button className="btn btn-outline btn-sm" onClick={() => setDeleteId(order.id)}>
                        <FiTrash2 size={13} /> Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;