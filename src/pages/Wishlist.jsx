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
    if (!user) { navigate("/login"); return; }
    fetchWishlist();
  }, [user]);

  const fetchWishlist = async () => {
    try {
      const res = await API.get("/wishlist");
      setItems(res.data);
    } catch {
      toast.error("Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (productId) => {
    try {
      await API.delete(`/wishlist/remove/${productId}`);
      toast.success("Removed from wishlist");
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to remove item");
    }
  };

  const addToCart = async (productId) => {
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

      {items.length === 0 ? (
        <div className="state-block">
          <div className="state-icon"><FiHeart size={24} /></div>
          <h3>Your wishlist is empty</h3>
          <p>Tap the heart on any product to save it here.</p>
          <Link to="/products" className="btn btn-primary u-mt-md">Browse products</Link>
        </div>
      ) : (
        <div className="wishlist-grid">
          {items.map((item) => (
            <div key={item.id} className="wishlist-card">
              <div className="wishlist-img">
                {item.product.imageUrl
                  ? <img src={item.product.imageUrl} alt={item.product.name} onError={(e)=>{e.target.style.display="none";}} />
                  : <img src={getCategoryImage(item.product.category)} alt={item.product.category} />
                }
                <button className="wishlist-remove" onClick={() => removeItem(item.product.id)}>
                  <FiTrash2 size={14} />
                </button>
              </div>
              <div className="wishlist-info">
                <span className="tag" data-color={getCategoryColor(item.product.category)}>{item.product.category}</span>
                <h3>{item.product.name}</h3>
                <div className="wishlist-bottom">
                  <span className="price-tag">₹{item.product.price}</span>
                  <div className="wishlist-actions">
                    <Link to={`/products/${item.product.id}`} className="btn btn-outline btn-sm">View</Link>
                    <button onClick={() => addToCart(item.product.id)} className="btn btn-primary btn-sm">
                      <FiShoppingCart size={14} /> Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;