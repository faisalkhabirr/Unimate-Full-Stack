/**
 * Browser Notification Service
 * Handles requesting permission and showing browser push notifications
 * Works even when the user is on another tab.
 */

let permissionRequested = false;

export const notificationService = {
    /**
     * Request browser notification permission (call once on login).
     * Returns: "granted" | "denied" | "default"
     */
    async requestPermission() {
        if (!("Notification" in window)) return "unsupported";
        if (Notification.permission === "granted") return "granted";
        if (permissionRequested) return Notification.permission;

        permissionRequested = true;
        try {
            const result = await Notification.requestPermission();
            return result;
        } catch (e) {
            console.warn("Notification.requestPermission() failed:", e);
            return "denied";
        }
    },

    /**
     * Show a browser notification.
     * @param {string} title  - Notification title (e.g. sender name)
     * @param {string} body   - Message preview text
     * @param {object} options - Extra options (icon, tag, onClick, etc.)
     */
    show(title, body, options = {}) {
        if (!("Notification" in window)) return;
        if (Notification.permission !== "granted") return;

        const { onClick, icon, tag } = options;

        const notification = new Notification(title, {
            body: body?.slice(0, 120) || "",
            icon: icon || "/favicon.png",
            tag: tag || "unimate-message",
            renotify: true,
            requireInteraction: false,
        });

        notification.onclick = () => {
            window.focus();
            if (typeof onClick === "function") onClick();
            notification.close();
        };

        // Auto-close after 6 seconds
        setTimeout(() => notification.close(), 6000);
    },

    /**
     * Show a "new message" notification.
     * @param {string} senderName  - Display name of the sender
     * @param {string} messageText - The message content
     * @param {string|null} chatId - Optional chat ID to navigate to on click
     */
    showMessageNotification(senderName, messageText, chatId = null) {
        const title = `💬 ${senderName || "New message"}`;
        const body = messageText || "You have a new message";

        this.show(title, body, {
            tag: `chat-${chatId}`,
            onClick: () => {
                if (chatId) {
                    window.location.href = `/chat/${chatId}`;
                } else {
                    window.location.href = "/messages";
                }
            },
        });
    },
};
