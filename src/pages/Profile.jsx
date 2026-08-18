import { useState, useEffect } from "react";
import API from "../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FiUser, FiLock, FiSave } from "react-icons/fi";
import "./Profile.scss";

const Profile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Customer");
  const [savingName, setSavingName] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "" });
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await API.get("/users/profile");
      const data = res.data || {};
      setName(data.name || data.fullName || user?.name || user?.fullName || "");
      setEmail(data.email || user?.email || "");
      // 🛡️ Fixed: Checks for both "ROLE_ADMIN" and "ADMIN"
      setRole(data.role === "ROLE_ADMIN" || data.role === "ADMIN" || user?.role === "ROLE_ADMIN" || user?.role === "ADMIN" ? "Admin" : "Customer");
      updateUser(data);
    } catch {
      if (user) {
        setName(user.name || user.fullName || "");
        setEmail(user.email || "");
        // 🛡️ Fixed: Checks for both "ROLE_ADMIN" and "ADMIN"
        setRole(user.role === "ROLE_ADMIN" || user.role === "ADMIN" ? "Admin" : "Customer");
      }
    }
  };

  const saveName = async () => {
    if (name.trim().length < 3) {
      toast.error("Name must be at least 3 characters");
      return;
    }
    setSavingName(true);
    try {
      const res = await API.put("/users/profile", { name });
      updateUser({ name: res.data?.name || name, fullName: res.data?.name || name });
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update profile");
    } finally {
      setSavingName(false);
    }
  };

  const savePassword = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword) {
      toast.error("Please fill both password fields");
      return;
    }
    if (pwForm.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    setSavingPw(true);
    try {
      await API.put("/users/password", pwForm);
      toast.success("Password updated!");
      setPwForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update password");
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="page-shell profile-page">
      <div className="profile-head">
        <span className="eyebrow">Account</span>
        <h1>My profile</h1>
      </div>

      <div className="profile-grid">
        <div className="profile-card">
          <div className="profile-card-head">
            <FiUser size={18} />
            <h3>Profile details</h3>
          </div>

          <div className="field">
            <label className="field-label">Full name</label>
            <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter full name" />
          </div>

          <div className="field">
            <label className="field-label">Email</label>
            <input className="field-input" value={email} disabled />
            <span className="field-hint-static">Email can't be changed</span>
          </div>

          <div className="field">
            <label className="field-label">Account type</label>
            <input className="field-input" value={role} disabled />
          </div>

          <button onClick={saveName} className="btn btn-primary" disabled={savingName}>
            <FiSave size={15} /> {savingName ? "Saving…" : "Save changes"}
          </button>
        </div>

        <div className="profile-card">
          <div className="profile-card-head">
            <FiLock size={18} />
            <h3>Change password</h3>
          </div>

          <div className="field">
            <label className="field-label">Current password</label>
            <input className="field-input" type="password" placeholder="Enter current password"
              value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
          </div>

          <div className="field">
            <label className="field-label">New password</label>
            <input className="field-input" type="password" placeholder="Min 8 characters"
              value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} />
          </div>

          <button onClick={savePassword} className="btn btn-primary" disabled={savingPw}>
            <FiLock size={15} /> {savingPw ? "Updating…" : "Update password"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;