import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import toast from "react-hot-toast";
import { FiTrash2, FiShoppingCart, FiMapPin, FiArrowRight } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import "./Cart.scss";

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    fetchCart();
  }, [user]);

  const fetchCart = async () => {
    try {
      const res = await API.get("/cart");
      setCart(res.data);
    } catch {
      toast.error("Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId) => {
    try {
      await API.delete(`/cart/remove/${itemId}`);
      toast.success("Removed from cart");
      fetchCart();
    } catch {
      toast.error("Failed to remove item");
    }
  };

  const cartItems = cart?.cartItems || [];
  const total = cartItems.reduce(
    (sum, item) => sum + (item?.product?.price ?? 0) * (item?.quantity ?? 0), 0
  );

  const goToPayment = () => {
    if (!address.trim()) {
      toast.error("Please enter a shipping address");
      return;
    }
    navigate("/payment", {
      state: { totalAmount: total, shippingAddress: address, cartItems },
    });
  };

  if (loading) return <div className="state-block"><p>Loading cart…</p></div>;

  return (
    <div className="page-shell">
      <div className="cart-head">
        <span className="eyebrow">Your bag</span>
        <h1>My cart</h1>
      </div>

      {!cartItems.length ? (
        <div className="state-block">
          <div className="state-icon"><FiShoppingCart size={24} /></div>
          <h3>Your cart is empty</h3>
          <p>Add a few things you like and they'll show up here.</p>
          <button onClick={() => navigate("/products")} className="btn btn-primary u-mt-md">
            Start shopping
          </button>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {cartItems.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-img">
                  {item.product.imageUrl ? (
                    <img src={item.product.imageUrl} alt={item.product.name} />
                  ) : (
                    <FiShoppingCart size={26} color="var(--muted-soft)" />
                  )}
                </div>
                <div className="cart-item-info">
                  <h3>{item.product.name}</h3>
                  <p className="price-tag cart-item-price">₹{item.product.price}</p>
                  <p className="cart-item-qty">Quantity: {item.quantity}</p>
                </div>
                <div className="cart-item-right">
                  <p className="price-tag cart-item-total">
                    ₹{(item.product.price * item.quantity).toFixed(2)}
                  </p>
                  <button onClick={() => removeItem(item.id)} className="btn btn-danger btn-sm cart-remove">
                    <FiTrash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h2>Order summary</h2>
            <div className="summary-row">
              <span>Items ({cartItems.length})</span>
              <span className="price-tag">₹{total.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Delivery</span>
              <span className="summary-free">Free</span>
            </div>
            <div className="summary-divider" />
            <div className="summary-row summary-total">
              <span>Total</span>
              <span className="price-tag">₹{total.toFixed(2)}</span>
            </div>

            <div className="field u-mt-sm">
              <label className="field-label"><FiMapPin size={13} /> Shipping address</label>
              <textarea
                className="field-textarea"
                placeholder="Enter your full shipping address…"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
              />
            </div>

            <button onClick={goToPayment} className="btn btn-primary btn-block u-mt-md">
              Proceed to payment <FiArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;