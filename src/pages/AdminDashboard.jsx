import { useState, useEffect, useRef } from "react";
import API from "../api/axios";
import toast from "react-hot-toast";
import {
  FiPlus, FiTrash2, FiX, FiPackage, FiShoppingCart,
  FiCheckCircle, FiSettings, FiSlash, FiAlertTriangle,
  FiEdit2, FiUpload, FiTrendingUp,
} from "react-icons/fi";
import { TbCurrencyRupee } from "react-icons/tb";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getCategoryColor } from "../data/categories";
import ConfirmModal from "../components/ConfirmModal";
import "./AdminDashboard.scss";

const CATEGORY_OPTIONS = ["Electronics", "Fashion", "Home & Kitchen", "Sports", "Books", "Beauty"];
const LOW_STOCK_THRESHOLD = 5;

const STATUS_CLASS = {
  PENDING: "status-pending", CONFIRMED: "status-confirmed", SHIPPED: "status-shipped",
  DELIVERED: "status-delivered", CANCELLED: "status-cancelled",
};

const EMPTY_FORM = { name: "", description: "", price: "", stock: "", category: "", imageUrl: "" };

const AdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("products");
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);

  const [imgStatus, setImgStatus] = useState("idle");
  const [uploadingProductImage, setUploadingProductImage] = useState(false);
  const productImgInputRef = useRef(null);

  const [confirmAction, setConfirmAction] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);

  useEffect(() => { fetchProducts(); fetchOrders(); }, []);

  useEffect(() => {
    if (!form.imageUrl.trim()) {
      setImgStatus("idle");
      return;
    }
    setImgStatus("checking");
    const timer = setTimeout(() => {
      const testImg = new Image();
      testImg.onload = () => setImgStatus("ok");
      testImg.onerror = () => setImgStatus("error");
      testImg.src = form.imageUrl;
    }, 500);
    return () => clearTimeout(timer);
  }, [form.imageUrl]);

  const fetchProducts = async () => {
    try { const res = await API.get("/products"); setProducts(res.data); }
    catch { toast.error("Failed to load products"); }
  };
  const fetchOrders = async () => {
    try { const res = await API.get("/orders/all"); setOrders(res.data); }
    catch { toast.error("Failed to load orders"); }
  };

  const openAddForm = () => {
    setForm(EMPTY_FORM);
    setImgStatus("idle");
    setEditingProductId(null);
    setShowForm(true);
  };

  // ✅ NEW — pre-fills the form with an existing product's values
  const openEditForm = (product) => {
    setEditingProductId(product.id);
    setForm({
      name: product.name,
      description: product.description || "",
      price: String(product.price),
      stock: String(product.stock),
      category: product.category,
      imageUrl: product.imageUrl || "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setForm(EMPTY_FORM);
    setImgStatus("idle");
    setEditingProductId(null);
    setShowForm(false);
  };

  // ✅ NEW — direct file upload for product images
  const handleProductImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }

    setUploadingProductImage(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await API.post("/upload/product-image", formData);
      setForm((prev) => ({ ...prev, imageUrl: res.data.imageUrl }));
      toast.success("Image uploaded!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to upload image");
    } finally {
      setUploadingProductImage(false);
      if (productImgInputRef.current) productImgInputRef.current.value = "";
    }
  };

  // ✅ RENAMED from addProduct — now handles both add AND edit
  const saveProduct = async () => {
    if (!form.name || !form.price || !form.stock || !form.category) {
      toast.error("Please fill all required fields");
      return;
    }
    if (form.imageUrl.trim() && imgStatus !== "ok") {
      toast.error("That image path couldn't be found — please check it");
      return;
    }
    try {
      const payload = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock) };
      if (editingProductId) {
        await API.put(`/products/${editingProductId}`, payload);
        toast.success("Product updated");
      } else {
        await API.post("/products", payload);
        toast.success("Product added");
      }
      closeForm();
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save product");
    }
  };

  // ✅ NEW — admin manually moves order status
  const updateOrderStatus = async (orderId, status) => {
    try {
      await API.put(`/orders/status/${orderId}`, { status });
      toast.success(`Order #${orderId} → ${status}`);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update status");
    }
  };

  const askDeleteProduct = (p) => setConfirmAction({
    type: "deleteProduct", id: p.id,
    title: "Delete this product?",
    message: `"${p.name}" will be permanently removed from the store. This cannot be undone.`,
  });
  const askCancelOrder = (o) => setConfirmAction({
    type: "cancelOrder", id: o.id,
    title: "Cancel this order?",
    message: `Order #${o.id} for ${o.user?.name} will be marked as cancelled.`,
  });
  const askDeleteOrder = (o) => setConfirmAction({
    type: "deleteOrder", id: o.id,
    title: "Remove this order?",
    message: `Order #${o.id} will be permanently removed from history. This cannot be undone.`,
  });

  const runConfirmedAction = async () => {
    if (!confirmAction) return;
    setActionBusy(true);
    try {
      if (confirmAction.type === "deleteProduct") {
        await API.delete(`/products/${confirmAction.id}`);
        toast.success("Product deleted");
        fetchProducts();
      } else if (confirmAction.type === "cancelOrder") {
        await API.put(`/orders/cancel/${confirmAction.id}?reason=${encodeURIComponent("Cancelled by admin")}`);
        toast.success("Order cancelled");
        fetchOrders();
      } else if (confirmAction.type === "deleteOrder") {
        await API.delete(`/orders/delete/${confirmAction.id}`);
        toast.success("Order removed");
        setOrders((prev) => prev.filter((o) => o.id !== confirmAction.id));
      }
      setConfirmAction(null);
    } catch (err) {
      // ✅ NEW — the backend already blocks deleting a product that's referenced by
      // a cart or an order, but its message is generic. Show a clearer, specific
      // one for that case instead of whatever raw text the backend sent.
      if (confirmAction.type === "deleteProduct") {
        toast.error("This product is ordered by someone — please check, cancel, and delete the order to remove this product.");
      } else {
        toast.error(err.response?.data?.error || "Action failed");
      }
    } finally {
      setActionBusy(false);
    }
  };

  const totalRevenue = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const lowStockCount = products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD).length;

  // ✅ NEW — groups revenue by day for the chart, skipping cancelled orders
  const getChartData = () => {
    const grouped = {};
    orders.forEach((o) => {
      if (o.status === "CANCELLED") return;
      const date = new Date(o.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      grouped[date] = (grouped[date] || 0) + (o.totalAmount || 0);
    });
    return Object.entries(grouped).map(([date, revenue]) => ({ date, revenue: Number(revenue.toFixed(2)) }));
  };
  const chartData = getChartData();

  return (
    <div className="page-shell">

      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction?.title}
        message={confirmAction?.message}
        confirmLabel={confirmAction?.type === "cancelOrder" ? "Yes, cancel it" : "Yes, delete it"}
        cancelLabel="Go back"
        busy={actionBusy}
        onConfirm={runConfirmedAction}
        onClose={() => setConfirmAction(null)}
      />

      <div className="admin-head"><FiSettings size={22} /><h1>Admin dashboard</h1></div>

      <div className="admin-stats">
        <div className="stat-card stat-primary">
          <div className="stat-icon"><FiPackage size={20} /></div>
          <span className="stat-value">{products.length}</span>
          <span className="stat-label">Total products</span>
        </div>
        <div className="stat-card stat-accent">
          <div className="stat-icon"><FiShoppingCart size={20} /></div>
          <span className="stat-value">{orders.length}</span>
          <span className="stat-label">Total orders</span>
        </div>
        <div className="stat-card stat-success">
          <div className="stat-icon"><TbCurrencyRupee size={20} /></div>
          <span className="stat-value">₹{totalRevenue.toFixed(0)}</span>
          <span className="stat-label">Total revenue</span>
        </div>
        <div className="stat-card stat-lowstock">
          <div className="stat-icon"><FiAlertTriangle size={20} /></div>
          <span className="stat-value">{lowStockCount}</span>
          <span className="stat-label">Low stock (≤{LOW_STOCK_THRESHOLD})</span>
        </div>
      </div>


      <div className="chart-card">
        <h3 className="chart-title"><FiTrendingUp size={16} /> Revenue overview</h3>
        {chartData.length === 0 ? (
          <p className="chart-empty">No order data yet — this will fill in as orders come in.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.08)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "rgba(255,255,255,.55)" }} axisLine={{ stroke: "rgba(255,255,255,.15)" }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "rgba(255,255,255,.55)" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#0f1b2d", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, fontSize: 12 }}
                labelStyle={{ color: "#94a3b8" }}
                itemStyle={{ color: "#10b981", fontWeight: 700 }}
                formatter={(value) => [`₹${Number(value).toFixed(0)}`, "Revenue"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#revenueGradient)" dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="admin-tabs">
        <button onClick={() => setTab("products")} className={`admin-tab ${tab === "products" ? "is-active" : ""}`}>
          <FiPackage size={15} /> Products ({products.length})
        </button>
        <button onClick={() => setTab("orders")} className={`admin-tab ${tab === "orders" ? "is-active" : ""}`}>
          <FiShoppingCart size={15} /> Orders ({orders.length})
        </button>
      </div>

      {tab === "products" && (
        <div>
          <button onClick={showForm ? closeForm : openAddForm} className="btn btn-primary admin-add-btn">
            {showForm ? <FiX size={16} /> : <FiPlus size={16} />}
            {showForm ? "Cancel" : "Add product"}
          </button>

          {showForm && (
            <div className="form-card">
              <h3>{editingProductId ? "Edit product" : "Add new product"}</h3>
              <div className="form-grid">
                <div className="field">
                  <label className="field-label">Product name *</label>
                  <input className="field-input" placeholder="e.g. iPhone 15 Pro" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="field">
                  <label className="field-label">Price (₹) *</label>
                  <input className="field-input" placeholder="e.g. 89999" type="number" value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>
                <div className="field">
                  <label className="field-label">Stock *</label>
                  <input className="field-input" placeholder="e.g. 50" type="number" value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                </div>
                <div className="field">
                  <label className="field-label">Category *</label>
                  <select className="field-select" value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    <option value="">Select category</option>
                    {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="field field-full">
                  <label className="field-label">
                    Image path * — place the image inside <code className="inline-code">public/images/</code>, or upload one below
                  </label>
                  <input className="field-input" placeholder="e.g. /images/iphone15.jpg" value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />

                  <input
                    ref={productImgInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProductImageSelect}
                    className="hidden-file-input"
                  />
                  <button
                    type="button"
                    className="btn btn-outline btn-sm upload-img-btn"
                    onClick={() => productImgInputRef.current?.click()}
                    disabled={uploadingProductImage}
                  >
                    <FiUpload size={13} /> {uploadingProductImage ? "Uploading…" : "Or upload a photo instead"}
                  </button>

                  {form.imageUrl && (
                    <div className="preview-box">
                      {imgStatus === "checking" && <p className="preview-checking">Checking image…</p>}
                      {imgStatus === "ok" && (
                        <>
                          <img src={form.imageUrl} alt="preview" />
                          <p className="preview-text"><FiCheckCircle size={13} /> Image found</p>
                        </>
                      )}
                      {imgStatus === "error" && (
                        <p className="preview-error">
                          <FiAlertTriangle size={13} /> Image not found — check the path and file extension
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="field field-full">
                  <label className="field-label">Description</label>
                  <textarea className="field-textarea" placeholder="Enter product description…" rows={3}
                    value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>
              <div className="form-btns">
                <button onClick={saveProduct} className="btn btn-primary">
                  {editingProductId ? "Update product" : "Save product"}
                </button>
                <button onClick={closeForm} className="btn btn-outline">Cancel</button>
              </div>
            </div>
          )}

          <div className="table-card">
            <div className="table-header products-grid-cols">
              <span>Image</span><span>Product</span><span>Category</span><span>Price</span><span>Stock</span><span>Action</span>
            </div>
            {products.length === 0 ? (
              <div className="table-empty">No products yet — add your first one above.</div>
            ) : (
              products.map((p) => (
                <div key={p.id} className="table-row products-grid-cols">
                  <div className="table-img">
                    {p.imageUrl
                      ? <img src={p.imageUrl} alt={p.name} onError={(e) => { e.target.style.display = "none"; }} />
                      : <FiPackage size={18} color="var(--muted-soft)" />}
                  </div>
                  <span className="table-product-name">{p.name}</span>
                  <span className="tag" data-color={getCategoryColor(p.category)}>{p.category}</span>
                  <span className="price-tag">₹{p.price}</span>
                  <span className={`stock-badge ${p.stock === 0 ? "out" : p.stock <= LOW_STOCK_THRESHOLD ? "low" : "in"}`}>
                    {p.stock === 0 ? "Out of stock" : p.stock <= LOW_STOCK_THRESHOLD ? `Low: ${p.stock} left` : `${p.stock} left`}
                  </span>
                  <div className="table-actions">
                    <button onClick={() => openEditForm(p)} className="btn btn-outline btn-sm" title="Edit product">
                      <FiEdit2 size={14} />
                    </button>
                    <button onClick={() => askDeleteProduct(p)} className="btn btn-danger btn-sm" title="Delete product">
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="table-card">
          <div className="table-header orders-grid-cols">
            <span>Image</span><span>Product</span><span>Order ID</span><span>Customer</span><span>Amount</span><span>Status</span><span>Action</span>
          </div>
          {orders.length === 0 ? (
            <div className="table-empty">No orders yet.</div>
          ) : (
            orders.map((o) => {
              const items = o.orderItems || [];
              const firstItem = items[0];
              const extraCount = items.length - 1;
              return (
                <div key={o.id} className="table-row orders-grid-cols">
                  <div className="table-img">
                    {firstItem?.product?.imageUrl
                      ? <img src={firstItem.product.imageUrl} alt={firstItem.product.name} onError={(e) => { e.target.style.display = "none"; }} />
                      : <FiPackage size={18} color="var(--muted-soft)" />}
                  </div>
                  <div>
                    <span className="table-product-name">{firstItem?.product?.name || "—"}</span>
                    {extraCount > 0 && <p className="table-extra-note">+{extraCount} more item{extraCount !== 1 ? "s" : ""}</p>}
                  </div>
                  <span className="table-product-name">#{o.id}</span>
                  <div>
                    <p className="table-customer-name">{o.user?.name}</p>
                    <p className="table-customer-email">{o.user?.email}</p>
                  </div>
                  <span className="price-tag">₹{o.totalAmount}</span>

                  {o.status === "CANCELLED" ? (
                    <span className={`status-pill ${STATUS_CLASS[o.status]}`}>{o.status}</span>
                  ) : (
                    <select
                      className="status-select"
                      value={o.status}
                      onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="DELIVERED">DELIVERED</option>
                    </select>
                  )}

                  <div className="table-actions">
                    {o.status !== "CANCELLED" && o.status !== "DELIVERED" && (
                      <button onClick={() => askCancelOrder(o)} className="btn btn-danger btn-sm" title="Cancel order">
                        <FiSlash size={13} />
                      </button>
                    )}
                    {o.status === "CANCELLED" && (
                      <button onClick={() => askDeleteOrder(o)} className="btn btn-outline btn-sm" title="Remove order">
                        <FiTrash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
