import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { wishlistService } from "../services/wishlistService";
import Modal from "../components/Modal";
import "../styles/SavedItems.css";

const SavedItems = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [savedListings, setSavedListings] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "info", onConfirm: null });

    useEffect(() => {
        if (user) fetchSavedItems();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const fetchSavedItems = async () => {
        setLoading(true);
        try {
            const data = await wishlistService.getSavedListings(user.id);
            setSavedListings(data || []);
        } catch (err) {
            console.error("Error fetching saved items:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (savedId) => {
        try {
            await wishlistService.removeSave(savedId);
            setSavedListings((prev) => prev.filter((item) => item.id !== savedId));
        } catch (err) {
            console.error("Error removing saved item:", err);
            setModal({
                isOpen: true,
                title: "Error",
                message: "Failed to remove item from saved list. Please try again.",
                type: "danger",
                confirmText: "Close",
                onConfirm: () => setModal({ ...modal, isOpen: false }),
                onClose: () => setModal({ ...modal, isOpen: false })
            });
        }
    };

    const pickImage = (image_url) => {
        if (!image_url) return null;
        try {
            const parsed = JSON.parse(image_url);
            if (Array.isArray(parsed)) return parsed[0] || null;
        } catch (_) { }
        return image_url;
    };

    if (loading) return <div className="saved-loading">Loading saved items...</div>;

    return (
        <div className="saved-container">
            <div className="saved-header">
                <h1>Saved Items</h1>
                <p>Your wishlist and bookmarked listings</p>
            </div>

            {savedListings.length === 0 ? (
                <div className="saved-empty">
                    <div className="saved-empty-icon">❤️</div>
                    <h2>No saved items yet</h2>
                    <p>Browse the marketplace and save items you're interested in</p>
                    <button onClick={() => navigate("/marketplace")} className="saved-browse-btn">
                        Browse Marketplace
                    </button>
                </div>
            ) : (
                <div className="saved-grid">
                    {savedListings.map((item) => {
                        const listing = item.listings;
                        const img = pickImage(listing?.image_url);

                        return (
                            <div key={item.id} className="saved-card">
                                <div
                                    className="saved-card-image"
                                    onClick={() => navigate(`/product/${listing.id}`)}
                                >
                                    {img ? (
                                        <img src={img} alt={listing.title} />
                                    ) : (
                                        <div className="saved-card-no-image">No Image</div>
                                    )}
                                </div>

                                <div className="saved-card-content">
                                    <h3
                                        className="saved-card-title"
                                        onClick={() => navigate(`/product/${listing.id}`)}
                                    >
                                        {listing.title}
                                    </h3>
                                    <div className="saved-card-meta">
                                        <span className="saved-card-price">{listing.price} BDT</span>
                                        <span className="saved-card-condition">{listing.condition}</span>
                                    </div>
                                    <div className="saved-card-actions">
                                        <button
                                            onClick={() => navigate(`/product/${listing.id}`)}
                                            className="saved-btn-view"
                                        >
                                            View Details
                                        </button>
                                        <button
                                            onClick={() => handleRemove(item.id)}
                                            className="saved-btn-remove"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

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

export default SavedItems;
