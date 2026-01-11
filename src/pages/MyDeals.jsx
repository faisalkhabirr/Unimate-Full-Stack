import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import '../styles/MyDeals.css';

const MyDeals = () => {
    const { user } = useAuth();
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchDeals();
        }
    }, [user]);

    const fetchDeals = async () => {
        try {
            // Fetch deals where I am buyer OR seller
            const { data, error } = await supabase
                .from('deals')
                .select(`
                    *,
                    listing:listings (
                        title,
                        image_url,
                        price
                    )
                `)
                .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDeals(data || []);
        } catch (error) {
            console.error('Error fetching deals:', error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Loading your deals...</div>;

    return (
        <div className="deals-container">
            <h1 className="deals-header">My Deals</h1>

            {deals.length === 0 ? (
                <div className="empty-state">
                    <p>No deals yet. Start chatting with sellers!</p>
                </div>
            ) : (
                <div className="deals-list">
                    {deals.map(deal => {
                        const isBuyer = deal.buyer_id === user.id;
                        const role = isBuyer ? 'Buyer' : 'Seller';

                        return (
                            <div key={deal.id} className="deal-card">
                                <div className="deal-info">
                                    <div className="deal-role-badge" data-role={role}>
                                        {role}
                                    </div>
                                    <h3 className="deal-title">
                                        {deal.listing ? deal.listing.title : 'Unknown Item'}
                                    </h3>
                                    <div className="deal-meta">
                                        <span className={`status-badge ${deal.status}`}>
                                            {deal.status === 'completed' ? '✅ Completed' : '⏳ Pending'}
                                        </span>
                                        <span className="deal-date">
                                            {new Date(deal.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                {deal.listing && (
                                    <div className="deal-image">
                                        <img src={deal.listing.image_url} alt={deal.listing.title} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MyDeals;
