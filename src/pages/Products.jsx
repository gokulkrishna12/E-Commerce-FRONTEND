import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import API from "../api/axios";
import { FiSearch, FiShoppingCart, FiInbox, FiCheckCircle, FiXCircle, FiGrid, FiHeart } from "react-icons/fi";
import toast from "react-hot-toast";
import { CATEGORIES, getCategoryColor, getCategoryImage } from "../data/categories";
import { useAuth } from "../context/AuthContext";
import "./Products.scss";

const PAGE_SIZE = 12;

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") || "All");
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchProducts();
    if (user) fetchWishlist();
  }, [user]);

  useEffect(() => {
    setActiveCategory(searchParams.get("category") || "All");
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const fetchProducts = async () => {
    try {
      const res = await API.get("/products");
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Failed to load products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlist = async () => {
    try {
      const res = await API.get("/wishlist");
      if (Array.isArray(res.data)) {
        setWishlistIds(new Set(res.data.map((i) => i.product?.id).filter(Boolean)));
      }
    } catch {}
  };

  const addToCart = async (productId) => {
    try {
      await API.post("/cart/add", { productId, quantity: 1 });
      toast.success("Added to cart");
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error("Please login first");
        navigate("/login");
      } else {
        toast.error("Failed to add to cart");
      }
    }
  };

  const toggleWishlist = async (productId) => {
    if (!user) {
      toast.error("Please login to save items");
      navigate("/login");
      return;
    }
    const inWishlist = wishlistIds.has(productId);
    try {
      if (inWishlist) {
        await API.delete(`/wishlist/remove/${productId}`);
        setWishlistIds((prev) => { const next = new Set(prev); next.delete(productId); return next; });
        toast.success("Removed from wishlist");
      } else {
        await API.post("/wishlist/add", { productId });
        setWishlistIds((prev) => new Set(prev).add(productId));
        toast.success("Added to wishlist");
      }
    } catch {
      toast.error("Wishlist action failed");
    }
  };

  const selectCategory = (categoryName) => {
    if (categoryName === "All") setSearchParams({});
    else setSearchParams({ category: categoryName });
  };

  const validProducts = Array.isArray(products) ? products : [];
  const filtered = validProducts.filter((p) => {
    const matchCategory = activeCategory === "All" || p.category === activeCategory;
    const matchSearch = (p.name || "").toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="page-shell">
      <div className="products-head">
        <div>
          <span className="eyebrow">Catalog</span>
          <h1>All products</h1>
        </div>
        <div className="search-box">
          <FiSearch size={17} />
          <input placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="category-row">
        <button onClick={() => selectCategory("All")} className={`cat-pill cat-pill-all ${activeCategory === "All" ? "is-active" : ""}`}>
          <FiGrid size={15} /> All
        </button>
        {CATEGORIES.map((cat) => (
          <button key={cat.slug} onClick={() => selectCategory(cat.name)} className={`cat-pill ${activeCategory === cat.name ? "is-active" : ""}`}>
            <span className="cat-avatar cat-avatar-sm" data-color={cat.color}>
              <img src={getCategoryImage(cat.name)} alt="" />
            </span>
            {cat.name}
          </button>
        ))}
      </div>

      <p className="result-count">
        Showing <strong>{paginated.length}</strong> of <strong>{filtered.length}</strong> product{filtered.length !== 1 ? "s" : ""}
        {activeCategory !== "All" && ` in "${activeCategory}"`}
      </p>

      {loading ? (
        <div className="state-block"><p>Loading products…</p></div>
      ) : filtered.length === 0 ? (
        <div className="state-block">
          <div className="state-icon"><FiInbox size={24} /></div>
          <h3>No products found</h3>
          <p>Try a different search term or category.</p>
        </div>
      ) : (
        <>
          <div className="product-grid">
            {paginated.map((product) => {
              const color = getCategoryColor(product.category);
              const isWishlisted = wishlistIds.has(product.id);
              return (
                <div
                  key={product.id}
                  className="product-card"
                  onClick={() => navigate(`/products/${product.id}`)}
                >
                  <div className="product-img">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} onError={(e) => { e.target.style.display = "none"; }} />
                    ) : (
                      <img src={getCategoryImage(product.category)} alt={product.category} />
                    )}
                    <button
                      className={`product-wish-btn ${isWishlisted ? "active" : ""}`}
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
                      title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <FiHeart size={16} fill={isWishlisted ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <div className="product-info">
                    <span className="tag" data-color={color}>{product.category}</span>
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-desc">{product.description?.slice(0, 65)}…</p>
                    <p className={`product-stock ${product.stock > 0 ? "in" : "out"}`}>
                      {product.stock > 0
                        ? <><FiCheckCircle size={13} /> In stock ({product.stock})</>
                        : <><FiXCircle size={13} /> Out of stock</>}
                    </p>
                    <div className="product-bottom">
                      <span className="price-tag product-price">₹{product.price}</span>
                      <div className="product-actions">
                        <Link to={`/products/${product.id}`} className="btn btn-outline btn-sm" onClick={(e) => e.stopPropagation()}>View</Link>
                        <button onClick={(e) => { e.stopPropagation(); addToCart(product.id); }} className="btn btn-primary btn-sm" disabled={product.stock === 0}>
                          <FiShoppingCart size={14} /> Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="pagination-row">
              <button className="page-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                Prev
              </button>
              <div className="page-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                  <button key={num} className={`page-num ${page === num ? "is-active" : ""}`} onClick={() => setPage(num)}>
                    {num}
                  </button>
                ))}
              </div>
              <button className="page-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Products;