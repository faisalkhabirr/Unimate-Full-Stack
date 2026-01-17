import { supabase } from "../supabaseClient";

export const listingService = {
    async getById(id) {
        if (!id) throw new Error("Missing listing id");

        const { data, error } = await supabase
            .from("listings")
            .select(`
        *,
        categories ( id, name ),
        listing_images ( id, image_url, is_primary, sort_order ),
        listing_videos ( id, video_url, sort_order )
      `)
            .eq("id", id)
            .single();

        if (error) throw error;
        return data;
    },

    async getRelated({ id, category_id, limit = 5 }) {
        // related by category_id, excluding current listing
        let q = supabase
            .from("listings")
            .select(`
        *,
        categories ( id, name ),
        listing_images ( id, image_url, is_primary, sort_order )
      `)
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .limit(limit);

        if (category_id) q = q.eq("category_id", category_id);
        if (id) q = q.neq("id", id);

        const { data, error } = await q;
        if (error) throw error;
        return data || [];
    },

    // Optional: if you use Marketplace page filters
    async list({ limit = 20, search = "", category_id = null } = {}) {
        let q = supabase
            .from("listings")
            .select(`
        *,
        categories ( id, name ),
        listing_images ( id, image_url, is_primary, sort_order )
      `)
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .limit(limit);

        if (search?.trim()) q = q.ilike("title", `%${search.trim()}%`);
        if (category_id) q = q.eq("category_id", category_id);

        const { data, error } = await q;
        if (error) throw error;
        return data || [];
    },
};
