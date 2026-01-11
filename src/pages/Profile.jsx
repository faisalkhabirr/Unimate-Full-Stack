import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import "../styles/Profile.css";

// ✅ Professional icons (Font Awesome - solid)
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faStore,
    faHandshake,
    faEnvelope,
    faHeart,
    faPlus,
    faUserPen,
    faShieldHalved,
    faRightFromBracket
} from "@fortawesome/free-solid-svg-icons";

const Profile = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);

    const [unreadMsgs, setUnreadMsgs] = useState(0);
    const [listingCount, setListingCount] = useState(0);
    const [purchaseCount, setPurchaseCount] = useState(0);
    const [salesCount, setSalesCount] = useState(0);

    const displayName = useMemo(() => {
        const meta = user?.user_metadata || {};
        return (
            meta.full_name ||
            meta.name ||
            (user?.email ? user.email.split("@")[0] : "User")
        );
    }, [user]);

    const joinedDate = useMemo(() => {
        try {
            return user?.created_at ? new Date(user.created_at).toLocaleDateString() : "";
        } catch {
            return "";
        }
    }, [user]);

    const avatarLetter = useMemo(() => {
        const base = (displayName || user?.email || "U").trim();
        return base.charAt(0).toUpperCase();
    }, [displayName, user]);

    const handleLogout = async () => {
        try {
            await signOut();
            navigate("/");
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    useEffect(() => {
        const fetchCounts = async () => {
            if (!user) return;
            setLoading(true);

            // NOTE: If your table/columns are different, rename them here.
            try {
                const { count } = await supabase
                    .from("messages")
                    .select("*", { count: "exact", head: true })
                    .eq("recipient_id", user.id)
                    .eq("is_read", false);
                setUnreadMsgs(count || 0);
            } catch {
                setUnreadMsgs(0);
            }

            try {
                const { count } = await supabase
                    .from("listings")
                    .select("*", { count: "exact", head: true })
                    .eq("seller_id", user.id);
                setListingCount(count || 0);
            } catch {
                setListingCount(0);
            }

            try {
                const { count } = await supabase
                    .from("deals")
                    .select("*", { count: "exact", head: true })
                    .eq("buyer_id", user.id);
                setPurchaseCount(count || 0);
            } catch {
                setPurchaseCount(0);
            }

            try {
                const { count } = await supabase
                    .from("deals")
                    .select("*", { count: "exact", head: true })
                    .eq("seller_id", user.id);
                setSalesCount(count || 0);
            } catch {
                setSalesCount(0);
            }

            setLoading(false);
        };

        fetchCounts();
    }, [user]);

    if (!user) return null;

    // Optional fields if you store them in user_metadata
    const meta = user.user_metadata || {};
    const phone = meta.phone || "Not added";
    const address = meta.address || "Not added";
    const campus = meta.campus || "Not added";
    const studentId = meta.student_id || "Not added";

    return (
        <div className="profile-wrap">
            <div className="profile-shell">
                {/* Header / Hero */}
                <section className="pro-card pro-hero">
                    <div className="pro-hero__left">
                        <div className="pro-avatar" aria-hidden="true">
                            {avatarLetter}
                        </div>

                        <div className="pro-identity">
                            <div className="pro-name-row">
                                <h1 className="pro-name">{displayName}</h1>

                                {unreadMsgs > 0 ? (
                                    <span className="pro-pill pro-pill--warn">
                                        {unreadMsgs} new message{unreadMsgs === 1 ? "" : "s"}
                                    </span>
                                ) : (
                                    <span className="pro-pill">All caught up</span>
                                )}
                            </div>

                            <p className="pro-email">{user.email}</p>
                            <p className="pro-meta">
                                Joined <span className="pro-dot">•</span> {joinedDate}
                            </p>
                        </div>
                    </div>

                    <div className="pro-hero__right">
                        <button
                            className="pro-btn pro-btn--primary"
                            onClick={() => navigate("/messages")}
                        >
                            <FontAwesomeIcon icon={faEnvelope} />
                            Inbox
                            <span className="pro-btn-badge">{unreadMsgs}</span>
                        </button>

                        <button
                            className="pro-btn pro-btn--ghost"
                            onClick={() => navigate("/create-listing")}
                        >
                            <FontAwesomeIcon icon={faPlus} />
                            Create Listing
                        </button>
                    </div>
                </section>

                {/* Stats */}
                <section className="pro-stats">
                    <button className="pro-stat" onClick={() => navigate("/messages")}>
                        <span className="pro-stat__label">Unread</span>
                        <span className="pro-stat__value">{loading ? "—" : unreadMsgs}</span>
                        <span className="pro-stat__hint">Messages</span>
                    </button>

                    <button className="pro-stat" onClick={() => navigate("/my-listings")}>
                        <span className="pro-stat__label">Listings</span>
                        <span className="pro-stat__value">{loading ? "—" : listingCount}</span>
                        <span className="pro-stat__hint">Your items</span>
                    </button>

                    <button className="pro-stat" onClick={() => navigate("/my-deals")}>
                        <span className="pro-stat__label">Purchases</span>
                        <span className="pro-stat__value">{loading ? "—" : purchaseCount}</span>
                        <span className="pro-stat__hint">Orders</span>
                    </button>

                    <button className="pro-stat" onClick={() => navigate("/my-deals")}>
                        <span className="pro-stat__label">Sales</span>
                        <span className="pro-stat__value">{loading ? "—" : salesCount}</span>
                        <span className="pro-stat__hint">Completed</span>
                    </button>
                </section>

                {/* Main Grid */}
                <div className="pro-grid">
                    {/* Quick actions */}
                    <section className="pro-card">
                        <div className="pro-card__head">
                            <h2 className="pro-card__title">Quick actions</h2>
                            <p className="pro-card__sub">Manage your marketplace activity</p>
                        </div>

                        <div className="pro-actions">
                            <button className="pro-action" onClick={() => navigate("/my-listings")}>
                                <div className="pro-action__text">
                                    <div className="pro-action__title">My Listings</div>
                                    <div className="pro-action__sub">Edit, delete, boost items</div>
                                </div>
                                <div className="pro-action__chev">›</div>
                            </button>

                            <button className="pro-action" onClick={() => navigate("/my-deals")}>
                                <div className="pro-action__text">
                                    <div className="pro-action__title">My Deals</div>
                                    <div className="pro-action__sub">Purchases & sales history</div>
                                </div>
                                <div className="pro-action__chev">›</div>
                            </button>

                            <button className="pro-action" onClick={() => navigate("/messages")}>
                                <div className="pro-action__text">
                                    <div className="pro-action__title">Messages</div>
                                    <div className="pro-action__sub">
                                        Unread: <strong>{loading ? "—" : unreadMsgs}</strong>
                                    </div>
                                </div>
                                <div className="pro-action__chev">›</div>
                            </button>

                            <button className="pro-action" onClick={() => navigate("/saved")}>
                                <div className="pro-action__text">
                                    <div className="pro-action__title">Saved Items</div>
                                    <div className="pro-action__sub">Wishlist & bookmarks</div>
                                </div>
                                <div className="pro-action__chev">›</div>
                            </button>
                        </div>

                    </section>

                    {/* Account details */}
                    <section className="pro-card">
                        <div className="pro-card__head">
                            <h2 className="pro-card__title">Account details</h2>
                            <p className="pro-card__sub">Your identity, delivery, and security basics</p>
                        </div>

                        <div className="pro-kv">
                            <div className="pro-kv__row">
                                <span className="pro-kv__k">Full name</span>
                                <span className="pro-kv__v">{displayName}</span>
                            </div>
                            <div className="pro-kv__row">
                                <span className="pro-kv__k">Email</span>
                                <span className="pro-kv__v">{user.email}</span>
                            </div>
                            <div className="pro-kv__row">
                                <span className="pro-kv__k">Phone</span>
                                <span className="pro-kv__v">{phone}</span>
                            </div>
                            <div className="pro-kv__row">
                                <span className="pro-kv__k">Address</span>
                                <span className="pro-kv__v">{address}</span>
                            </div>
                            <div className="pro-kv__row">
                                <span className="pro-kv__k">Campus</span>
                                <span className="pro-kv__v">{campus}</span>
                            </div>
                            <div className="pro-kv__row">
                                <span className="pro-kv__k">Student ID</span>
                                <span className="pro-kv__v">{studentId}</span>
                            </div>
                        </div>

                        <div className="pro-inline-actions">
                            <button className="pro-btn pro-btn--soft" onClick={() => navigate("/settings")}>
                                <FontAwesomeIcon icon={faUserPen} />
                                Edit profile
                            </button>

                            <button className="pro-btn pro-btn--soft" onClick={() => navigate("/security")}>
                                <FontAwesomeIcon icon={faShieldHalved} />
                                Security
                            </button>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <section className="pro-footer">
                    <button className="pro-btn pro-btn--danger" onClick={handleLogout}>
                        <FontAwesomeIcon icon={faRightFromBracket} />
                        Sign out
                    </button>
                </section>
            </div>
        </div>
    );
};

export default Profile;
