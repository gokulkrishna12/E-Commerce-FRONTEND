import { useState } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiShoppingCart, FiUser, FiLogOut, FiPackage, FiGrid, FiMenu, FiX, FiHeart } from "react-icons/fi";
import { getCategoryColor, CATEGORY_HEX } from "../data/categories";
import "./Navbar.scss";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setMenuOpen(false);
  };

  const linkClass = ({ isActive }) => `nav-link ${isActive ? "active" : ""}`;

  const params = new URLSearchParams(location.search);
  const activeCategoryName = location.pathname === "/products" ? params.get("category") : null;
  const activeCategoryHex = activeCategoryName ? CATEGORY_HEX[getCategoryColor(activeCategoryName)] : null;
  const productsLinkStyle = activeCategoryHex ? { "--nav-accent": activeCategoryHex } : undefined;

  // 🛡️ Checks both "ADMIN", "ROLE_ADMIN", and case-insensitive variations
  const isAdmin =
    user?.role === "ROLE_ADMIN" ||
    user?.role === "ADMIN" ||
    String(user?.role || "").toUpperCase().includes("ADMIN");

  const displayName = user?.name || user?.fullName || user?.email?.split("@")[0] || "Account";

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="nav-logo" onClick={() => setMenuOpen(false)}>
          <span className="nav-logo-mark">GK</span>
          <span className="nav-logo-text">GK's <em>ShopEase</em></span>
        </Link>

        <button className="nav-toggle" onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu">
          {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>

        <nav className={`nav-links ${menuOpen ? "is-open" : ""}`}>
          <NavLink to="/products" className={linkClass} style={productsLinkStyle} onClick={() => setMenuOpen(false)}>
            Products
          </NavLink>

          {user ? (
            <>
              <NavLink to="/wishlist" className={linkClass} onClick={() => setMenuOpen(false)}>
                <FiHeart size={16} /> Wishlist
              </NavLink>
              <NavLink to="/cart" className={linkClass} onClick={() => setMenuOpen(false)}>
                <FiShoppingCart size={16} /> Cart
              </NavLink>
              <NavLink to="/orders" className={linkClass} onClick={() => setMenuOpen(false)}>
                <FiPackage size={16} /> Orders
              </NavLink>

              {isAdmin && (
                <NavLink to="/admin" className={linkClass} onClick={() => setMenuOpen(false)}>
                  <FiGrid size={16} /> Dashboard
                </NavLink>
              )}

              <Link to="/profile" className="nav-user" onClick={() => setMenuOpen(false)}>
                <FiUser size={14} /><span>{displayName}</span>
              </Link>

              <button onClick={handleLogout} className="nav-logout">
                <FiLogOut size={15} /> Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass} onClick={() => setMenuOpen(false)}>Login</NavLink>
              <Link to="/register" className="nav-cta" onClick={() => setMenuOpen(false)}>Get Started</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;