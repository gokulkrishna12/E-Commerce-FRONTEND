import { Link } from "react-router-dom";
import { FiGithub, FiMail, FiPhone, FiMapPin } from "react-icons/fi";
import { CATEGORIES } from "../data/categories";
import "./Footer.scss";

const QUICK_LINKS = [
  { label: "Home", to: "/" },
  { label: "Products", to: "/products" },
  { label: "Cart", to: "/cart" },
  { label: "My Orders", to: "/orders" },
];

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="footer-logo">
            <span className="footer-logo-mark">GK</span>
            <span className="footer-logo-text">GK's ShopEase</span>
          </div>
          <p className="footer-tagline">
            A premium destination for everyday goods. Shop smart, live better.
          </p>
          <div className="footer-socials">
            {[FiGithub, FiMail, FiPhone].map((Icon, i) => (
              <a key={i} href="#" className="footer-social" aria-label="social link">
                <Icon size={15} />
              </a>
            ))}
          </div>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-title">Quick Links</h4>
          {QUICK_LINKS.map((link, i) => (
            <Link key={i} to={link.to} className="footer-link" onClick={() => window.scrollTo(0, 0)}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="footer-col">
          <h4 className="footer-col-title">Categories</h4>
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              to={`/products?category=${encodeURIComponent(cat.name)}`}
              className="footer-link"
              onClick={() => window.scrollTo(0, 0)}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        <div className="footer-col">
          <h4 className="footer-col-title">Contact</h4>
          <div className="footer-contact">
            <FiMail size={14} />
            <span>support@gkshopease.com</span>
          </div>
          <div className="footer-contact">
            <FiPhone size={14} />
            <span>+91 98765 43210</span>
          </div>
          <div className="footer-contact">
            <FiMapPin size={14} />
            <span>Chennai, Tamil Nadu</span>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 GK's ShopEase. All rights reserved.</p>
        <p className="footer-credit">
          Developed by <span>GokulKrishna</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
