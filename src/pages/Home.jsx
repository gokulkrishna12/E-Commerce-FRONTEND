import { Link } from "react-router-dom";
import { FiArrowRight, FiTruck, FiShield, FiRefreshCw, FiHeadphones } from "react-icons/fi";
import { CATEGORIES, getCategoryImage } from "../data/categories";
import "./Home.scss";

const FEATURES = [
  { icon: FiTruck, title: "Free delivery", desc: "On every order above ₹500", color: "blue" },
  { icon: FiShield, title: "Secure payment", desc: "Encrypted, verified checkout", color: "green" },
  { icon: FiRefreshCw, title: "Easy returns", desc: "30-day return window", color: "violet" },
  { icon: FiHeadphones, title: "Real support", desc: "Here whenever you need us", color: "coral" },
];

const Home = () => {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">ShopEase — Since 2026</span>
          <h1 className="hero-title">
            Everyday goods, <em>picked properly.</em>
          </h1>
          <p className="hero-sub">
            Thousands of products, honest prices, and delivery that actually shows up on
            time. Browse the catalog and see for yourself.
          </p>
          <div className="hero-actions">
            <Link to="/products" className="btn btn-primary">
              Shop the catalog <FiArrowRight size={16} />
            </Link>
            <Link to="/register" className="btn btn-outline">
              Create a free account
            </Link>
          </div>
        </div>
        <div className="hero-panel">
          <div className="hero-panel-row">
            <span className="hero-panel-label">Live catalog</span>
            <span className="hero-panel-dot" />
          </div>
          <div className="hero-panel-stat">
            <span className="hero-panel-number">6</span>
            <span>curated categories</span>
          </div>
          <div className="hero-panel-stat">
            <span className="hero-panel-number">24/7</span>
            <span>customer support</span>
          </div>
          <div className="hero-panel-stat">
            <span className="hero-panel-number">30d</span>
            <span>return window</span>
          </div>
        </div>
      </section>

      <section className="features">
        {FEATURES.map((f, i) => (
          <div key={i} className="feature-card">
            <div className="feature-icon" data-color={f.color}><f.icon size={22} /></div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </section>

      <section className="categories">
        <div className="categories-head">
          <span className="eyebrow">Browse</span>
          <h2>Shop by category</h2>
        </div>
        <div className="category-grid">
          {CATEGORIES.map((cat) => (
           // REPLACE
              <Link to={`/products?category=${encodeURIComponent(cat.name)}`} key={cat.slug} className="category-tile">
              <div className="category-tile-img">
                <img src={getCategoryImage(cat.name)} alt={cat.name} />
                <div className={`category-tile-wash cat-wash-${cat.color}`} />
              </div>
              <span className="category-tile-label">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
