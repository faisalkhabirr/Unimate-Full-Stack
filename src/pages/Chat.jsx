import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { chatService } from "../services/chatService";
import Modal from "../components/Modal";
import "../styles/Chat.css";

const pickImage = (image_url) => {
    if (!image_url) return null;
    try {
        const parsed = JSON.parse(image_url);
        if (Array.isArray(parsed)) return parsed[0] || null;
    } catch {
        // ignore JSON parse errors
    }
    return image_url;
};

const Chat = () => {
    const { chatId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [deal, setDeal] = useState(null);
    const [chatInfo, setChatInfo] = useState(null);
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Modal state
    const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "info", onConfirm: null });

    const isSeller = useMemo(() => {
        if (!user || !chatInfo) return false;
        return user.id === chatInfo.seller_id;
    }, [user, chatInfo]);

    const otherUserId = useMemo(() => {
        if (!user || !chatInfo) return null;
        return isSeller ? chatInfo.buyer_id : chatInfo.seller_id;
    }, [user, chatInfo, isSeller]);

    const scrollToBottom = (behavior = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    useEffect(() => {
        scrollToBottom("auto");
        // initial load scroll
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // ✅ Mark as read (also helps navbar badge drop instantly)
    const markChatAsRead = async () => {
        if (!user || !chatId) return;

        await supabase
            .from("messages")
            .update({ is_read: true })
            .eq("chat_id", chatId)
            .neq("sender_id", user.id)
            .eq("is_read", false);
    };

    const [profiles, setProfiles] = useState({}); // map of userId -> profile data

    useEffect(() => {
        if (!user) return;

        const fetchChatInfo = async () => {
            const { data: chat, error } = await supabase
                .from("chats")
                .select(`
                  id,
                  created_at,
                  buyer_id,
                  seller_id,
                  listings (id, title, price, image_url)
                `)
                .eq("id", chatId)
                .single();

            if (error) {
                console.error("Error fetching chat:", error);
                navigate("/marketplace");
                return;
            }

            setChatInfo(chat);

            // Fetch profiles for both parties
            const profileIds = [chat.buyer_id, chat.seller_id];
            try {
                const { data: profileList } = await supabase
                    .from("profiles")
                    .select("id, full_name, avatar_url")
                    .in("id", profileIds);

                if (profileList) {
                    const profileMap = {};
                    profileList.forEach(p => { profileMap[p.id] = p; });
                    setProfiles(profileMap);
                }
            } catch (err) {
                console.warn("Could not load profiles for avatars:", err);
            }

            setLoading(false);
        };

        const loadDeal = async () => {
            try {
                const dealData = await chatService.getDeal(chatId);
                setDeal(dealData);
            } catch {
                // ignore if no deal
            }
        };

        const loadMessages = async () => {
            try {
                const msgs = await chatService.getMessages(chatId);
                setMessages(msgs || []);
                await markChatAsRead();
            } catch (error) {
                console.error("Error loading messages:", error);
            }
        };

        fetchChatInfo();
        loadDeal();
        loadMessages();

        // ✅ Realtime new messages
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

                    setMessages((prev) => {
                        if (prev.some((m) => m.id === incoming.id)) return prev;
                        return [...prev, incoming];
                    });

                    // if it's not mine, mark read instantly while viewing
                    if (incoming.sender_id !== user.id) {
                        await markChatAsRead();
                    }
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "messages",
                    filter: `chat_id=eq.${chatId}`,
                },
                (payload) => {
                    setMessages((prev) =>
                        prev.map((msg) => (msg.id === payload.new.id ? payload.new : msg))
                    );
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "DELETE",
                    schema: "public",
                    table: "messages",
                    filter: `chat_id=eq.${chatId}`,
                },
                (payload) => {
                    setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id));
                }
            )
            .subscribe();

        // ✅ When tab becomes active again, mark read again (good for mobile/alt-tab)
        const onVis = () => {
            if (document.visibilityState === "visible") markChatAsRead();
        };
        document.addEventListener("visibilitychange", onVis);

        return () => {
            supabase.removeChannel(channel);
            document.removeEventListener("visibilitychange", onVis);
        };
    }, [chatId, user, navigate]);

    const handleSendText = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        const text = newMessage.trim();

        try {
            setSending(true);
            await chatService.sendMessage(chatId, user.id, text);
            setNewMessage("");
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setSending(false);
        }
    };

    const handlePickImage = () => {
        if (uploading) return;
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = ""; // allow selecting same file again later

        if (!file || !user) return;

        const isVideo = file.type.startsWith("video/");
        const isImage = file.type.startsWith("image/");

        if (!isImage && !isVideo) {
            setModal({
                isOpen: true,
                title: "Invalid File Type",
                message: "Only image and video files are allowed.",
                type: "danger",
                confirmText: "Close",
                onConfirm: () => setModal({ ...modal, isOpen: false }),
                onClose: () => setModal({ ...modal, isOpen: false })
            });
            return;
        }

        // Limits: 6MB for images, 20MB for videos
        const maxMB = isVideo ? 20 : 6;
        if (file.size > maxMB * 1024 * 1024) {
            setModal({
                isOpen: true,
                title: "File Too Large",
                message: `${isVideo ? "Video" : "Image"} is too large. Max allowed size is ${maxMB}MB.`,
                type: "danger",
                confirmText: "Close",
                onConfirm: () => setModal({ ...modal, isOpen: false }),
                onClose: () => setModal({ ...modal, isOpen: false })
            });
            return;
        }

        try {
            setUploading(true);

            // 1) upload to storage (Bucket: chat-media)
            const publicUrl = await chatService.uploadChatImage(file, chatId, user.id);

            // 2) insert message row with media_url
            const mediaType = isVideo ? "video" : "image";
            await chatService.sendMediaMessage(chatId, user.id, publicUrl, mediaType);

            console.log("Chat media uploaded successfully:", publicUrl);
        } catch (err) {
            console.error("Upload/send media error:", err);
            setModal({
                isOpen: true,
                title: "Upload Error",
                message: err.message || "Failed to upload file. Please check your connection and try again.",
                type: "danger",
                confirmText: "Close",
                onConfirm: () => setModal({ ...modal, isOpen: false }),
                onClose: () => setModal({ ...modal, isOpen: false })
            });
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteMessage = async (msgId) => {
        if (!window.confirm("Delete this message?")) return;
        try {
            await chatService.deleteMessage(msgId, user.id);
            // the realtime subscription handles UI update
        } catch (error) {
            console.error("Failed to delete message:", error);
            setModal({
                isOpen: true,
                title: "Error",
                message: "Could not delete this message. You might not have permission to delete it.",
                type: "danger",
                confirmText: "Close",
                onConfirm: () => setModal({ ...modal, isOpen: false }),
                onClose: () => setModal({ ...modal, isOpen: false })
            });
        }
    };

    const handleMarkSold = () => {
        if (!chatInfo || !user) return;
        setModal({
            isOpen: true,
            title: "Confirm Sale",
            message: "Are you sure you want to mark this item as SOLD? This action will notify the buyer and update the listing status.",
            type: "info",
            confirmText: "Confirm Sale",
            cancelText: "Not yet",
            onConfirm: performMarkSold,
            onClose: () => setModal({ ...modal, isOpen: false })
        });
    };

    const performMarkSold = async () => {
        setModal({ ...modal, isOpen: false });
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
            setModal({
                isOpen: true,
                title: "Error",
                message: "Failed to mark item as sold. Please try again later.",
                type: "danger",
                confirmText: "Close",
                onConfirm: () => setModal({ ...modal, isOpen: false }),
                onClose: () => setModal({ ...modal, isOpen: false })
            });
        }
    };

    if (loading) return <div className="chat-loading">Loading conversation…</div>;

    const listingThumb = pickImage(chatInfo?.listings?.image_url);

    return (
        <div className="chat-page">
            <div className="chat-shell">
                {/* Header */}
                <div className="chat-header">
                    <button className="chat-back" onClick={() => navigate(-1)} aria-label="Back">
                        ←
                    </button>

                    {/* Click title area → go product page */}
                    <div
                        className="chat-listing"
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                            const id = chatInfo?.listings?.id;
                            if (id) navigate(`/product/${id}`);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                const id = chatInfo?.listings?.id;
                                if (id) navigate(`/product/${id}`);
                            }
                        }}
                        title="Open product"
                    >
                        <div className="chat-thumb">
                            {listingThumb ? (
                                <img src={listingThumb} alt="Item" />
                            ) : (
                                <div className="chat-thumb-fallback" />
                            )}
                        </div>

                        <div className="chat-title-wrap">
                            <div className="chat-item-title">
                                {chatInfo?.listings?.title || "Item Chat"}
                            </div>
                            <div className="chat-subline">
                                <span className="chat-item-price">
                                    {chatInfo?.listings?.price != null ? `${chatInfo.listings.price} BDT` : ""}
                                </span>
                                {deal && <span className="chat-sold-pill">Sold</span>}
                            </div>
                        </div>
                    </div>

                    {/* Clickable participant info */}
                    {otherUserId && (
                        <button
                            className="chat-participant-btn"
                            onClick={() => navigate(`/user/${otherUserId}`)}
                            title="View profile"
                        >
                            <div className="chat-participant-avatar">
                                {profiles[otherUserId]?.avatar_url ? (
                                    <img
                                        src={profiles[otherUserId].avatar_url}
                                        alt="Avatar"
                                        className="chat-header-avatar-img"
                                    />
                                ) : (
                                    (isSeller ? "B" : "S")
                                )}
                            </div>
                            <span>
                                {profiles[otherUserId]?.full_name || (isSeller ? "Buyer" : "Seller")}
                            </span>
                        </button>
                    )}

                    <div className="chat-actions">
                        {deal && <div className="deal-status">✅ Sold</div>}
                    </div>
                </div>

                {/* Sell Banner - Only shown to seller if not sold yet */}
                {isSeller && !deal && (
                    <div className="chat-sell-banner">
                        <div className="chat-sell-banner__content">
                            <span>Ready to complete this transaction?</span>
                            <button onClick={handleMarkSold} className="btn-mark-sold">
                                Mark as Sold
                            </button>
                        </div>
                    </div>
                )}

                {/* Messages */}
                <div className="chat-messages">
                    {messages.map((msg) => {
                        const isOwn = msg.sender_id === user.id;
                        const isImage = msg.media_type === "image" && msg.media_url;
                        const isVideo = msg.media_type === "video" && msg.media_url;
                        const isMedia = isImage || isVideo;
                        const senderProfile = profiles[msg.sender_id];

                        return (
                            <div key={msg.id} className={`message-row ${isOwn ? "own" : "other"}`}>
                                {!isOwn && (
                                    <div className="message-avatar-wrap">
                                        {senderProfile?.avatar_url ? (
                                            <img src={senderProfile.avatar_url} alt="" className="message-avatar" />
                                        ) : (
                                            <div className="message-avatar-fallback">
                                                {(senderProfile?.full_name || "U").charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className={`message-bubble ${isMedia ? "media" : ""} ${msg.is_deleted ? "deleted" : ""}`}>
                                    {isOwn && !msg.is_deleted && (
                                        <button 
                                            className="btn-delete-msg" 
                                            onClick={() => handleDeleteMessage(msg.id)}
                                            title="Delete message"
                                            aria-label="Delete message"
                                        >
                                            ×
                                        </button>
                                    )}
                                    {isImage ? (
                                        <a
                                            className="msg-media-link"
                                            href={msg.media_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            title="Open image"
                                        >
                                            <img className="msg-media" src={msg.media_url} alt="Sent media" />
                                        </a>
                                    ) : isVideo ? (
                                        <div className="msg-video-wrap">
                                            <video
                                                className="msg-video"
                                                src={msg.media_url}
                                                controls
                                                preload="metadata"
                                            />
                                        </div>
                                    ) : (
                                        <div className="message-text">
                                            {msg.is_deleted ? <em>This message was deleted</em> : msg.text}
                                        </div>
                                    )}

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

                {/* Input */}
                <form onSubmit={handleSendText} className="chat-input-area">
                    <input
                        type="file"
                        accept="image/*,video/*"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        style={{ display: "none" }}
                    />

                    <button
                        type="button"
                        className="btn-attach"
                        onClick={handlePickImage}
                        disabled={uploading}
                        title="Send image"
                        aria-label="Send image"
                    >
                        {uploading ? "…" : "📷"}
                    </button>

                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message…"
                        className="chat-input"
                    />

                    <button
                        type="submit"
                        className="btn-send"
                        disabled={sending || uploading || !newMessage.trim()}
                    >
                        {sending ? "Sending…" : "Send"}
                    </button>
                </form>
            </div>

            <Modal
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                onConfirm={modal.onConfirm}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                confirmText={modal.confirmText}
                cancelText={modal.cancelText}
            />
        </div>
    );
};

export default Chat;
