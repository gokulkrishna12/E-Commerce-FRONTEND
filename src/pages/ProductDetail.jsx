import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API from "../api/axios";
import toast from "react-hot-toast";
import {
  FiShoppingCart, FiArrowLeft, FiMinus, FiPlus, FiHeart, FiMessageSquare,
  FiImage, FiCamera, FiX, FiZap, FiTrash2,
} from "react-icons/fi";
import { getCategoryColor, getCategoryImage } from "../data/categories";
import { useAuth } from "../context/AuthContext";
import StarRating from "../components/StarRating";
import ConfirmModal from "../components/ConfirmModal";
import CameraCapture from "../components/CameraCapture";
import "./ProductDetail.scss";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [myImageUrl, setMyImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const galleryInputRef = useRef(null);

  const [deleteReviewId, setDeleteReviewId] = useState(null);
  const [deletingReview, setDeletingReview] = useState(false);

  const [related, setRelated] = useState([]);

  useEffect(() => {
    setQty(1);
    API.get(`/products/${id}`).then((res) => setProduct(res.data));
    API.get(`/reviews/product/${id}`).then((res) => setReviews(res.data)).catch(() => {});
    if (user) checkWishlist();
  }, [id, user]);

  useEffect(() => {
    if (product) fetchRelated();
  }, [product]);

  // ✅ NEW — lightbox: Esc to close, lock background scroll while open
  useEffect(() => {
    document.body.style.overflow = lightboxOpen ? "hidden" : "";
    if (!lightboxOpen) return;
    const onKey = (e) => { if (e.key === "Escape") setLightboxOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [lightboxOpen]);

  const checkWishlist = async () => {
    try {
      const res = await API.get("/wishlist");
      setIsWishlisted(res.data.some((i) => i.product.id === Number(id)));
    } catch {}
  };

  const fetchRelated = async () => {
    try {
      const res = await API.get(`/products/category/${encodeURIComponent(product.category)}`);
      setRelated(res.data.filter((p) => p.id !== product.id).slice(0, 4));
    } catch {}
  };

  const addToCart = async () => {
    try {
      await API.post("/cart/add", { productId: product.id, quantity: qty });
      toast.success("Added to cart");
    } catch {
      toast.error("Login to add to cart");
    }
  };

  const buyNow = () => {
    if (!user) {
      toast.error("Please login to continue");
      navigate("/login");
      return;
    }
    navigate("/payment", {
      state: {
        mode: "buy-now",
        productId: product.id,
        quantity: qty,
        totalAmount: product.price * qty,
        shippingAddress: "",
        cartItems: [{ product, quantity: qty }],
      },
    });
  };

  const toggleWishlist = async () => {
    if (!user) { toast.error("Please login to save items"); navigate("/login"); return; }
    try {
      if (isWishlisted) {
        await API.delete(`/wishlist/remove/${product.id}`);
        setIsWishlisted(false);
        toast.success("Removed from wishlist");
      } else {
        await API.post("/wishlist/add", { productId: product.id });
        setIsWishlisted(true);
        toast.success("Added to wishlist");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Wishlist action failed");
    }
  };

  // ✅ Shared upload logic used by BOTH gallery picker and camera capture
  const uploadImageFile = async (file) => {
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await API.post("/upload/review-image", formData);
      setMyImageUrl(res.data.imageUrl);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleGallerySelect = (e) => {
    const file = e.target.files[0];
    if (file) uploadImageFile(file);
  };

  const handleCameraCapture = (file) => uploadImageFile(file);

  const removeSelectedImage = () => {
    setMyImageUrl("");
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const submitReview = async () => {
    if (!user) { toast.error("Please login to leave a review"); navigate("/login"); return; }
    if (myRating === 0) { toast.error("Please select a star rating"); return; }
    setSubmittingReview(true);
    try {
      await API.post("/reviews/add", {
        productId: product.id,
        rating: myRating,
        comment: myComment,
        imageUrl: myImageUrl,
      });
      toast.success("Review submitted!");
      const res = await API.get(`/reviews/product/${id}`);
      setReviews(res.data);
      setMyRating(0);
      setMyComment("");
      removeSelectedImage();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const confirmDeleteReview = async () => {
    setDeletingReview(true);
    try {
      await API.delete(`/reviews/${deleteReviewId}`);
      toast.success("Review deleted");
      setReviews((prev) => prev.filter((r) => r.id !== deleteReviewId));
      setDeleteReviewId(null);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete review");
    } finally {
      setDeletingReview(false);
    }
  };

  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  if (!product) return <div className="state-block"><p>Loading…</p></div>;

  const mainImage = product.imageUrl || getCategoryImage(product.category);

  return (
    <div className="page-shell">

      <ConfirmModal
        open={!!deleteReviewId}
        title="Delete your review?"
        message="This will permanently remove your review from this product."
        confirmLabel="Yes, delete it"
        cancelLabel="Keep it"
        busy={deletingReview}
        onConfirm={confirmDeleteReview}
        onClose={() => setDeleteReviewId(null)}
      />

      <CameraCapture open={cameraOpen} onClose={() => setCameraOpen(false)} onCapture={handleCameraCapture} />

      <button onClick={() => navigate(-1)} className="btn btn-ghost detail-back">
        <FiArrowLeft size={16} /> Back
      </button>

      <div className="detail-container">
        <div className="detail-imgbox">
          <button className="detail-img-trigger" onClick={() => setLightboxOpen(true)} title="View full image">
            <img
              src={mainImage}
              alt={product.name}
              onError={(e) => { e.target.src = getCategoryImage(product.category); }}
            />
          </button>
          <button
            className={`detail-wish-btn ${isWishlisted ? "active" : ""}`}
            onClick={toggleWishlist}
            title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <FiHeart size={18} fill={isWishlisted ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="detail-info">
          <span className="tag" data-color={getCategoryColor(product.category)}>{product.category}</span>
          <h1>{product.name}</h1>

          {reviews.length > 0 && (
            <div className="detail-rating-row">
              <StarRating value={Math.round(avgRating)} readOnly size={16} />
              <span className="detail-rating-text">
                {avgRating.toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
              </span>
            </div>
          )}

          <p className="detail-desc">{product.description}</p>

          <div className="detail-price-row">
            <span className="price-tag detail-price">₹{product.price}</span>
            <span className="tag tag-stock">Stock: {product.stock}</span>
          </div>

          <div className="detail-qty-row">
            <label>Quantity</label>
            <div className="qty-control">
              <button onClick={() => setQty(Math.max(1, qty - 1))}><FiMinus size={14} /></button>
              <span>{qty}</span>
              <button onClick={() => setQty(qty + 1)}><FiPlus size={14} /></button>
            </div>
          </div>

          <div className="detail-btn-row">
            <button onClick={addToCart} className="btn btn-outline detail-cart-btn" disabled={product.stock === 0}>
              <FiShoppingCart size={18} /> Add to cart
            </button>
            <button onClick={buyNow} className="detail-buynow-btn" disabled={product.stock === 0}>
              <FiZap size={18} /> Buy Now · ₹{(product.price * qty).toFixed(0)}
            </button>
          </div>
        </div>
      </div>

      {lightboxOpen && (
        <div className="lightbox-overlay" onClick={() => setLightboxOpen(false)}>
          <button className="lightbox-close" onClick={() => setLightboxOpen(false)} title="Close">
            <FiX size={22} />
          </button>

          <div className="lightbox-stage" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-slide">
              <img
                src={mainImage}
                alt={product.name}
                onError={(e) => { e.target.src = getCategoryImage(product.category); }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Reviews ── */}
      <div className="reviews-section">
        <h2 className="section-heading-sm">
          <FiMessageSquare size={18} /> Reviews {reviews.length > 0 && `(${reviews.length})`}
        </h2>

        <div className="review-form">
          <p className="review-form-label">Leave a review</p>
          <StarRating value={myRating} onChange={setMyRating} size={22} />
          <textarea
            className="field-textarea"
            placeholder="Share your thoughts about this product…"
            rows={3}
            value={myComment}
            onChange={(e) => setMyComment(e.target.value)}
          />

          <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleGallerySelect} className="review-file-input" />

          {!myImageUrl ? (
            <div className="review-photo-row">
              <button type="button" className="btn btn-outline btn-sm review-upload-btn"
                onClick={() => galleryInputRef.current?.click()} disabled={uploadingImage}>
                <FiImage size={14} /> {uploadingImage ? "Uploading…" : "Choose photo"}
              </button>
              <button type="button" className="btn btn-outline btn-sm review-upload-btn"
                onClick={() => setCameraOpen(true)} disabled={uploadingImage}>
                <FiCamera size={14} /> Take photo
              </button>
            </div>
          ) : (
            <div className="review-image-preview">
              <img src={myImageUrl} alt="preview" />
              <button type="button" onClick={removeSelectedImage} className="review-image-remove">
                <FiX size={13} />
              </button>
            </div>
          )}

          <button onClick={submitReview} className="btn btn-primary" disabled={submittingReview}>
            {submittingReview ? "Submitting…" : "Submit review"}
          </button>
        </div>

        <div className="review-list">
          {reviews.length === 0 ? (
            <p className="review-empty">No reviews yet — be the first to share your thoughts!</p>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="review-item">
                <div className="review-item-head">
                  <span className="review-author">{r.user?.name || "Anonymous"}</span>
                  <div className="review-item-head-right">
                    <StarRating value={r.rating} readOnly size={13} />
                    {user && r.user?.email === user.email && (
                      <button className="review-delete-btn" onClick={() => setDeleteReviewId(r.id)} title="Delete review">
                        <FiTrash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
                {r.comment && <p className="review-comment">{r.comment}</p>}
                {r.imageUrl && <img src={r.imageUrl} className="review-image" alt="Customer upload" />}
                <span className="review-date">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Related Products ── */}
      {related.length > 0 && (
        <div className="related-section">
          <h2 className="section-heading-sm">You may also like</h2>
          <div className="related-grid">
            {related.map((p) => (
              <Link to={`/products/${p.id}`} key={p.id} className="related-card">
                <div className="related-img">
                  {p.imageUrl
                    ? <img src={p.imageUrl} alt={p.name} onError={(e)=>{e.target.style.display="none";}} />
                    : <img src={getCategoryImage(p.category)} alt={p.category} />
                  }
                </div>
                <div className="related-info">
                  <h4>{p.name}</h4>
                  <span className="price-tag">₹{p.price}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
