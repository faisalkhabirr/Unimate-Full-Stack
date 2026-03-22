import { Link, useNavigate, useLocation } from "react-router-dom";
import { User, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseClient";
import { notificationService } from "../services/notificationService";
import "../styles/Navbar.css";
import logo from "../assets/UnimateLogo1.png";

const Navbar = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    const [unreadMsgs, setUnreadMsgs] = useState(0);

    // Track previous unread count to detect new messages
    const prevUnreadRef = useRef(0);

    useEffect(() => {
        const onScroll = () => {
            const canScroll = document.documentElement.scrollHeight > window.innerHeight;
            if (!canScroll) {
                setScrolled(false);
                return;
            }
            setScrolled(window.scrollY > 10);
        };

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const fetchUnread = async (uid) => {
        try {
            // get all chats where user is buyer or seller
            const { data: chats, error: chatErr } = await supabase
                .from("chats")
                .select("id")
                .or(`buyer_id.eq.${uid},seller_id.eq.${uid}`);

            if (chatErr) {
                console.error("Unread count: chats error:", chatErr);
                setUnreadMsgs(0);
                return;
            }

            const chatIds = (chats || []).map((c) => c.id);
            if (chatIds.length === 0) {
                setUnreadMsgs(0);
                return;
            }

            // count unread messages not sent by me
            const { count, error: msgErr } = await supabase
                .from("messages")
                .select("id", { count: "exact", head: true })
                .in("chat_id", chatIds)
                .neq("sender_id", uid)
                .eq("is_read", false);

            if (msgErr) {
                console.error("Unread count: messages error:", msgErr);
                setUnreadMsgs(0);
                return;
            }

            setUnreadMsgs(count || 0);
        } catch (e) {
            console.error("Unread count unexpected:", e);
            setUnreadMsgs(0);
        }
    };

    // Request browser notification permission once when user is logged in
    useEffect(() => {
        if (user?.id) {
            notificationService.requestPermission();
        }
    }, [user?.id]);

    // Helper: fetch sender profile for a notification
    const getSenderName = async (senderId) => {
        try {
            const { data } = await supabase
                .from("profiles")
                .select("full_name")
                .eq("id", senderId)
                .single();
            return data?.full_name || "Someone";
        } catch {
            return "Someone";
        }
    };

    // realtime unread updater + browser push notifications
    useEffect(() => {
        if (!user?.id) {
            setUnreadMsgs(0);
            return;
        }

        fetchUnread(user.id);

        // Listen to INSERT and UPDATE on messages table
        const channel = supabase
            .channel(`navbar-unread:${user.id}`)
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "messages" },
                async (payload) => {
                    fetchUnread(user.id);

                    const msg = payload.new;
                    // Only notify if the message is from someone else
                    if (msg?.sender_id && msg.sender_id !== user.id) {
                        const senderName = await getSenderName(msg.sender_id);
                        const messageText = msg.media_url
                            ? "📷 Sent a photo"
                            : msg.text || "Sent you a message";
                        notificationService.showMessageNotification(
                            senderName,
                            messageText,
                            msg.chat_id
                        );
                    }
                }
            )
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "messages" },
                () => fetchUnread(user.id)
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [user?.id]);

    useEffect(() => {
        const onResize = () => {
            if (window.innerWidth > 900) setMenuOpen(false);
        };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    const handleLogout = async () => {
        await signOut();
        setMenuOpen(false);
        navigate("/");
    };

    const closeMenu = () => setMenuOpen(false);

    const handleLinkClick = (e, path) => {
        if (location.pathname === path) {
            e.preventDefault();
            window.location.reload();
        }
        closeMenu();
    };

    return (
        <nav className={`navbar ${scrolled ? "navbar-scrolled" : ""}`}>
            <div className="nav-container">
                <Link to={user ? "/marketplace" : "/"} className="nav-logo" onClick={(e) => handleLinkClick(e, user ? "/marketplace" : "/")}>
                    <span className="logo-icon">
                        <img src={logo} alt="Unimates Logo" />
                    </span>
                </Link>

                <ul className="nav-menu">
                    <li><Link to="/marketplace" className="nav-link" onClick={(e) => handleLinkClick(e, "/marketplace")}>Market Place</Link></li>
                    <li><Link to="/create-listing" className="nav-link" onClick={(e) => handleLinkClick(e, "/create-listing")}>Grow</Link></li>
                    <li><Link to="/my-listings" className="nav-link" onClick={(e) => handleLinkClick(e, "/my-listings")}>My Listings</Link></li>
                    {/* <li><Link to="/saved" className="nav-link" onClick={(e) => handleLinkClick(e, "/saved")}>Saved</Link></li> */}
                </ul>

                <div className="nav-actions">
                    {user ? (
                        <>
                            <button
                                className="pro-btn pro-btn--icon"
                                onClick={() => navigate("/messages")}
                                aria-label="Messages"
                            >
                                <svg
                                    className="messenger-icon"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M12 2C6.477 2 2 6.145 2 11.26c0 2.92 1.463 5.52 3.75 7.24V22l3.18-1.75c.96.27 1.99.42 3.07.42 5.523 0 10-4.145 10-9.26S17.523 2 12 2Z"
                                        stroke="currentColor"
                                        strokeWidth="1.7"
                                        strokeLinejoin="round"
                                    />
                                    <path
                                        d="M7.5 13.2l3.3-3.5 2.8 2.2 3.2-3.5"
                                        stroke="currentColor"
                                        strokeWidth="1.7"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>

                                {unreadMsgs > 0 && (
                                    <span className="pro-btn-badge">{unreadMsgs}</span>
                                )}
                            </button>

                            <Link
                                to="/profile"
                                className="btn-outline btn-icon"
                                aria-label="Profile"
                                onClick={closeMenu}
                            >
                                {user?.user_metadata?.avatar_url ? (
                                    <img
                                        src={user.user_metadata.avatar_url}
                                        alt="Profile"
                                        className="profile-avatar"
                                    />
                                ) : (
                                    <User size={20} />
                                )}
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="login-link" onClick={closeMenu}>Login</Link>
                            <Link to="/register" className="btn-primary" onClick={closeMenu}>Get started</Link>
                        </>
                    )}

                    <button
                        className="nav-burger"
                        aria-label="Open menu"
                        onClick={() => setMenuOpen((v) => !v)}
                    >
                        {menuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </div>

            <div className={`nav-mobile ${menuOpen ? "nav-mobile--open" : ""}`}>
                <div className="nav-mobile-inner">
                    <Link to="/marketplace" className="nav-mobile-link" onClick={(e) => handleLinkClick(e, "/marketplace")}>Market Place</Link>
                    <Link to="/create-listing" className="nav-mobile-link" onClick={(e) => handleLinkClick(e, "/create-listing")}>Grow</Link>
                    <Link to="/my-listings" className="nav-mobile-link" onClick={(e) => handleLinkClick(e, "/my-listings")}>My Listings</Link>
                    <Link to="/saved" className="nav-mobile-link" onClick={(e) => handleLinkClick(e, "/saved")}>Saved</Link>

                    {!user && (
                        <>
                            <Link to="/login" className="nav-mobile-link" onClick={(e) => handleLinkClick(e, "/login")}>Login</Link>
                            <Link to="/register" className="nav-mobile-link nav-mobile-cta" onClick={(e) => handleLinkClick(e, "/register")}>
                                Get started
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
