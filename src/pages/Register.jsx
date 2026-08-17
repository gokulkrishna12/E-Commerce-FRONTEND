import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { FiEye, FiEyeOff, FiCheckCircle, FiAlertTriangle, FiCheck, FiX, FiArrowRight } from "react-icons/fi";
import "./Auth.scss";

const Register = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "ROLE_USER" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();

  const validators = {
    name: {
      test: (v) => /^[a-zA-Z\s]{3,}$/.test(v.trim()),
      message: "Min 3 characters, letters only",
    },
    email: {
      test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      message: "Enter a valid email address",
    },
    password: {
      test: (v) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(v),
      message: "Min 8 chars, upper, lower, number, symbol",
    },
  };

  const passwordRules = [
    { label: "At least 8 characters", test: (v) => v.length >= 8 },
    { label: "One uppercase letter (A–Z)", test: (v) => /[A-Z]/.test(v) },
    { label: "One lowercase letter (a–z)", test: (v) => /[a-z]/.test(v) },
    { label: "One number (0–9)", test: (v) => /\d/.test(v) },
    { label: "One special character (@$!%*?&)", test: (v) => /[@$!%*?&]/.test(v) },
  ];

  const isValid = (field) => touched[field] && validators[field]?.test(form[field]);
  const isInvalid = (field) => touched[field] && !validators[field]?.test(form[field]);
  const allValid = Object.keys(validators).every((k) => validators[k].test(form[k]));

  const inputClass = (field) =>
    `field-input ${isInvalid(field) ? "is-invalid" : isValid(field) ? "is-valid" : ""}`;

  const handleSubmit = async () => {
    setTouched({ name: true, email: true, password: true });
    if (!allValid) {
      toast.error("Please fix the errors before submitting");
      return;
    }
    setLoading(true);
    try {
      const res = await API.post("/auth/register", form);
     login(
        { name: res.data.name, email: res.data.email, role: res.data.role },
        res.data.token,
        res.data.refreshToken
      );
      toast.success(`Account created — welcome, ${res.data.name}`);
      navigate("/products");
    } catch {
      toast.error("Registration failed. Email may already exist.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-head">
          <span className="eyebrow">Join ShopEase</span>
          <h2>Create your account</h2>
          <p>It takes less than a minute — and it's free</p>
        </div>

        <div className="auth-form">
          <div className="field">
            <label className="field-label">Full name</label>
            <input
              className={inputClass("name")}
              type="text"
              placeholder="Enter your full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              onBlur={() => setTouched({ ...touched, name: true })}
            />
            {isInvalid("name") && (
              <span className="field-hint error"><FiAlertTriangle size={13} /> {validators.name.message}</span>
            )}
            {isValid("name") && (
              <span className="field-hint success"><FiCheckCircle size={13} /> Looks good</span>
            )}
          </div>

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
              <span className="field-hint error"><FiAlertTriangle size={13} /> {validators.email.message}</span>
            )}
            {isValid("email") && (
              <span className="field-hint success"><FiCheckCircle size={13} /> Looks good</span>
            )}
          </div>

          <div className="field">
            <label className="field-label">Password</label>
            <div className="password-row">
              <input
                className={inputClass("password")}
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onBlur={() => setTouched({ ...touched, password: true })}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="eye-btn">
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>

            {form.password && (
              <div className="rules-box">
                {passwordRules.map((rule, i) => {
                  const ok = rule.test(form.password);
                  return (
                    <div key={i} className={`rule-row ${ok ? "ok" : "no"}`}>
                      {ok ? <FiCheck size={14} /> : <FiX size={14} />}
                      <span>{rule.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="field">
            <label className="field-label">Account type</label>
            <select
              className="field-select"
              value={form.role}
              onChange={(e) => {
                if (e.target.value === "ROLE_ADMIN") {
                  // The Sarcastic Trap!
                  toast("Nice try! 😎 You cannot access Admin because I am the boss here. Only I have the power to promote you!", {
                    icon: '🛑',
                    duration: 5000,
                    style: { borderRadius: '10px', background: '#333', color: '#fff' }
                  });
                  // Force the dropdown back to Customer instantly
                  setForm({ ...form, role: "ROLE_USER" });
                } else {
                  setForm({ ...form, role: e.target.value });
                }
              }}
            >
              <option value="ROLE_USER">Customer</option>
              <option value="ROLE_ADMIN">Admin</option>
            </select>
          </div>

          <button onClick={handleSubmit} className="btn btn-primary btn-block" disabled={loading || !allValid}>
            {loading ? "Creating…" : <>Create account <FiArrowRight size={16} /></>}
          </button>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
