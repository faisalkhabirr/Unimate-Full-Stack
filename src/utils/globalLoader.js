let activeRequests = 0;

export async function withGlobalLoader(promise) {
    try {
        activeRequests++;
        document.body.classList.add("global-loading");
        const result = await promise;
        return result;
    } finally {
        activeRequests--;
        if (activeRequests <= 0) {
            activeRequests = 0;
            document.body.classList.remove("global-loading");
        }
    }
}
