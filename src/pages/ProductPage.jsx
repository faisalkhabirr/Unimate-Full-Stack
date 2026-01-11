import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { chatService } from "../services/chatService";
import { listingService } from "../services/listingService";
import "../styles/ProductPage.css";

const ProductPage = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    const stateListing = location.state?.listing || null;

    const [listing, setListing] = useState(stateListing);
    const [related, setRelated] = useState([]);
    const [activeTab, setActiveTab] = useState("desc");

    const [qty, setQty] = useState(1);

    const [loading, setLoading] = useState(!stateListing);
    const [error, setError] = useState("");

    const isOwnListing = useMemo(() => {
        if (!user || !listing) return false;
        return user.id === listing.seller_id;
    }, [user, listing]);

    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                setLoading(true);
                setError("");

                const product = stateListing || (await listingService.getById(id));
                if (!mounted) return;
                setListing(product);

                // ✅ fetch related products
                const rel = await listingService.getRelated({
                    id: product.id,
                    category: product.category,
                    product_type: product.product_type,
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
            alert("You cannot chat with yourself!");
            return;
        }

        try {
            const chatId = await chatService.getOrCreateChat(
                listing.id,
                listing.seller_id,
                user.id
            );
            navigate(`/chat/${chatId}`);
        } catch (err) {
            console.error(err);
            alert("Could not start chat. Please try again.");
        }
    };

    const decQty = () => setQty((q) => Math.max(1, q - 1));
    const incQty = () => setQty((q) => Math.min(99, q + 1));

    const handleAddToCart = () => {
        // connect to your cart system later
        alert(`Added ${qty} item(s) to cart (demo).`);
    };

    if (loading) return <div className="pp-wrap"><div className="pp-loading">Loading...</div></div>;

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

    const listedDate = listing.created_at
        ? new Date(listing.created_at).toLocaleDateString()
        : "";

    return (
        <div className="pp-wrap">
            <div className="pp-container">

                {/* ================= TOP (Image left, Info right) ================= */}
                <div className="pp-hero">
                    <div className="pp-hero__media">
                        {/* small thumb like screenshot */}
                        <div className="pp-thumb">
                            <img src={listing.image_url} alt={`${listing.title} thumbnail`} />
                        </div>

                        <div className="pp-mainimg">
                            <img src={listing.image_url} alt={listing.title} />
                        </div>
                    </div>

                    <div className="pp-hero__info">
                        <h1 className="pp-title">{listing.title}</h1>

                        <div className="pp-ratingrow">
                            <span className="pp-stars">★★★★★</span>
                            <span className="pp-ratingtext">({listing.reviews_count ?? 1} customer review)</span>
                        </div>

                        <div className="pp-price">${listing.price}</div>

                        <p className="pp-shortdesc">
                            {listing.short_description || listing.description}
                        </p>

                        {/* <div className="pp-buyrow">
                            <div className="pp-qty">
                                <button type="button" className="pp-qtybtn" onClick={decQty}>−</button>
                                <input
                                    className="pp-qtyinput"
                                    type="number"
                                    min="1"
                                    max="99"
                                    value={qty}
                                    onChange={(e) => setQty(Math.max(1, Math.min(99, Number(e.target.value || 1))))}
                                />
                                <button type="button" className="pp-qtybtn" onClick={incQty}>+</button>
                            </div>

                            <button type="button" className="pp-addcart" onClick={handleAddToCart}>
                                Add to Cart
                            </button>
                        </div> */}

                        <div className="pp-meta">
                            <div className="pp-meta-row">
                                <span className="pp-meta-k">Category:</span>
                                <span className="pp-meta-v">{listing.category || listing.product_type || "General"}</span>
                            </div>
                            {listedDate && (
                                <div className="pp-meta-row">
                                    <span className="pp-meta-k">Listed:</span>
                                    <span className="pp-meta-v">{listedDate}</span>
                                </div>
                            )}
                        </div>

                        {/* Optional: keep your Message Seller (styled subtle) */}
                        {!isOwnListing && (
                            <button type="button" className="pp-msgseller" onClick={handleMessageSeller}>
                                Message Seller
                            </button>
                        )}
                    </div>
                </div>

                {/* ================= TABS ================= */}
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
                        onClick={() => setActiveTab("rev")}
                        type="button"
                    >
                        Reviews ({listing.reviews_count ?? 1})
                    </button>
                </div>

                <div className="pp-panel">
                    {activeTab === "desc" ? (
                        <div className="pp-descbox">
                            <h3>Description</h3>
                            <p className="pp-desc">{listing.description}</p>
                        </div>
                    ) : (
                        <div className="pp-review">
                            <div className="pp-review-head">
                                <span className="pp-review-name">Anonymous</span>
                                <span className="pp-review-stars">★★★★★</span>
                            </div>
                            <p className="pp-review-text">Nice product. Exactly as described.</p>
                        </div>
                    )}
                </div>

                {/* ================= RELATED PRODUCTS ================= */}
                <div className="pp-related">
                    <h2 className="pp-related-title">Related Products</h2>

                    {related.length === 0 ? (
                        <p className="pp-related-empty">No related products found.</p>
                    ) : (
                        <div className="pp-related-grid">
                            {related.map((p) => (
                                <article className="pp-rp" key={p.id}>
                                    <button
                                        type="button"
                                        className="pp-rp__img"
                                        onClick={() => navigate(`/product/${p.id}`, { state: { listing: p } })}
                                        aria-label={`Open ${p.title}`}
                                    >
                                        {p.image_url ? <img src={p.image_url} alt={p.title} /> : <div className="pp-noimg">📷</div>}
                                    </button>

                                    <div className="pp-rp__body">
                                        <button
                                            type="button"
                                            className="pp-rp__title"
                                            onClick={() => navigate(`/product/${p.id}`, { state: { listing: p } })}
                                        >
                                            {p.title}
                                        </button>

                                        <div className="pp-rp__price">${p.price}</div>

                                        <button
                                            type="button"
                                            className="pp-rp__btn"
                                            onClick={() => navigate(`/product/${p.id}`, { state: { listing: p } })}
                                        >
                                            View
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ProductPage;
