import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    const checkAdminStatus = async (userId) => {
        if (!userId) {
            setIsAdmin(false);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('admins')
                .select('id')
                .eq('user_id', userId)
                .single();
            
            setIsAdmin(!!data && !error);
        } catch {
            setIsAdmin(false);
        }
    };

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            checkAdminStatus(currentUser?.id);
            setLoading(false);
        });

        // Listen for changes (login, logout, refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            checkAdminStatus(currentUser?.id);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const value = {
        user,
        session,
        loading,
        isAdmin,
        signOut: () => supabase.auth.signOut(),
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
