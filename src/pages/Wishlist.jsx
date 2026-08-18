import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import toast from "react-hot-toast";
import { FiHeart, FiShoppingCart, FiTrash2 } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { getCategoryColor, getCategoryImage } from "../data/categories";
import "./Wishlist.scss";

const Wishlist = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token && !user) { navigate("/login"); return; }
    fetchWishlist();
  }, [user]);

  const fetchWishlist = async () => {
    try {
      const res = await API.get("/wishlist");
      const raw = res.data;

      // 🛡️ Extracts product list from any Spring Boot payload structure
      let list = [];
      if (Array.isArray(raw)) {
        list = raw;
      } else if (raw && typeof raw === "object") {
        list = raw.products || raw.wishlistItems || raw.items || raw.data || [];
      }
      setItems(Array.isArray(list) ? list : []);
    } catch {
      toast.error("Failed to load wishlist");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (productId) => {
    if (!productId) return;
    try {
      await API.delete(`/wishlist/remove/${productId}`);
      toast.success("Removed from wishlist");
      setItems((prev) => prev.filter((i) => (i?.product?.id || i?.id) !== productId));
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to remove item");
    }
  };

  const addToCart = async (productId) => {
    if (!productId) return;
    try {
      await API.post("/cart/add", { productId, quantity: 1 });
      toast.success("Added to cart");
    } catch {
      toast.error("Failed to add to cart");
    }
  };

  if (loading) return <div className="state-block"><p>Loading wishlist…</p></div>;

  return (
    <div className="page-shell">
      <div className="wishlist-head">
        <span className="eyebrow">Saved for later</span>
        <h1>My wishlist</h1>
      </div>

      {!items.length ? (
        <div className="state-block">
          <div className="state-icon"><FiHeart size={24} /></div>
          <h3>Your wishlist is empty</h3>
          <p>Tap the heart on any product to save it here.</p>
          <Link to="/products" className="btn btn-primary u-mt-md">Browse products</Link>
        </div>
      ) : (
        <div className="wishlist-grid">
          {items.map((item, idx) => {
            const product = item?.product || item || {};
            const productId = product?.id || item?.id || idx;
            const category = product?.category || "General";

            return (
              <div key={`wl-${productId}-${idx}`} className="wishlist-card">
                <div className="wishlist-img">
                  {product?.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product?.name || "Product"}
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  ) : (
                    <img src={getCategoryImage(category)} alt={category} />
                  )}
                  <button className="wishlist-remove" onClick={() => removeItem(productId)}>
                    <FiTrash2 size={14} />
                  </button>
                </div>
                <div className="wishlist-info">
                  <span className="tag" data-color={getCategoryColor(category)}>{category}</span>
                  <h3>{product?.name || "Product"}</h3>
                  <div className="wishlist-bottom">
                    <span className="price-tag">₹{product?.price || 0}</span>
                    <div className="wishlist-actions">
                      <Link to={`/products/${productId}`} className="btn btn-outline btn-sm">View</Link>
                      <button onClick={() => addToCart(productId)} className="btn btn-primary btn-sm">
                        <FiShoppingCart size={14} /> Add
                      </button>
                    </div>
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

export default Wishlist;