import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../styles/Auth.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;

            setMessage('Password reset link has been sent to your email.');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h2 className="auth-title">Reset Password</h2>
                <p className="auth-subtitle">Enter your email to receive a reset link</p>

                {error && <div className="auth-error">{error}</div>}
                {message && <div className="auth-success" style={{
                    backgroundColor: '#d1fae5',
                    color: '#065f46',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    marginBottom: '1.5rem',
                    textAlign: 'center',
                    border: '1px solid #a7f3d0'
                }}>{message}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="yourname@university.edu"
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <p className="auth-footer">
                    Remember your password? <Link to="/login">Login here</Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;
