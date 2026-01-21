import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const init = async () => {
            try {
                const { data } = await supabase.auth.getSession();
                if (!isMounted) return;

                setSession(data?.session ?? null);
                setUser(data?.session?.user ?? null);
            } catch (e) {
                // If mobile blocks storage/session read, we still want app to render.
                console.error("Auth init error:", e);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        init();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, nextSession) => {
            if (!isMounted) return;
            setSession(nextSession ?? null);
            setUser(nextSession?.user ?? null);
            setLoading(false);
        });

        return () => {
            isMounted = false;
            subscription?.unsubscribe();
        };
    }, []);

    const value = {
        user,
        session,
        loading,
        signOut: () => supabase.auth.signOut(),
    };

    // ✅ IMPORTANT CHANGE:
    // Always render children; ProtectedRoute will handle loading state.
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
