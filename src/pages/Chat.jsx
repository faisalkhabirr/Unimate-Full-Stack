import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { chatService } from "../services/chatService";
import "../styles/Chat.css";

const Chat = () => {
    const { chatId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [deal, setDeal] = useState(null);
    const [chatInfo, setChatInfo] = useState(null);
    const [sending, setSending] = useState(false);

    const isSeller = useMemo(() => {
        if (!user || !chatInfo) return false;
        return user.id === chatInfo.seller_id;
    }, [user, chatInfo]);

    // Scroll to bottom helper
    const scrollToBottom = (behavior = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    useEffect(() => {
        scrollToBottom("auto");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // ✅ Mark messages as read (makes inbox badge truly functional)
    const markChatAsRead = async () => {
        if (!user || !chatId) return;

        await supabase
            .from("messages")
            .update({ is_read: true })
            .eq("chat_id", chatId)
            .neq("sender_id", user.id)
            .eq("is_read", false);
    };

    useEffect(() => {
        if (!user) return;

        const fetchChatInfo = async () => {
            const { data: chat, error } = await supabase
                .from("chats")
                .select(
                    `
          id,
          created_at,
          buyer_id,
          seller_id,
          listings (id, title, price, image_url)
        `
                )
                .eq("id", chatId)
                .single();

            if (error) {
                console.error("Error fetching chat:", error);
                navigate("/marketplace");
                return;
            }

            setChatInfo(chat);
            setLoading(false);
        };

        const loadDeal = async () => {
            try {
                const dealData = await chatService.getDeal(chatId);
                setDeal(dealData);
            } catch (e) {
                // no deal => ignore
            }
        };

        const loadMessages = async () => {
            try {
                const msgs = await chatService.getMessages(chatId);
                setMessages(msgs || []);
                // ✅ after loading, mark as read
                await markChatAsRead();
            } catch (error) {
                console.error("Error loading messages:", error);
            }
        };

        fetchChatInfo();
        loadDeal();
        loadMessages();

        // ✅ Realtime (INSERT). Also mark read when new incoming arrives while you're in chat
        const channel = supabase
            .channel(`chat:${chatId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `chat_id=eq.${chatId}`,
                },
                async (payload) => {
                    const incoming = payload.new;

                    // prevent duplicates (sometimes happens if you also load messages)
                    setMessages((prev) => {
                        if (prev.some((m) => m.id === incoming.id)) return prev;
                        return [...prev, incoming];
                    });

                    // ✅ if it's not mine, instantly mark it read (since I'm currently viewing)
                    if (user && incoming.sender_id !== user.id) {
                        await markChatAsRead();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [chatId, user, navigate]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        const text = newMessage.trim();

        try {
            setSending(true);
            await chatService.sendMessage(chatId, user.id, text);
            setNewMessage("");
            // realtime will append it, but if realtime is slow, you can optimistically add:
            // setMessages(prev => [...prev, { id: `tmp-${Date.now()}`, text, sender_id: user.id, created_at: new Date().toISOString() }]);
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setSending(false);
        }
    };

    const handleMarkSold = async () => {
        if (!chatInfo || !user) return;
        if (!window.confirm("Are you sure you want to mark this item as SOLD to this buyer?")) return;

        try {
            const newDeal = await chatService.createDeal(
                chatId,
                chatInfo.listings.id,
                chatInfo.buyer_id,
                chatInfo.seller_id
            );

            setDeal(newDeal);

            await chatService.sendMessage(
                chatId,
                user.id,
                "🎉 I have marked this item as SOLD! Transaction complete."
            );
        } catch (error) {
            console.error("Error marking deal:", error);
            alert("Failed to mark deal");
        }
    };

    if (loading) return <div className="chat-loading">Loading conversation…</div>;

    return (
        <div className="chat-page">
            <div className="chat-container">
                {/* Header */}
                <div className="chat-header">
                    <button className="chat-back" onClick={() => navigate(-1)} aria-label="Back">
                        ←
                    </button>

                    <div className="chat-listing-info">
                        <div className="chat-thumb">
                            {chatInfo?.listings?.image_url ? (
                                <img src={chatInfo.listings.image_url} alt="Item" />
                            ) : (
                                <div className="chat-thumb-fallback" />
                            )}
                        </div>

                        <div className="chat-title-wrap">
                            <div className="chat-item-title">
                                {chatInfo?.listings?.title || "Item Chat"}
                            </div>
                            <div className="chat-subline">
                                <span className="chat-item-price">${chatInfo?.listings?.price}</span>
                                {deal && <span className="chat-sold-pill">Sold</span>}
                            </div>
                        </div>
                    </div>

                    {/* Deal Action Button */}
                    <div className="chat-actions">
                        {deal ? (
                            <div className="deal-status">✅ Sold</div>
                        ) : (
                            isSeller && (
                                <button onClick={handleMarkSold} className="btn-mark-sold">
                                    Mark as Sold
                                </button>
                            )
                        )}
                    </div>
                </div>

                {/* Messages Area */}
                <div className="chat-messages">
                    {messages.map((msg) => {
                        const isOwn = msg.sender_id === user.id;

                        return (
                            <div
                                key={msg.id}
                                className={`message-row ${isOwn ? "message-own" : "message-other"}`}
                            >
                                <div className="message-bubble">
                                    <div className="message-text">{msg.text}</div>
                                    <div className="message-time">
                                        {new Date(msg.created_at).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSend} className="chat-input-area">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message…"
                        className="chat-input"
                    />
                    <button type="submit" className="btn-send" disabled={sending || !newMessage.trim()}>
                        {sending ? "Sending…" : "Send"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Chat;
