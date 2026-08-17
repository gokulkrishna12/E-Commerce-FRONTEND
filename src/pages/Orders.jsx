import { useState, useEffect } from "react";
import API from "../api/axios";
import toast from "react-hot-toast";
import { FiPackage, FiMapPin, FiX, FiAlertTriangle, FiTrash2, FiMessageSquare } from "react-icons/fi";
import ConfirmModal from "../components/ConfirmModal";
import OrderTimeline from "../components/OrderTimeline";
import "./Orders.scss";

const STATUS_CLASS = {
  PENDING: "status-pending", CONFIRMED: "status-confirmed", SHIPPED: "status-shipped",
  DELIVERED: "status-delivered", CANCELLED: "status-cancelled",
};

const CANCEL_REASONS = [
  "Ordered by mistake", "Found a better price elsewhere", "Changed my mind",
  "Delivery time is too long", "Duplicate order", "Other",
];

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [cancelId, setCancelId] = useState(null);
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [busy, setBusy] = useState(false);

  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const res = await API.get("/orders/my-orders");
      setOrders(res.data);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const openCancel = (id) => { setCancelId(id); setReason("Ordered by mistake"); setCustomReason(""); };
  const closeCancel = () => { setCancelId(null); setReason(""); setCustomReason(""); };

  const confirmCancel = async () => {
    const finalReason = reason === "Other" ? customReason.trim() : reason;
    if (!finalReason) { toast.error("Please choose or describe a reason"); return; }
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
      setOrders((prev) => prev.filter((o) => o.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to remove order");
    } finally {
      setDeleting(false);
    }
  };

  const splitAddress = (address) => {
    const [addr, reasonPart] = (address || "").split("| Cancel reason:");
    return { addr: addr?.trim(), cancelReason: reasonPart?.trim() };
  };

  return (
    <div className="page-shell">

      {cancelId && (
        <div className="modal-overlay" onClick={closeCancel}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-head-left"><FiAlertTriangle size={19} /><h3>Cancel this order?</h3></div>
              <button className="modal-close" onClick={closeCancel}><FiX size={19} /></button>
            </div>
            <p className="modal-sub">Let us know why — it helps us improve.</p>
            <div className="reason-list">
              {CANCEL_REASONS.map((r) => (
                <button key={r} className={`reason-btn ${reason === r ? "is-active" : ""}`} onClick={() => setReason(r)}>{r}</button>
              ))}
            </div>
            {reason === "Other" && (
              <textarea className="field-textarea reason-textarea" placeholder="Tell us what happened…" rows={3}
                value={customReason} onChange={(e) => setCustomReason(e.target.value)} />
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
      ) : !orders.length ? (
        <div className="state-block">
          <div className="state-icon"><FiPackage size={24} /></div>
          <h3>No orders yet</h3>
          <p>Once you place an order, it'll show up here.</p>
        </div>
      ) : (
        <div className="order-list">
          {orders.map((order) => {
            const { addr, cancelReason } = splitAddress(order.shippingAddress);
            return (
              <div key={order.id} className="order-card">
                <div className="order-card-head">
                  <div>
                    <h3>Order #{order.id}</h3>
                    <p className="order-date">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`status-pill ${STATUS_CLASS[order.status] || "status-pending"}`}>{order.status}</span>
                </div>

                <OrderTimeline status={order.status} />

                <div className="order-items">
                  {order.orderItems?.map((item) => (
                    <div key={item.id} className="order-item">
                      <div className="order-item-img">
                        {item.product?.imageUrl
                          ? <img src={item.product.imageUrl} alt={item.product.name} onError={(e) => { e.target.style.display = "none"; }} />
                          : <FiPackage size={16} color="var(--muted-soft)" />}
                      </div>
                      <span className="order-item-name">{item.product.name}</span>
                      <span className="order-item-qty">×{item.quantity}</span>
                      <span className="price-tag">₹{item.unitPrice}</span>
                    </div>
                  ))}
                </div>

                {cancelReason && (
                  <div className="cancel-reason-note"><FiMessageSquare size={13} /> Reason: {cancelReason}</div>
                )}

                <div className="order-card-foot">
                  <p className="order-address"><FiMapPin size={13} /> {addr}</p>
                  <div className="order-foot-right">
                    <p className="order-total">Total: <strong className="price-tag">₹{order.totalAmount}</strong></p>
                    {(order.status === "PENDING" || order.status === "CONFIRMED") && (
                      <button className="btn btn-danger btn-sm" onClick={() => openCancel(order.id)}>Cancel order</button>
                    )}
                    {order.status === "CANCELLED" && (
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
