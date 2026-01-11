import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import "../styles/Messages.css";

const Messages = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) fetchConversations();
    }, [user]);

    const fetchConversations = async () => {
        try {
            const { data: chats, error } = await supabase
                .from("chats")
                .select(`
          id,
          created_at,
          buyer_id,
          seller_id,
          listing:listings (
            title,
            image_url,
            price
          )
        `)
                .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
                .order("created_at", { ascending: false });

            if (error) throw error;

            const enriched = await Promise.all(
                (chats || []).map(async (chat) => {
                    const { data: lastMessage } = await supabase
                        .from("messages")
                        .select("text, created_at, sender_id, is_read")
                        .eq("chat_id", chat.id)
                        .order("created_at", { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    const { count: unreadCount } = await supabase
                        .from("messages")
                        .select("id", { count: "exact", head: true })
                        .eq("chat_id", chat.id)
                        .neq("sender_id", user.id)
                        .eq("is_read", false);

                    return {
                        ...chat,
                        lastMessage,
                        unreadCount: unreadCount || 0,
                        isUnread: (unreadCount || 0) > 0
                    };
                })
            );

            setConversations(enriched);
        } catch (err) {
            console.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Loading messages…</div>;

    return (
        <div className="messages-container">
            <h1 className="messages-header">Messages</h1>

            {conversations.length === 0 ? (
                <div className="empty-state">
                    <p>No messages yet.</p>
                    <p className="empty-hint">
                        Browse listings to start chatting.
                    </p>
                    <button onClick={() => navigate("/marketplace")}>
                        Browse Marketplace
                    </button>
                </div>
            ) : (
                <div className="conversations-list">
                    {conversations.map((conv) => (
                        <div
                            key={conv.id}
                            className={`conversation-card ${conv.isUnread ? "unread" : ""}`}
                            onClick={() => navigate(`/chat/${conv.id}`)}
                        >
                            <div className="conv-image">
                                {conv.listing && (
                                    <img
                                        src={conv.listing.image_url}
                                        alt={conv.listing.title}
                                    />
                                )}
                            </div>

                            <div className="conv-content">
                                <div className="conv-header">
                                    <h3>{conv.listing?.title || "Unknown Item"}</h3>
                                    {conv.isUnread && (
                                        <span className="unread-badge">
                                            {conv.unreadCount}
                                        </span>
                                    )}
                                </div>

                                <p className="conv-preview">
                                    {conv.lastMessage?.text || "No messages yet"}
                                </p>

                                <span className="conv-time">
                                    {new Date(
                                        conv.lastMessage?.created_at || conv.created_at
                                    ).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Messages;
