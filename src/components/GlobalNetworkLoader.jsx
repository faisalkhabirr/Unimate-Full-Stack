import { useEffect, useState } from "react";
import FullPageLoader from "./FullPageLoader";
import { onLoaderChange } from "../utils/globalLoader";

export default function GlobalNetworkLoader() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        let t;

        const unsub = onLoaderChange((isLoading) => {
            clearTimeout(t);

            // anti-flicker: only show if it lasts longer than 200ms
            if (isLoading) t = setTimeout(() => setShow(true), 200);
            else setShow(false);
        });

        return () => {
            clearTimeout(t);
            unsub();
        };
    }, []);

    if (!show) return null;
    return <FullPageLoader label="Loading..." />;
}
