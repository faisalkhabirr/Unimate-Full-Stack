let pending = 0;
const listeners = new Set();

export function loaderStart() {
    pending += 1;
    emit();
}

export function loaderEnd() {
    pending = Math.max(0, pending - 1);
    emit();
}

export function onLoaderChange(fn) {
    listeners.add(fn);
    fn(pending > 0); // initial
    return () => listeners.delete(fn);
}

function emit() {
    const isLoading = pending > 0;
    listeners.forEach((fn) => fn(isLoading));
}

// Wrap any promise (supabase call) to auto toggle loader
export async function withGlobalLoader(promise) {
    loaderStart();
    try {
        return await promise;
    } finally {
        loaderEnd();
    }
}
