import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../api/axios";
import toast from "react-hot-toast";
import {
  FiCreditCard, FiLock, FiCheckCircle, FiArrowLeft, FiShield,
  FiMapPin, FiTruck, FiSmartphone, FiArrowRight,
} from "react-icons/fi";
import "./Payment.scss";

const Payment = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const {
    mode = "cart",
    productId,
    quantity,
    totalAmount = 0,
    shippingAddress: initialAddress = "",
    cartItems = [],
  } = state || {};

  useEffect(() => {
    if (!state) navigate("/cart");
  }, []);

  const [address, setAddress] = useState(initialAddress);
  const [step, setStep] = useState("select"); // select | card-form | processing | success
  const [method, setMethod] = useState(null);
  const [error, setError] = useState("");
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" });

  const formatNumber = (v) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const formatExpiry = (v) => {
    const c = v.replace(/\D/g, "").slice(0, 4);
    return c.length >= 2 ? `${c.slice(0, 2)}/${c.slice(2)}` : c;
  };

  const placeRealOrder = async () => {
    if (mode === "buy-now") {
      await API.post("/orders/buy-now", { productId, quantity, shippingAddress: address });
    } else {
      await API.post("/orders/place", { shippingAddress: address });
    }
  };

  const handleUpiClick = () => {
    toast(
      "😅 Real UPI needs your actual phone number for OTP — Razorpay wanted way too much realism! Pick Card or Cash on Delivery instead 👇",
      { duration: 5000, icon: "🙈" }
    );
  };

  const goToCardForm = () => {
    if (!address.trim()) { setError("Please enter a shipping address first"); return; }
    setError("");
    setMethod("card");
    setStep("card-form");
  };

  const validateCard = () => {
    if (card.number.replace(/\s/g, "").length !== 16) return "Enter a valid 16-digit card number";
    if (!card.name.trim()) return "Enter the name on the card";
    if (card.expiry.length !== 5) return "Enter a valid expiry (MM/YY)";
    if (card.cvv.length !== 3) return "Enter a valid 3-digit CVV";
    return null;
  };

  const payWithCard = async () => {
    const err = validateCard();
    if (err) { setError(err); return; }
    setError("");
    setStep("processing");
    try {
      await new Promise((res) => setTimeout(res, 1800));
      await placeRealOrder();
      setStep("success");
      setTimeout(() => { navigate("/orders"); toast.success("Order placed successfully"); }, 1600);
    } catch (err) {
      setStep("card-form");
      toast.error(err.response?.data?.error || "Payment failed — please try again");
    }
  };

  const payWithCod = async () => {
    if (!address.trim()) { setError("Please enter a shipping address first"); return; }
    setError("");
    setMethod("cod");
    setStep("processing");
    try {
      await new Promise((res) => setTimeout(res, 1000));
      await placeRealOrder();
      setStep("success");
      setTimeout(() => { navigate("/orders"); toast.success("Order placed — pay cash on delivery!"); }, 1600);
    } catch (err) {
      setStep("select");
      toast.error(err.response?.data?.error || "Failed to place order");
    }
  };

  if (step === "processing") {
    return (
      <div className="pay-page">
        <div className="pay-status-card">
          <div className="pay-spinner" />
          <h2>{method === "cod" ? "Confirming your order…" : "Processing payment…"}</h2>
          <p>Please don't close this page</p>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="pay-page">
        <div className="pay-status-card pay-success">
          <div className="pay-success-icon"><FiCheckCircle size={48} /></div>
          <h2>{method === "cod" ? "Order confirmed!" : "Payment successful"}</h2>
          <p className="pay-success-amount">₹{totalAmount.toFixed(2)}</p>
          <p>
            {method === "cod" ? "Keep cash ready — pay when your order arrives." : "Your order has been placed."} Redirecting to your orders…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pay-page">
      <button className="btn btn-ghost pay-back" onClick={() => (step === "card-form" ? setStep("select") : navigate(-1))}>
        <FiArrowLeft size={16} /> {step === "card-form" ? "Back to payment methods" : "Back"}
      </button>

      <div className="pay-layout">
        <div className="pay-card">

          {step === "select" && (
            <>
              <div className="pay-card-head"><FiShield size={20} /><h2>Choose payment method</h2></div>
              <div className="pay-secure-row"><FiLock size={12} /> This is a demo checkout — no real charges</div>

              {error && <div className="pay-error"><FiShield size={13} /> {error}</div>}

              <div className="field">
                <label className="field-label"><FiMapPin size={13} /> Shipping address</label>
                <textarea className="field-textarea" placeholder="Enter your full shipping address…" rows={3}
                  value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>

              <div className="method-list">
                <button className="method-option" onClick={goToCardForm}>
                  <span className="method-icon method-icon-card"><FiCreditCard size={20} /></span>
                  <span className="method-text"><strong>Credit / Debit Card</strong><span>Pay securely with your card</span></span>
                  <FiArrowRight size={16} className="method-arrow" />
                </button>

                <button className="method-option" onClick={handleUpiClick}>
                  <span className="method-icon method-icon-upi"><FiSmartphone size={20} /></span>
                  <span className="method-text"><strong>UPI</strong><span>Google Pay, PhonePe, Paytm…</span></span>
                  <FiArrowRight size={16} className="method-arrow" />
                </button>

                <button className="method-option" onClick={payWithCod}>
                  <span className="method-icon method-icon-cod"><FiTruck size={20} /></span>
                  <span className="method-text"><strong>Cash on Delivery</strong><span>Pay when your order arrives</span></span>
                  <FiArrowRight size={16} className="method-arrow" />
                </button>
              </div>
            </>
          )}

          {step === "card-form" && (
            <>
              <div className="pay-card-head"><FiCreditCard size={20} /><h2>Card details</h2></div>
              <div className="pay-secure-row"><FiLock size={12} /> Demo card — no real charge will be made</div>

              <div className="bank-card">
                <div className="bank-card-top">
                  <span className="bank-card-brand">GK's Bank</span>
                  <div className="bank-card-chip" />
                </div>
                <div className="bank-card-number">{card.number || "•••• •••• •••• ••••"}</div>
                <div className="bank-card-bottom">
                  <div><p>Card holder</p><span>{card.name || "YOUR NAME"}</span></div>
                  <div><p>Expires</p><span>{card.expiry || "MM/YY"}</span></div>
                </div>
              </div>

              {error && <div className="pay-error"><FiShield size={13} /> {error}</div>}

              <div className="field">
                <label className="field-label">Card number</label>
                <input className="field-input" placeholder="1234 5678 9012 3456" maxLength={19}
                  value={card.number} onChange={(e) => setCard({ ...card, number: formatNumber(e.target.value) })} />
              </div>
              <div className="field">
                <label className="field-label">Name on card</label>
                <input className="field-input" placeholder="Full name"
                  value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} />
              </div>
              <div className="pay-row">
                <div className="field">
                  <label className="field-label">Expiry</label>
                  <input className="field-input" placeholder="MM/YY" maxLength={5}
                    value={card.expiry} onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })} />
                </div>
                <div className="field">
                  <label className="field-label">CVV</label>
                  <input className="field-input" placeholder="123" type="password" maxLength={3}
                    value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "").slice(0, 3) })} />
                </div>
              </div>

              <div className="pay-test-hint">
                <p>Demo mode — any 16-digit number, name, future date and CVV will work.</p>
              </div>

              <button className="btn btn-primary btn-block pay-submit" onClick={payWithCard}>
                <FiLock size={15} /> Pay ₹{totalAmount.toFixed(2)}
              </button>
            </>
          )}
        </div>

        <div className="pay-summary">
          <h3>Order summary</h3>
          <div className="pay-summary-items">
            {cartItems.map((item, i) => (
              <div key={i} className="pay-summary-item">
                <span>{item?.product?.name}</span>
                <span>×{item?.quantity}</span>
                <span>₹{(item?.product?.price * item?.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="pay-summary-divider" />
          <div className="pay-summary-row"><span>Subtotal</span><span>₹{totalAmount.toFixed(2)}</span></div>
          <div className="pay-summary-row"><span>Delivery</span><span className="pay-free">Free</span></div>
          <div className="pay-summary-row pay-summary-total"><span>Total</span><span>₹{totalAmount.toFixed(2)}</span></div>
        </div>
      </div>
    </div>
  );
};

export default Payment;