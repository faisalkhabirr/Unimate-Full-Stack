import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import '../styles/CreateListing.css'; // Reuse styles

const EditListing = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { listingId } = useParams();

    const [formData, setFormData] = useState({
        title: '',
        price: '',
        description: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const fetchListing = async () => {
            try {
                const { data, error } = await supabase
                    .from('listings')
                    .select('*')
                    .eq('id', listingId)
                    .single();

                if (error) throw error;

                // Security check: ensure user owns this listing
                if (data.seller_id !== user.id) {
                    navigate('/my-listings');
                    return;
                }

                setFormData({
                    title: data.title,
                    price: data.price,
                    description: data.description,
                });
            } catch (error) {
                console.error('Error fetching listing:', error);
                setErrorMsg('Could not load listing details.');
            } finally {
                setLoading(false);
            }
        };

        if (user && listingId) {
            fetchListing();
        }
    }, [user, listingId, navigate]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrorMsg('');

        try {
            const { error: updateError } = await supabase
                .from('listings')
                .update({
                    title: formData.title,
                    description: formData.description,
                    price: parseFloat(formData.price),
                })
                .eq('id', listingId);

            if (updateError) throw updateError;

            navigate('/my-listings');

        } catch (error) {
            console.error('Error updating listing:', error);
            setErrorMsg(error.message || 'Failed to update listing');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="create-listing-container">
            <div className="create-listing-box">
                <h2 className="listing-title">Edit Listing</h2>

                {loading ? (
                    <p className="loading">Loading details...</p>
                ) : (
                    <>
                        {errorMsg && <div className="listing-error">{errorMsg}</div>}

                        <form onSubmit={handleSubmit} className="listing-form">
                            <div className="form-group">
                                <label htmlFor="title">Title</label>
                                <input
                                    type="text"
                                    id="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="price">Price ($)</label>
                                <input
                                    type="number"
                                    id="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    step="0.01"
                                    min="0"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Description</label>
                                <textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="4"
                                    required
                                ></textarea>
                            </div>

                            <div className="form-buttons">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => navigate('/my-listings')}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default EditListing;
