import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import "../styles/UserProfile.css";

const UserProfile = () => {
    const { userId } = useParams();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const isOwnProfile = currentUser?.id === userId;

    useEffect(() => {
        fetchUserProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const fetchUserProfile = async () => {
        setLoading(true);
        setError("");

        try {
            // Fetch user's listings to get seller info
            const { data: listingsData, error: listingsError } = await supabase
                .from("listings")
                .select(`
                    id,
                    title,
                    price,
                    condition,
                    created_at,
                    image_url,
                    seller_id,
                    listing_images (image_url, is_primary, sort_order)
                `)
                .eq("seller_id", userId)
                .eq("status", "active")
                .order("created_at", { ascending: false });

            if (listingsError) throw listingsError;

            setListings(listingsData || []);

            // Try to fetch public profile first
            let publicProfile = null;
            try {
                const { data, error } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", userId)
                    .single();
                if (!error && data) {
                    publicProfile = data;
                }
            } catch (err) {
                // Ignore error (tables might not exist)
            }

            if (publicProfile) {
                setProfile({
                    id: userId,
                    email: isOwnProfile ? currentUser.email : "Hidden",
                    created_at: listingsData?.[0]?.created_at || new Date().toISOString(),
                    user_metadata: {
                        full_name: publicProfile.full_name,
                        avatar_url: publicProfile.avatar_url,
                        bio: publicProfile.bio,
                        campus: publicProfile.campus,
                        student_id: publicProfile.student_id
                    }
                });
            } else if (isOwnProfile && currentUser) {
                setProfile({
                    id: currentUser.id,
                    email: currentUser.email,
                    created_at: currentUser.created_at,
                    user_metadata: currentUser.user_metadata || {},
                });
            } else {
                // Fallback for others if no public profile found
                setProfile({
                    id: userId,
                    email: "User",
                    created_at: listingsData?.[0]?.created_at || new Date().toISOString(),
                    user_metadata: {},
                });
            }
        } catch (err) {
            console.error("Error fetching profile:", err);
            setError("Could not load user profile");
        } finally {
            setLoading(false);
        }
    };

    const pickImage = (listing) => {
        const imgs = Array.isArray(listing?.listing_images) ? listing.listing_images : [];
        const primary = imgs.find((x) => x?.is_primary) || imgs[0];
        return primary?.image_url || listing?.image_url || "https://via.placeholder.com/300x200/f7f8f9/636e72?text=No+Image";
    };

    if (loading) {
        return (
            <div className="user-profile-container">
                <div className="user-profile-loading">Loading profile...</div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="user-profile-container">
                <div className="user-profile-error">
                    <h2>{error || "User not found"}</h2>
                    <button onClick={() => navigate(-1)} className="user-profile-btn">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const metadata = profile.user_metadata || {};
    const displayName = metadata.full_name || metadata.name || profile.email?.split("@")[0] || "User";
    const avatarUrl = metadata.avatar_url || null;
    const bio = metadata.bio || "";
    const joinDate = profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "";

    return (
        <div className="user-profile-container">
            <div className="user-profile-shell">
                {/* Profile Header */}
                <div className="user-profile-header">
                    <div className="user-profile-avatar-section">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={displayName} className="user-profile-avatar" />
                        ) : (
                            <div className="user-profile-avatar-placeholder">
                                {displayName.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>

                    <div className="user-profile-info">
                        <h1 className="user-profile-name">{displayName}</h1>
                        <p className="user-profile-email">{profile.email}</p>

                        {(metadata.campus || metadata.student_id) && (
                            <div className="user-profile-meta-tags">
                                {metadata.campus && <span className="user-profile-tag">{metadata.campus}</span>}
                                {metadata.student_id && <span className="user-profile-tag">{metadata.student_id}</span>}
                            </div>
                        )}

                        {bio && <div className="user-profile-bio-box">
                            <h3 className="user-profile-bio-label">About</h3>
                            <p className="user-profile-bio-text">{bio}</p>
                        </div>}

                        <div className="user-profile-meta">
                            <span>Member since {joinDate}</span>
                            <span>•</span>
                            <span>{listings.length} listing{listings.length !== 1 ? "s" : ""}</span>
                        </div>
                    </div>

                    <div className="user-profile-actions">
                        {isOwnProfile ? (
                            <button
                                onClick={() => navigate("/settings")}
                                className="user-profile-btn user-profile-btn--primary"
                            >
                                Edit Profile
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate("/messages")}
                                className="user-profile-btn user-profile-btn--primary"
                            >
                                Message
                            </button>
                        )}
                    </div>
                </div>

                {/* Listings Section */}
                <div className="user-profile-listings-section">
                    <h2 className="user-profile-section-title">
                        {isOwnProfile ? "Your Listings" : `${displayName}'s Listings`}
                    </h2>

                    {listings.length === 0 ? (
                        <div className="user-profile-empty">
                            {isOwnProfile ? (
                                <>
                                    <p>No active listings yet</p>
                                    <button
                                        onClick={() => navigate("/create-listing")}
                                        className="user-profile-btn"
                                    >
                                        Create Your First Listing
                                    </button>
                                </>
                            ) : (
                                <p>No listings available from this user</p>
                            )}
                        </div>
                    ) : (
                        <div className="user-profile-listings-grid">
                            {listings.map((listing) => {
                                const img = pickImage(listing);

                                return (
                                    <div
                                        key={listing.id}
                                        className="user-profile-listing-card"
                                        onClick={() => navigate(`/product/${listing.id}`)}
                                    >
                                        <div className="user-profile-listing-image">
                                            <img src={img} alt={listing.title} />
                                        </div>
                                        <div className="user-profile-listing-content">
                                            <h3 className="user-profile-listing-title">{listing.title}</h3>
                                            <div className="user-profile-listing-meta">
                                                <span className="user-profile-listing-price">${listing.price}</span>
                                                <span className="user-profile-listing-condition">{listing.condition}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
