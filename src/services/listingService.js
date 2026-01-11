import { supabase } from "../supabaseClient";
import { withGlobalLoader } from "../utils/globalLoader";

export const listingService = {
    async getById(id) {
        const { data, error } = await withGlobalLoader(
            supabase.from("listings").select("*").eq("id", id).single()
        );
        if (error) throw error;
        return data;
    },

    async getAll() {
        const { data, error } = await withGlobalLoader(
            supabase.from("listings").select("*").order("created_at", { ascending: false })
        );
        if (error) throw error;
        return data || [];
    },

    async getRelated({ id, category, product_type, limit = 5 }) {
        let query = supabase.from("listings").select("*").neq("id", id).limit(limit);

        if (category) query = query.eq("category", category);
        else if (product_type) query = query.eq("product_type", product_type);

        const { data, error } = await withGlobalLoader(
            query.order("created_at", { ascending: false })
        );

        if (error) throw error;
        return data || [];
    },
};
