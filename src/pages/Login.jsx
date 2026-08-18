import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { FiEye, FiEyeOff, FiCheckCircle, FiAlertTriangle, FiLogIn } from "react-icons/fi";
import "./Auth.scss";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();

  const validators = {
    email: {
      test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      message: "Enter a valid email address",
    },
    password: {
      test: (v) => v.length >= 6,
      message: "Password must be at least 6 characters",
    },
  };

  const isValid = (field) => touched[field] && validators[field]?.test(form[field]);
  const isInvalid = (field) => touched[field] && !validators[field]?.test(form[field]);
  const allValid = Object.keys(validators).every((k) => validators[k].test(form[k]));

  const inputClass = (field) =>
    `field-input ${isInvalid(field) ? "is-invalid" : isValid(field) ? "is-valid" : ""}`;

  const handleSubmit = async () => {
    setTouched({ email: true, password: true });
    if (!allValid) {
      toast.error("Please fix the errors below");
      return;
    }
    setLoading(true);
    try {
      const res = await API.post("/auth/login", form);
      const data = res.data || {};
      
      // 🛡️ Search across all token property formats
      const token =
        data.token ||
        data.jwt ||
        data.accessToken ||
        data.jwtToken ||
        data.access_token ||
        data.data?.token ||
        data.data?.accessToken;

      const refreshToken = data.refreshToken || data.data?.refreshToken || "";

      const rawUser = data.user || data.data?.user || data;

      const rawRole =
        rawUser.role ||
        data.role ||
        (Array.isArray(rawUser.roles) ? rawUser.roles[0] : null) ||
        (Array.isArray(data.roles) ? data.roles[0] : "") ||
        "";

      const isAdmin = String(rawRole).toUpperCase().includes("ADMIN");
      const resolvedRole = isAdmin ? "ROLE_ADMIN" : "ROLE_CUSTOMER";

      const resolvedName =
        rawUser.name ||
        rawUser.fullName ||
        data.name ||
        data.fullName ||
        form.email.split("@")[0];

      const userData = {
        id: rawUser.id || data.id,
        name: resolvedName,
        fullName: resolvedName,
        email: rawUser.email || data.email || form.email,
        role: resolvedRole,
      };

      login(userData, token, refreshToken);
      toast.success(`Welcome back, ${resolvedName}!`);

      if (isAdmin) {
        navigate("/admin");
      } else {
        navigate("/products");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-head">
          <span className="eyebrow">Sign in</span>
          <h2>Welcome back</h2>
          <p>Log in to your ShopEase account</p>
        </div>

        <div className="auth-form">
          <div className="field">
            <label className="field-label">Email</label>
            <input
              className={inputClass("email")}
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              onBlur={() => setTouched({ ...touched, email: true })}
            />
            {isInvalid("email") && (
              <span className="field-hint error">
                <FiAlertTriangle size={13} /> {validators.email.message}
              </span>
            )}
            {isValid("email") && (
              <span className="field-hint success">
                <FiCheckCircle size={13} /> Looks good
              </span>
            )}
          </div>

          <div className="field">
            <label className="field-label">Password</label>
            <div className="password-row">
              <input
                className={inputClass("password")}
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onBlur={() => setTouched({ ...touched, password: true })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="eye-btn"
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
            {isInvalid("password") && (
              <span className="field-hint error">
                <FiAlertTriangle size={13} /> {validators.password.message}
              </span>
            )}
            {isValid("password") && (
              <span className="field-hint success">
                <FiCheckCircle size={13} /> Looks good
              </span>
            )}
          </div>

          <button
            onClick={handleSubmit}
            className="btn btn-primary btn-block"
            disabled={loading || !allValid}
          >
            {loading ? "Logging in…" : <>Login <FiLogIn size={16} /></>}
          </button>

          <p className="auth-switch">
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;