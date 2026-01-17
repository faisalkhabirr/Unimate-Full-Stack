import { supabase } from "../supabaseClient";

function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    const output = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
    return output;
}

export async function enablePushNotifications(vapidPublicKey) {
    const key = vapidPublicKey || import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!key) {
        console.warn("No VAPID public key found.");
        return;
    }

    if (!("serviceWorker" in navigator)) throw new Error("Service Worker not supported");
    if (!("PushManager" in window)) throw new Error("Push not supported in this browser");
    if (!("Notification" in window)) throw new Error("Notifications not supported");

    const permission = await Notification.requestPermission();
    if (permission !== "granted") throw new Error("Notification permission denied");

    const reg = await navigator.serviceWorker.register("/sw.js");

    const existing = await reg.pushManager.getSubscription();
    const sub =
        existing ||
        (await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        }));

    const json = sub.toJSON();

    const { data: authUser } = await supabase.auth.getUser();
    const uid = authUser?.user?.id;
    if (!uid) throw new Error("Not logged in");

    const payload = {
        user_id: uid,
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
        user_agent: navigator.userAgent,
    };

    const { error } = await supabase
        .from("push_subscriptions")
        .upsert([payload], { onConflict: "endpoint" });

    if (error) throw error;

    return true;
}

export async function disablePushNotifications() {
    if (!("serviceWorker" in navigator)) return;

    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return;

    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;

    await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);

    await sub.unsubscribe();
}
