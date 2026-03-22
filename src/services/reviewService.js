import { supabase } from "../supabaseClient";
import { withGlobalLoader } from "../utils/globalLoader.js";

export const reviewService = {
    async getForListing(listingId) {
        // First fetch reviews
        const { data: reviews, error } = await withGlobalLoader(
            supabase
                .from("listing_reviews")
                .select("id, listing_id, reviewer_id, rating, review_text, created_at")
                .eq("listing_id", listingId)
                .order("created_at", { ascending: false })
        );

        if (error) throw error;
        if (!reviews || reviews.length === 0) return [];

        // Manual join to avoid Supabase explicit foreign key errors
        const reviewerIds = [...new Set(reviews.map(r => r.reviewer_id).filter(Boolean))];
        
        let profilesData = [];
        if (reviewerIds.length > 0) {
            const { data: profiles } = await supabase
                .from("profiles")
                .select("id, full_name, avatar_url")
                .in("id", reviewerIds);
            profilesData = profiles || [];
        }

        // Map profiles onto reviews
        const enrichedReviews = reviews.map(r => {
            const profile = profilesData.find(p => p.id === r.reviewer_id);
            return {
                ...r,
                profiles: profile || null
            };
        });

        return enrichedReviews;
    },

    async addReview({ listingId, rating, review_text, reviewer_id }) {
        const { data, error } = await withGlobalLoader(
            supabase
                .from("listing_reviews")
                .insert([
                    {
                        listing_id: listingId,
                        reviewer_id,
                        rating,
                        review_text: review_text?.trim() || null,
                    },
                ])
                .select("id, listing_id, reviewer_id, rating, review_text, created_at")
                .single()
        );
        if (error) throw error;
        return data;
    },

    async updateReview({ reviewId, rating, review_text }) {
        const { data, error } = await withGlobalLoader(
            supabase
                .from("listing_reviews")
                .update({
                    rating,
                    review_text: review_text?.trim() || null,
                })
                .eq("id", reviewId)
                .select("id, listing_id, reviewer_id, rating, review_text, created_at")
                .single()
        );
        if (error) throw error;
        return data;
    },

    async deleteReview(reviewId) {
        const { error } = await withGlobalLoader(
            supabase.from("listing_reviews").delete().eq("id", reviewId)
        );
        if (error) throw error;
        return true;
    },
};
