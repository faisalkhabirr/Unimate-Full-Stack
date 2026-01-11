import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import "../styles/MyListings.css";

const MyListings = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null); // for delete button loading

    useEffect(() => {
        if (user) fetchMyListings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const fetchMyListings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("listings")
                .select("*")
                .eq("seller_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setListings(data || []);
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
                currency: "USD",
                maximumFractionDigits: 0,
            }),
        []
    );

    const safeImg = (url) =>
        url && typeof url === "string" && url.trim().length > 0
            ? url
            : "https://via.placeholder.com/600x600?text=No+Image";

    const handleDelete = async (id) => {
        if (
            !window.confirm(
                "Are you sure you want to delete this listing? This action cannot be undone."
            )
        ) {
            return;
        }

        setBusyId(id);
        try {
            const { error } = await supabase.from("listings").delete().eq("id", id);
            if (error) throw error;

            setListings((prev) => prev.filter((item) => item.id !== id));
        } catch (error) {
            alert("Error deleting listing: " + error.message);
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
                                    src={safeImg(item.image_url)}
                                    alt={item.title}
                                    loading="lazy"
                                />
                            </button>

                            <div className="mylists-cardBody">
                                <div className="mylists-cardTop">
                                    <h3 className="mylists-cardTitle" title={item.title}>
                                        {item.title}
                                    </h3>

                                    <div className="mylists-price">
                                        {money.format(Number(item.price || 0))}
                                    </div>
                                </div>

                                {/* Optional meta row if you have fields like category/condition */}
                                <div className="mylists-metaRow">
                                    {item.category ? (
                                        <span className="mylists-pill">{item.category}</span>
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
        </div>
    );
};

export default MyListings;
