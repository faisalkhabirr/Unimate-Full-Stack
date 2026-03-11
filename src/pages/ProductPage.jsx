import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { chatService } from "../services/chatService";
import { listingService } from "../services/listingService";
import { reviewService } from "../services/reviewService";
import Modal from "../components/Modal";
import "../styles/ProductPage.css";

const PLACEHOLDER_IMG =
    "https://via.placeholder.com/400x300/f7f8f9/636e72?text=No+Image";

const ProductPage = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    const stateListing = location.state?.listing || null;

    const [listing, setListing] = useState(stateListing);
    const [related, setRelated] = useState([]);
    const [activeTab, setActiveTab] = useState("desc");

    const [loading, setLoading] = useState(!stateListing);
    const [error, setError] = useState("");

    // ✅ multiple images
    const [activeImgIdx, setActiveImgIdx] = useState(0);

    // ===== Reviews =====
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewError, setReviewError] = useState("");

    const [myRating, setMyRating] = useState(5);
    const [myText, setMyText] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);

    // Modal state
    const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "info", onConfirm: null });

    const isOwnListing = useMemo(() => {
        if (!user || !listing) return false;
        return user.id === listing.seller_id;
    }, [user, listing]);

    // ✅ normalize media (images + videos)
    const mediaList = useMemo(() => {
        const imgs = Array.isArray(listing?.listing_images) ? [...listing.listing_images] : [];
        const vids = Array.isArray(listing?.listing_videos) ? [...listing.listing_videos] : []; // Assuming listing_videos is populated

        // primary first, then sort_order
        imgs.sort((a, b) => {
            const ap = a?.is_primary ? 0 : 1;
            const bp = b?.is_primary ? 0 : 1;
            if (ap !== bp) return ap - bp;
            return (a?.sort_order ?? 0) - (b?.sort_order ?? 0);
        });

        const allMedia = [
            ...imgs.map(i => ({ type: 'image', url: i.image_url, ...i })),
            ...vids.map(v => ({ type: 'video', url: v.video_url, ...v }))
        ];

        // fallback legacy single image_url
        if (allMedia.length === 0 && listing?.image_url) {
            return [{ type: 'image', url: listing.image_url, is_primary: true, sort_order: 0 }];
        }

        // final fallback
        if (allMedia.length === 0) {
            return [{ type: 'image', url: PLACEHOLDER_IMG, is_primary: true, sort_order: 0 }];
        }

        return allMedia;
    }, [listing]);

    const activeMedia = useMemo(() => {
        const idx = Math.min(Math.max(activeImgIdx, 0), mediaList.length - 1);
        return mediaList[idx];
    }, [mediaList, activeImgIdx]);

    // ✅ when listing changes, reset active image
    useEffect(() => {
        setActiveImgIdx(0);
    }, [listing?.id]);

    // ✅ review summary (real)
    const ratingSummary = useMemo(() => {
        const count = reviews.length;
        if (count === 0) return { avg: 0, count: 0 };
        const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
        return { avg: (sum / count).toFixed(1), count };
    }, [reviews]);

    const loadReviews = async (listingId) => {
        if (!user) return;
        try {
            setReviewsLoading(true);
            setReviewError("");
            const data = await reviewService.getForListing(listingId);
            setReviews(data);
        } catch (e) {
            console.error(e);
            setReviewError("Could not load reviews.");
        } finally {
            setReviewsLoading(false);
        }
    };

    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                setLoading(true);
                setError("");

                const product = stateListing || (await listingService.getById(id));
                if (!mounted) return;

                setListing(product);

                // ✅ DEBUG (remove later)
                console.log("listing_images from DB:", product?.listing_images);

                const rel = await listingService.getRelated({
                    id: product.id,
                    category_id: product.category_id,
                    limit: 5,
                });

                if (!mounted) return;
                setRelated(rel);
            } catch (e) {
                console.error(e);
                if (!mounted) return;
                setError("Could not load this product.");
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [id, stateListing]);

    const handleMessageSeller = async () => {
        if (!user) return navigate("/login");
        if (!listing) return;

        if (user.id === listing.seller_id) {
            setModal({
                isOpen: true,
                title: "Information",
                message: "You cannot chat with yourself!",
                type: "info",
                confirmText: "Close",
                onConfirm: () => setModal({ ...modal, isOpen: false }),
                onClose: () => setModal({ ...modal, isOpen: false })
            });
            return;
        }

        try {
            const chatId = await chatService.getOrCreateChat(listing.id, listing.seller_id, user.id);
            navigate(`/chat/${chatId}`);
        } catch (err) {
            console.error(err);
            setModal({
                isOpen: true,
                title: "Error",
                message: "Could not start chat. Please try again later.",
                type: "danger",
                confirmText: "Close",
                onConfirm: () => setModal({ ...modal, isOpen: false }),
                onClose: () => setModal({ ...modal, isOpen: false })
            });
        }
    };

    const submitReview = async () => {
        if (!user) return navigate("/login");
        if (!listing) return;

        if (user.id === listing.seller_id) {
            setModal({
                isOpen: true,
                title: "Notice",
                message: "You cannot review your own product.",
                type: "info",
                confirmText: "Understood",
                onConfirm: () => setModal({ ...modal, isOpen: false }),
                onClose: () => setModal({ ...modal, isOpen: false })
            });
            return;
        }

        try {
            setSubmittingReview(true);
            setReviewError("");

            await reviewService.addReview({
                listingId: listing.id,
                rating: myRating,
                review_text: myText,
                reviewer_id: user.id,
            });

            setMyText("");
            setMyRating(5);

            await loadReviews(listing.id);
        } catch (e) {
            console.error(e);
            setReviewError(e.message || "Could not submit review.");
        } finally {
            setSubmittingReview(false);
        }
    };

    if (loading) {
        return (
            <div className="pp-wrap">
                <div className="pp-loading">Loading...</div>
            </div>
        );
    }

    if (error || !listing) {
        return (
            <div className="pp-wrap">
                <div className="pp-error">
                    <h2>Oops</h2>
                    <p>{error || "Product not found."}</p>
                    <button className="pp-btn pp-secondary" onClick={() => navigate(-1)}>
                        ← Go back
                    </button>
                </div>
            </div>
        );
    }

    const listedDate = listing.created_at ? new Date(listing.created_at).toLocaleDateString() : "";

    // ✅ stop showing description twice:
    // only show short_description here if it exists; full description stays in Description tab
    const shortDesc = (listing.short_description || "").trim();

    const attrs = listing?.attributes && typeof listing.attributes === "object" ? listing.attributes : {};
    const attrEntries = Object.entries(attrs).filter(
        ([, v]) => v !== null && v !== undefined && String(v).trim() !== ""
    );

    const conditionLabelMap = {
        new: "Brand new",
        used: "Used",
        refurbished: "Refurbished",
    };
    const conditionLabel = listing?.condition ? (conditionLabelMap[listing.condition] || listing.condition) : "";

    return (
        <div className="pp-wrap">
            <div className="pp-container">
                <div className="pp-hero">
                    <div className={`pp-hero__media ${mediaList.length <= 1 ? "pp-hero__media--single" : ""}`}>
                        {/* ✅ thumbs column - only show if > 1 items */}
                        {mediaList.length > 1 && (
                            <div className="pp-thumb">
                                <div className="pp-thumbs">
                                    {mediaList.map((item, idx) => (
                                        <button
                                            key={`${item.url}-${idx}`}
                                            type="button"
                                            className={`pp-thumbBtn ${idx === activeImgIdx ? "is-active" : ""}`}
                                            onClick={() => setActiveImgIdx(idx)}
                                            aria-label={`Show item ${idx + 1}`}
                                        >
                                            {item.type === 'video' ? (
                                                <div className="pp-thumb-vid-icon">▶</div>
                                            ) : (
                                                <img src={item.url || PLACEHOLDER_IMG} alt={`${listing.title} thumb ${idx + 1}`} />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ✅ main media */}
                        <div className="pp-mainimg">
                            {activeMedia?.type === 'video' ? (
                                <video src={activeMedia.url} controls className="pp-main-video" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : (
                                <img src={activeMedia?.url || PLACEHOLDER_IMG} alt={listing.title} />
                            )}

                            {mediaList.length > 1 && (
                                <>
                                    <button
                                        type="button"
                                        className="pp-imgNav pp-imgNav--prev"
                                        onClick={() => setActiveImgIdx((i) => Math.max(0, i - 1))}
                                        disabled={activeImgIdx === 0}
                                    >
                                        ‹
                                    </button>

                                    <button
                                        type="button"
                                        className="pp-imgNav pp-imgNav--next"
                                        onClick={() => setActiveImgIdx((i) => Math.min(mediaList.length - 1, i + 1))}
                                        disabled={activeImgIdx === mediaList.length - 1}
                                    >
                                        ›
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="pp-hero__info">
                        <h1 className="pp-title">{listing.title}</h1>

                        <div className="pp-ratingrow">
                            <span className="pp-stars">★★★★★</span>
                            <span className="pp-ratingtext">
                                {user ? (
                                    ratingSummary.count === 0 ? (
                                        "(No reviews yet)"
                                    ) : (
                                        `(${ratingSummary.avg}/5 • ${ratingSummary.count} review${ratingSummary.count > 1 ? "s" : ""
                                        })`
                                    )
                                ) : (
                                    "(Login to see reviews)"
                                )}
                            </span>
                        </div>

                        <div className="pp-price">{listing.price} BDT</div>

                        {/* ✅ no duplicate description */}
                        {shortDesc ? <p className="pp-shortdesc">{shortDesc}</p> : null}

                        <div className="pp-meta">
                            <div className="pp-meta-row">
                                <span className="pp-meta-k">Category:</span>
                                <span className="pp-meta-v">{listing?.categories?.name || "General"}</span>
                            </div>

                            {conditionLabel ? (
                                <div className="pp-meta-row">
                                    <span className="pp-meta-k">Condition:</span>
                                    <span className="pp-meta-v">{conditionLabel}</span>
                                </div>
                            ) : null}

                            {typeof listing?.negotiable === "boolean" ? (
                                <div className="pp-meta-row">
                                    <span className="pp-meta-k">Negotiable:</span>
                                    <span className="pp-meta-v">{listing.negotiable ? "Yes" : "No"}</span>
                                </div>
                            ) : null}

                            {listing?.stock_count !== undefined ? (
                                <div className="pp-meta-row">
                                    <span className="pp-meta-k">Availability:</span>
                                    <span className="pp-meta-v">
                                        {listing.stock_count > 0 ? `${listing.stock_count} units currently available` : "Out of Stock"}
                                    </span>
                                </div>
                            ) : null}

                            {listing?.location ? (
                                <div className="pp-meta-row">
                                    <span className="pp-meta-k">Product Location:</span>
                                    <span className="pp-meta-v">{listing.location}</span>
                                </div>
                            ) : null}

                            {listedDate ? (
                                <div className="pp-meta-row">
                                    <span className="pp-meta-k">Listed:</span>
                                    <span className="pp-meta-v">{listedDate}</span>
                                </div>
                            ) : null}

                            {/* ✅ show optional attributes if seller filled them */}
                            {attrEntries.length > 0 ? (
                                <div className="pp-meta-row" style={{ alignItems: "flex-start" }}>
                                    <span className="pp-meta-k">Details:</span>
                                    <span className="pp-meta-v">
                                        {attrEntries.map(([k, v]) => (
                                            <div key={k} style={{ marginBottom: 4 }}>
                                                <strong style={{ textTransform: "capitalize" }}>{k.replace(/_/g, " ")}:</strong>{" "}
                                                {String(v)}
                                            </div>
                                        ))}
                                    </span>
                                </div>
                            ) : null}
                        </div>

                        {!isOwnListing && (
                            <button type="button" className="pp-msgseller" onClick={handleMessageSeller}>
                                Message Seller
                            </button>
                        )}
                    </div>
                </div>

                <div className="pp-tabs">
                    <button
                        className={`pp-tab ${activeTab === "desc" ? "is-active" : ""}`}
                        onClick={() => setActiveTab("desc")}
                        type="button"
                    >
                        Description
                    </button>

                    <button
                        className={`pp-tab ${activeTab === "rev" ? "is-active" : ""}`}
                        onClick={async () => {
                            setActiveTab("rev");
                            if (!user) return;
                            await loadReviews(listing.id);
                        }}
                        type="button"
                    >
                        Reviews {user ? `(${ratingSummary.count})` : "(Login required)"}
                    </button>
                </div>

                <div className="pp-panel">
                    {activeTab === "desc" ? (
                        <div className="pp-descbox">
                            <h3>Description</h3>
                            <p className="pp-desc">{listing.description || "No description provided."}</p>
                        </div>
                    ) : (
                        <div className="pp-reviews">
                            {!user ? (
                                <div className="pp-review">
                                    <p>You must be logged in to view reviews.</p>
                                    <button className="pp-btn pp-secondary" onClick={() => navigate("/login")}>
                                        Login
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="pp-reviewSummary">
                                        <div className="pp-stars">★★★★★</div>
                                        <div className="pp-ratingtext">
                                            {ratingSummary.count === 0
                                                ? "No reviews yet"
                                                : `${ratingSummary.avg} / 5 (${ratingSummary.count} review${ratingSummary.count > 1 ? "s" : ""
                                                })`}
                                        </div>
                                    </div>

                                    {user.id !== listing.seller_id && (
                                        <div className="pp-reviewForm">
                                            <h3>Write a review</h3>

                                            <label className="pp-meta-row" style={{ alignItems: "center" }}>
                                                <span className="pp-meta-k">Rating:</span>
                                                <select
                                                    value={myRating}
                                                    onChange={(e) => setMyRating(parseInt(e.target.value, 10))}
                                                >
                                                    <option value={5}>5 - Excellent</option>
                                                    <option value={4}>4 - Good</option>
                                                    <option value={3}>3 - Okay</option>
                                                    <option value={2}>2 - Bad</option>
                                                    <option value={1}>1 - Terrible</option>
                                                </select>
                                            </label>

                                            <textarea
                                                className="pp-textarea"
                                                rows={3}
                                                value={myText}
                                                onChange={(e) => setMyText(e.target.value)}
                                                placeholder="Write your honest opinion..."
                                            />

                                            <button
                                                className="pp-msgseller"
                                                type="button"
                                                onClick={submitReview}
                                                disabled={submittingReview}
                                            >
                                                {submittingReview ? "Submitting..." : "Submit Review"}
                                            </button>

                                            {reviewError && <p className="pp-errorText">{reviewError}</p>}
                                        </div>
                                    )}

                                    {reviewsLoading ? (
                                        <p>Loading reviews...</p>
                                    ) : reviews.length === 0 ? (
                                        <p>No reviews yet. Be the first to review!</p>
                                    ) : (
                                        reviews.map((r) => (
                                            <div className="pp-review" key={r.id}>
                                                <div className="pp-review-head">
                                                    <span className="pp-review-name">{r.reviewer_id === user.id ? "You" : "User"}</span>
                                                    <span className="pp-review-stars">{"★★★★★".slice(0, r.rating)}</span>
                                                </div>
                                                {r.review_text && <p className="pp-review-text">{r.review_text}</p>}
                                                <div className="pp-review-date">{new Date(r.created_at).toLocaleDateString()}</div>
                                            </div>
                                        ))
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="pp-related">
                    <h2 className="pp-related-title">Related Products</h2>

                    {related.length === 0 ? (
                        <p className="pp-related-empty">No related products found.</p>
                    ) : (
                        <div className="pp-related-grid">
                            {related.map((p) => {
                                const imgs = Array.isArray(p?.listing_images) ? p.listing_images : [];
                                const primary = imgs.find((x) => x?.is_primary) || imgs[0];
                                const img = primary?.image_url || p?.image_url || PLACEHOLDER_IMG;

                                return (
                                    <article className="pp-rp" key={p.id}>
                                        <button
                                            type="button"
                                            className="pp-rp__img"
                                            onClick={() => navigate(`/product/${p.id}`, { state: { listing: p } })}
                                            aria-label={`Open ${p.title}`}
                                        >
                                            <img src={img} alt={p.title} />
                                        </button>

                                        <div className="pp-rp__body">
                                            <button
                                                type="button"
                                                className="pp-rp__title"
                                                onClick={() => navigate(`/product/${p.id}`, { state: { listing: p } })}
                                            >
                                                {p.title}
                                            </button>

                                            <div className="pp-rp__price">{p.price} BDT</div>

                                            <button
                                                type="button"
                                                className="pp-rp__btn"
                                                onClick={() => navigate(`/product/${p.id}`, { state: { listing: p } })}
                                            >
                                                View
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <Modal
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                onConfirm={modal.onConfirm}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                confirmText={modal.confirmText}
            />
        </div>
    );
};

export default ProductPage;
