import { supabase } from "../supabaseClient";
import { withGlobalLoader } from "../utils/globalLoader";

export const chatService = {
    async getOrCreateChat(listingId, sellerId, buyerId) {
        if (sellerId === buyerId) throw new Error("You cannot chat with yourself");

        const { data: existingChats, error: fetchError } = await withGlobalLoader(
            supabase
                .from("chats")
                .select("id")
                .eq("listing_id", listingId)
                .eq("buyer_id", buyerId)
                .single()
        );

        if (fetchError && fetchError.code !== "PGRST116") throw fetchError;
        if (existingChats) return existingChats.id;

        const { data: newChat, error: createError } = await withGlobalLoader(
            supabase
                .from("chats")
                .insert([{ listing_id: listingId, seller_id: sellerId, buyer_id: buyerId }])
                .select()
                .single()
        );

        if (createError) throw createError;
        return newChat.id;
    },

    async getMessages(chatId) {
        const { data, error } = await withGlobalLoader(
            supabase.from("messages").select("*").eq("chat_id", chatId).order("created_at", { ascending: true })
        );
        if (error) throw error;
        return data;
    },

    async sendMessage(chatId, senderId, content) {
        const { error } = await withGlobalLoader(
            supabase.from("messages").insert([{ chat_id: chatId, sender_id: senderId, text: content }])
        );
        if (error) throw error;
    },

    async uploadChatImage(file, chatId, senderId) {
        const ext = file.name.split(".").pop();
        const fileName = `${chatId}/${senderId}/${Date.now()}.${ext}`;

        const { error: uploadError } = await withGlobalLoader(
            supabase.storage.from("chat-media").upload(fileName, file, {
                cacheControl: "3600",
                upsert: false,
            })
        );

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("chat-media").getPublicUrl(fileName);

        return data.publicUrl;
    },

    async sendMediaMessage(chatId, senderId, mediaUrl, mediaType = "image") {
        const { error } = await withGlobalLoader(
            supabase.from("messages").insert([
                { chat_id: chatId, sender_id: senderId, text: "", media_url: mediaUrl, media_type: mediaType },
            ])
        );
        if (error) throw error;
    },

    async createDeal(chatId, listingId, buyerId, sellerId) {
        const { data, error } = await withGlobalLoader(
            supabase
                .from("deals")
                .insert([{ chat_id: chatId, listing_id: listingId, buyer_id: buyerId, seller_id: sellerId, status: "completed" }])
                .select()
                .single()
        );
        if (error) throw error;
        return data;
    },

    async getDeal(chatId) {
        const { data, error } = await withGlobalLoader(
            supabase.from("deals").select("*").eq("chat_id", chatId).single()
        );
        if (error && error.code !== "PGRST116") throw error;
        return data;
    },
};
