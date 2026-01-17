
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import webpush from 'https://esm.sh/web-push@3.6.6'

const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = 'mailto:admin@unimates.com'

webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
)

Deno.serve(async (req) => {
    const payload = await req.json()

    // Webhook payload verification (optional)
    // ...

    const { record, type } = payload
    if (type !== 'INSERT') {
        return new Response('Not an INSERT event', { status: 200 })
    }

    const { receiver_id, content } = record

    // Get subscription
    const { data: subs, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', receiver_id)

    if (error || !subs || subs.length === 0) {
        return new Response('No subscription found', { status: 200 })
    }

    const results = await Promise.all(subs.map(async (sub) => {
        try {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            }

            const notificationPayload = JSON.stringify({
                title: 'New Message',
                body: content ? (content.substring(0, 50) + (content.length > 50 ? '...' : '')) : 'You have received a new message',
                url: '/messages'
            })

            await webpush.sendNotification(pushSubscription, notificationPayload)
            return { success: true }
        } catch (err) {
            console.error('Push error:', err)
            // Optional: delete invalid subscription
            if (err.statusCode === 410) {
                await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
            }
            return { success: false, error: err }
        }
    }))

    return new Response(JSON.stringify(results), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
    })
})
