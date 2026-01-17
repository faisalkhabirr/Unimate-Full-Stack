self.addEventListener("push", (event) => {
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch (e) { }

    const title = data.title || "New message";
    const body = data.body || "You received a new message.";
    const url = data.url || "/messages";

    const options = {
        body,
        data: { url },
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const url = event.notification?.data?.url || "/messages";

    event.waitUntil(
        (async () => {
            const allClients = await clients.matchAll({ type: "window", includeUncontrolled: true });
            for (const client of allClients) {
                if ("focus" in client) {
                    client.focus();
                    client.navigate(url);
                    return;
                }
            }
            if (clients.openWindow) return clients.openWindow(url);
        })()
    );
});
