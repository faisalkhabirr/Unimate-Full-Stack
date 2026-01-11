import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { chatService } from "../services/chatService";
import "../styles/ProductModal.css";

const ProductModal = ({ listing, onClose }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState("desc");

    if (!listing) return null;

    const handleMessage = async () => {
        if (!user) {
            navigate("/login");
            return;
        }

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
            onClose();
        } catch (error) {
            console.error("Error starting chat:", error);
            alert("Could not start chat. Please try again.");
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    const listedDate = new Date(listing.created_at).toLocaleDateString();
    const category = listing.category || "General";

    return (
        <div className="pm-backdrop" onClick={handleBackdropClick}>
            <div className="pm-card" role="dialog" aria-modal="true">
                <button className="pm-close" onClick={onClose} aria-label="Close modal">
                    ×
                </button>

                {/* TOP: image + info (like the screenshot) */}
                <div className="pm-top">
                    <div className="pm-media">
                        <img src={listing.image_url} alt={listing.title} />
                    </div>

                    <div className="pm-info">
                        <h2 className="pm-title">{listing.title}</h2>

                        <div className="pm-subrow">
                            <div className="pm-badge">★ 4.8</div>
                            <span className="pm-muted">•</span>
                            <span className="pm-muted">{category}</span>
                            <span className="pm-muted">•</span>
                            <span className="pm-muted">Listed {listedDate}</span>
                        </div>

                        <div className="pm-price">${listing.price}</div>

                        <div className="pm-actions">
                            {user && user.id !== listing.seller_id ? (
                                <button className="pm-btn pm-btn-primary" onClick={handleMessage}>
                                    💬 Message Seller
                                </button>
                            ) : (
                                <button className="pm-btn pm-btn-ghost" disabled>
                                    Your listing
                                </button>
                            )}

                            <button
                                className="pm-btn pm-btn-secondary"
                                onClick={() => {
                                    // optional: hook this to your cart later
                                    alert("Added (demo)");
                                }}
                            >
                                + Add to Cart
                            </button>
                        </div>

                        <div className="pm-meta">
                            <div className="pm-meta-row">
                                <span className="pm-meta-key">Category</span>
                                <span className="pm-meta-val">{category}</span>
                            </div>
                            <div className="pm-meta-row">
                                <span className="pm-meta-key">Listing ID</span>
                                <span className="pm-meta-val">#{listing.id}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* BOTTOM: tabs like the screenshot */}
                <div className="pm-bottom">
                    <div className="pm-tabs">
                        <button
                            className={`pm-tab ${activeTab === "desc" ? "is-active" : ""}`}
                            onClick={() => setActiveTab("desc")}
                            type="button"
                        >
                            Description
                        </button>

                        <button
                            className={`pm-tab ${activeTab === "rev" ? "is-active" : ""}`}
                            onClick={() => setActiveTab("rev")}
                            type="button"
                        >
                            Reviews <span className="pm-tab-count">(1)</span>
                        </button>
                    </div>

                    <div className="pm-tabpanel">
                        {activeTab === "desc" ? (
                            <p className="pm-desc">{listing.description}</p>
                        ) : (
                            <div className="pm-review">
                                <div className="pm-review-head">
                                    <span className="pm-review-name">Anonymous</span>
                                    <span className="pm-review-stars">★★★★★</span>
                                </div>
                                <p className="pm-review-text">
                                    Really nice item — exactly as described.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Optional: “Related Products” strip (UI only) */}
                    <div className="pm-related">
                        <div className="pm-related-head">
                            <h3>Related Products</h3>
                            <span className="pm-related-hint">Coming from your listings feed</span>
                        </div>

                        <div className="pm-related-row">
                            {/* placeholders to match the screenshot look */}
                            {[1, 2, 3, 4].map((n) => (
                                <div className="pm-mini" key={n}>
                                    <div className="pm-mini-img" />
                                    <div className="pm-mini-title">Product {n}</div>
                                    <div className="pm-mini-price">$99.00</div>
                                    <button className="pm-mini-btn">+ Add</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductModal;
