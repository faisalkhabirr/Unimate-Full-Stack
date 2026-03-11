import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { enablePushNotifications } from "../utils/pushClient";
import Modal from "./Modal";

const PushInitializer = () => {
    const { user } = useAuth();
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        if (user && !localStorage.getItem("push_prompt_shown")) {
            // Check if already granted or denied
            if (Notification.permission === "default") {
                setShowPrompt(true);
            }
        }
    }, [user]);

    const handleConfirm = async () => {
        setShowPrompt(false);
        localStorage.setItem("push_prompt_shown", "true");
        try {
            await enablePushNotifications();
        } catch (err) {
            console.error("Push init failed:", err);
        }
    };

    const handleClose = () => {
        setShowPrompt(false);
        localStorage.setItem("push_prompt_shown", "true");
    };

    return (
        <Modal
            isOpen={showPrompt}
            onClose={handleClose}
            onConfirm={handleConfirm}
            title="Enable Notifications"
            message="Stay updated! Would you like to enable push notifications for new messages and deal updates?"
            confirmText="Yes, notify me"
            cancelText="Not now"
            type="info"
        />
    );
};

export default PushInitializer;
