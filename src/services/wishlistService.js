import { supabase } from "../supabaseClient";

export const wishlistService = {
    /**
     * Get all listing IDs the user has saved.
     * Returns a Set<string> of listing_id values.
     */
    async getUserSavedIds(userId) {
        if (!userId) return new Set();

        const { data, error } = await supabase
            .from("saved_listings")
            .select("listing_id")
            .eq("user_id", userId);

        if (error) {
            console.error("Error fetching saved ids:", error);
            return new Set();
        }

        return new Set((data || []).map((row) => row.listing_id));
    },

    /**
     * Check if a specific listing is saved by the user.
     */
    async isSaved(userId, listingId) {
        if (!userId || !listingId) return false;

        const { data, error } = await supabase
            .from("saved_listings")
            .select("id")
            .eq("user_id", userId)
            .eq("listing_id", listingId)
            .maybeSingle();

        if (error) {
            console.error("Error checking save status:", error);
            return false;
        }

        return !!data;
    },

    /**
     * Toggle save status for a listing.
     * Returns { saved: boolean }
     */
    async toggleSave(userId, listingId) {
        if (!userId || !listingId) throw new Error("Missing userId or listingId");

        // Check if already saved
        const { data: existing, error: checkError } = await supabase
            .from("saved_listings")
            .select("id")
            .eq("user_id", userId)
            .eq("listing_id", listingId)
            .maybeSingle();

        if (checkError) throw checkError;

        if (existing) {
            // Remove
            const { error: deleteError } = await supabase
                .from("saved_listings")
                .delete()
                .eq("id", existing.id);

            if (deleteError) throw deleteError;
            return { saved: false };
        } else {
            // Add
            const { error: insertError } = await supabase
                .from("saved_listings")
                .insert([{ user_id: userId, listing_id: listingId }]);

            if (insertError) throw insertError;
            return { saved: true };
        }
    },

    /**
     * Get the count of saves for a listing (for seller visibility).
     */
    async getSaveCount(listingId) {
        if (!listingId) return 0;

        const { count, error } = await supabase
            .from("saved_listings")
            .select("id", { count: "exact", head: true })
            .eq("listing_id", listingId);

        if (error) {
            console.error("Error fetching save count:", error);
            return 0;
        }

        return count || 0;
    },

    /**
     * Get all saved listings with full listing data for a user.
     */
    async getSavedListings(userId) {
        if (!userId) return [];

        const { data, error } = await supabase
            .from("saved_listings")
            .select(`
                id,
                listing_id,
                created_at,
                listings (
                    id,
                    title,
                    price,
                    image_url,
                    condition,
                    seller_id
                )
            `)
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /**
     * Remove a saved listing by its saved_listings row ID.
     */
    async removeSave(savedId) {
        const { error } = await supabase
            .from("saved_listings")
            .delete()
            .eq("id", savedId);

        if (error) throw error;
        return true;
    },
};
