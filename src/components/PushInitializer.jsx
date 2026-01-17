import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { enablePushNotifications } from "../utils/pushClient";

const PushInitializer = () => {
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            enablePushNotifications().catch(err => console.error("Push init failed:", err));
        }
    }, [user]);

    return null;
};

export default PushInitializer;
