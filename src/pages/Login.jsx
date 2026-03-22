import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const navigate = useNavigate();
    const { user } = useAuth();

    // If user is already logged in, redirect to marketplace
    useEffect(() => {
        if (user) {
            navigate('/marketplace');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            // Conversion happens automatically via AuthContext listener -> redirect via useEffect
        } catch (error) {
            setErrorMsg(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            setLoading(true);
            setErrorMsg('');
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/marketplace`
                }
            });
            if (error) throw error;
        } catch (error) {
            setErrorMsg(error.message);
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h2 className="auth-title">Login to Unimate</h2>
                <p className="auth-subtitle">Welcome back, mate!</p>

                {errorMsg && <div className="auth-error">{errorMsg}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="yourname@university.edu (Student verification required)"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div className="password-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your account password"
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex="-1"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="auth-divider">
                    <span>or continue with</span>
                </div>

                <button 
                    onClick={handleGoogleSignIn} 
                    className="google-btn" 
                    disabled={loading}
                    type="button"
                >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
                    Sign in with Google
                </button>

                <p className="auth-footer">
                    <Link to="/forgot-password" style={{ display: 'block', marginBottom: '10px' }}>Forgot Password?</Link>
                    Don't have an account? <Link to="/register">Sign up here</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
