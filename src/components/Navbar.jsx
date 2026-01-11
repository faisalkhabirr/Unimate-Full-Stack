import { Link, useNavigate } from 'react-router-dom';
import { User, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient'; // 🔔 Inbox
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"; // 🔔 Inbox
import { faEnvelope } from "@fortawesome/free-solid-svg-icons"; // 🔔 Inbox
import '../styles/Navbar.css';
import logo from "../assets/UnimateLogo1.png";

const Navbar = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    // 🔔 Inbox unread count
    const [unreadMsgs, setUnreadMsgs] = useState(0);

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
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // 🔔 Fetch unread inbox count (made reusable)
    const fetchUnread = async (uid) => {
        try {
            const { data: chats, error: chatErr } = await supabase
                .from("chats")
                .select("id")
                .or(`buyer_id.eq.${uid},seller_id.eq.${uid}`);

            if (chatErr) {
                console.error("Navbar unread: chat fetch error:", chatErr);
                setUnreadMsgs(0);
                return;
            }

            const chatIds = chats?.map(c => c.id) || [];

            if (chatIds.length === 0) {
                setUnreadMsgs(0);
                return;
            }

            const { count, error: msgErr } = await supabase
                .from("messages")
                .select("id", { count: "exact", head: true })
                .in("chat_id", chatIds)
                .neq("sender_id", uid)
                .eq("is_read", false);

            if (msgErr) {
                console.error("Navbar unread: message count error:", msgErr);
                setUnreadMsgs(0);
                return;
            }

            setUnreadMsgs(count || 0);
        } catch (e) {
            console.error("Navbar unread: unexpected error:", e);
            setUnreadMsgs(0);
        }
    };

    // 🔔 Initial fetch + realtime updates (this is the main fix)
    useEffect(() => {
        if (!user?.id) {
            setUnreadMsgs(0);
            return;
        }

        fetchUnread(user.id);

        const channel = supabase
            .channel(`navbar-unread:${user.id}`)
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "messages" },
                () => fetchUnread(user.id)
            )
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "messages" },
                () => fetchUnread(user.id)
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    // Close menu when resizing back to desktop
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
        navigate('/');
    };

    const closeMenu = () => setMenuOpen(false);

    return (
        <nav className={`navbar ${scrolled ? "navbar-scrolled" : ""}`}>
            <div className="nav-container">

                {/* Left: Logo */}
                <Link to={user ? "/marketplace" : "/"} className="nav-logo" onClick={closeMenu}>
                    <span className="logo-icon">
                        <img src={logo} alt="Unimates Logo" />
                    </span>
                </Link>

                {/* Middle: Desktop Links */}
                <ul className="nav-menu">
                    <li><Link to="/marketplace" className="nav-link">Market Place</Link></li>
                    <li><Link to="/create-listing" className="nav-link">Grow</Link></li>
                    <li><Link to="/my-listings" className="nav-link">My Listings</Link></li>
                </ul>

                {/* Right: Desktop Actions */}
                <div className="nav-actions">
                    {user ? (
                        <>
                            {/* 🔔 Inbox Button */}
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

                            {/* <button onClick={handleLogout} className="btn-outline">
                                Logout
                            </button> */}

                        </>
                    ) : (
                        <>
                            <Link to="/login" className="login-link" onClick={closeMenu}>Login</Link>
                            <Link to="/register" className="btn-primary" onClick={closeMenu}>Get started</Link>
                        </>
                    )}

                    {/* 3-bar button */}
                    <button
                        className="nav-burger"
                        aria-label="Open menu"
                        onClick={() => setMenuOpen(v => !v)}
                    >
                        {menuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu (unchanged) */}
            <div className={`nav-mobile ${menuOpen ? "nav-mobile--open" : ""}`}>
                <div className="nav-mobile-inner">

                    <Link to="/marketplace" className="nav-mobile-link" onClick={closeMenu}>
                        Market Place
                    </Link>
                    <Link to="/create-listing" className="nav-mobile-link" onClick={closeMenu}>
                        Grow
                    </Link>
                    <Link to="/my-listings" className="nav-mobile-link" onClick={closeMenu}>
                        My Listings
                    </Link>

                    {user ? (
                        <>
                            {/* <Link to="/profile" className="nav-mobile-link" onClick={closeMenu}>
                                Profile
                            </Link>
                            <button
                                className="nav-mobile-link nav-mobile-btn nav-mobile-logout"
                                onClick={handleLogout}
                            >
                                Logout
                            </button> */}
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="nav-mobile-link" onClick={closeMenu}>
                                Login
                            </Link>
                            <Link to="/register" className="nav-mobile-link nav-mobile-cta" onClick={closeMenu}>
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
