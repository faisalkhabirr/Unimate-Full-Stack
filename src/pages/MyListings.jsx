import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/Modal";
import "../styles/MyListings.css";
import ListingCountdown from "../components/ListingCountdown";

const MyListings = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null); // for delete button loading

    // Modal state
    const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "info", onConfirm: null });

    useEffect(() => {
        if (user) fetchMyListings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const fetchMyListings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("listings")
                .select(`
                    *,
                    categories ( id, name, slug ),
                    listing_images ( image_url, is_primary, sort_order )
                `) // ✅ CHANGED: load category + listing images
                .eq("seller_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;

            // ✅ OPTIONAL BUT GOOD: sort listing_images by sort_order for stable primary display
            const normalized = (data || []).map((l) => ({
                ...l,
                listing_images: Array.isArray(l.listing_images)
                    ? [...l.listing_images].sort(
                        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
                    )
                    : [],
            }));

            setListings(normalized || []);
        } catch (error) {
            console.error("Error fetching listings:", error.message);
        } finally {
            setLoading(false);
        }
    };

    const money = useMemo(
        () =>
            new Intl.NumberFormat(undefined, {
                style: "currency",
                currency: "BDT",
                maximumFractionDigits: 0,
            }),
        []
    );

    const safeImg = (url) =>
        url && typeof url === "string" && url.trim().length > 0
            ? url
            : "https://via.placeholder.com/600x600?text=No+Image";

    // ✅ ADDED: pick primary image from listing_images first, fallback to legacy image_url
    const getPrimaryImage = (item) => {
        const imgs = Array.isArray(item?.listing_images) ? item.listing_images : [];
        const primary = imgs.find((x) => x?.is_primary) || imgs[0];
        return primary?.image_url || item?.image_url || "";
    };

    const handleDelete = (id) => {
        setModal({
            isOpen: true,
            title: "Confirm Deletion",
            message: "Are you sure you want to delete this listing? This action cannot be undone and the listing will be permanently removed.",
            type: "danger",
            confirmText: "Delete Listing",
            onConfirm: () => performDelete(id),
            onClose: () => setModal({ ...modal, isOpen: false })
        });
    };

    const performDelete = async (id) => {
        setModal({ ...modal, isOpen: false });
        setBusyId(id);
        try {
            const { error } = await supabase.from("listings").delete().eq("id", id);
            if (error) throw error;

            setListings((prev) => prev.filter((item) => item.id !== id));
        } catch (error) {
            setModal({
                isOpen: true,
                title: "Error",
                message: "Error deleting listing: " + error.message,
                type: "danger",
                confirmText: "Close",
                onConfirm: () => setModal({ ...modal, isOpen: false }),
                onClose: () => setModal({ ...modal, isOpen: false })
            });
        } finally {
            setBusyId(null);
        }
    };

    if (loading) {
        return (
            <div className="mylists-wrap">
                <div className="mylists-topbar">
                    <div className="mylists-titleblock">
                        <h1 className="mylists-title">My Listings</h1>
                        <p className="mylists-subtitle">Manage items you’ve posted for sale</p>
                    </div>

                    <button className="mylists-btn mylists-btn--primary" disabled>
                        + New Listing
                    </button>
                </div>

                <div className="mylists-loadingCard">
                    <div className="mylists-spinner" aria-hidden="true" />
                    <div>
                        <p className="mylists-loadingTitle">Loading your items…</p>
                        <p className="mylists-loadingSub">Just a moment</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mylists-wrap">
            <div className="mylists-topbar">
                <div className="mylists-titleblock">
                    <h1 className="mylists-title">My Listings</h1>
                    <p className="mylists-subtitle">
                        Edit, remove, or create new listings in seconds
                    </p>
                </div>

                <button
                    className="mylists-btn mylists-btn--primary"
                    onClick={() => navigate("/create-listing")}
                >
                    + New Listing
                </button>
            </div>

            {listings.length === 0 ? (
                <div className="mylists-empty">
                    <div className="mylists-emptyIcon" aria-hidden="true">
                        🛍️
                    </div>
                    <h2 className="mylists-emptyTitle">No listings yet</h2>
                    <p className="mylists-emptySub">
                        Create your first listing and start selling.
                    </p>

                    <div className="mylists-emptyActions">
                        <button
                            className="mylists-btn mylists-btn--primary"
                            onClick={() => navigate("/create-listing")}
                        >
                            Sell your first item
                        </button>
                        <button
                            className="mylists-btn mylists-btn--ghost"
                            onClick={() => navigate("/marketplace")}
                        >
                            Browse marketplace
                        </button>
                    </div>
                </div>
            ) : (
                <div className="mylists-grid">
                    {listings.map((item) => (
                        <article key={item.id} className="mylists-card">
                            <button
                                className="mylists-media"
                                onClick={() => navigate(`/product/${item.id}`)}
                                title="View listing"
                            >
                                <img
                                    // ✅ CHANGED: use primary listing_images first
                                    src={safeImg(getPrimaryImage(item))}
                                    alt={item.title}
                                    loading="lazy"
                                />
                            </button>

                            <div className="mylists-cardBody">
                                {/* Countdown Timer */}
                                <ListingCountdown createdAt={item.created_at} />

                                <div className="mylists-cardTop">
                                    <h3 className="mylists-cardTitle" title={item.title}>
                                        {item.title}
                                    </h3>

                                    <div className="mylists-price">
                                        {money.format(Number(item.price || 0))}
                                    </div>
                                </div>

                                {/* ✅ CHANGED: category comes from joined table "categories" */}
                                <div className="mylists-metaRow">
                                    {item?.categories?.name ? (
                                        <span className="mylists-pill">{item.categories.name}</span>
                                    ) : (
                                        <span className="mylists-pill mylists-pill--muted">
                                            Uncategorized
                                        </span>
                                    )}

                                    {item.condition ? (
                                        <span className="mylists-pill mylists-pill--soft">
                                            {item.condition}
                                        </span>
                                    ) : null}
                                </div>

                                <div className="mylists-actions">
                                    <button
                                        className="mylists-btn mylists-btn--soft"
                                        onClick={() => navigate(`/edit-listing/${item.id}`)}
                                    >
                                        Edit
                                    </button>

                                    <button
                                        className="mylists-btn mylists-btn--danger"
                                        onClick={() => handleDelete(item.id)}
                                        disabled={busyId === item.id}
                                    >
                                        {busyId === item.id ? "Deleting…" : "Delete"}
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
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

export default MyListings;
