import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import "../styles/Security.css";

const Security = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    const handleChange = (e) => {
        setPasswordData({
            ...passwordData,
            [e.target.name]: e.target.value,
        });
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });

        // Validation
        if (passwordData.newPassword.length < 6) {
            setMessage({ type: "error", text: "Password must be at least 6 characters long" });
            setLoading(false);
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: "error", text: "New passwords do not match" });
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: passwordData.newPassword,
            });

            if (error) throw error;

            setMessage({ type: "success", text: "Password updated successfully!" });
            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
        } catch (error) {
            console.error("Error updating password:", error);
            setMessage({ type: "error", text: error.message || "Failed to update password" });
        } finally {
            setLoading(false);
        }
    };

    const handleResendVerification = async () => {
        try {
            const { error } = await supabase.auth.resend({
                type: "signup",
                email: user.email,
            });

            if (error) throw error;

            setMessage({ type: "success", text: "Verification email sent!" });
        } catch (error) {
            console.error("Error sending verification:", error);
            setMessage({ type: "error", text: "Failed to send verification email" });
        }
    };

    return (
        <div className="security-container">
            <div className="security-shell">
                <div className="security-header">
                    <button onClick={() => navigate("/profile")} className="security-back-btn">
                        ← Back to Profile
                    </button>
                    <h1>Security Settings</h1>
                    <p>Manage your password and account security</p>
                </div>

                {/* Email Verification Status */}
                <div className="security-section">
                    <h2>Email Verification</h2>
                    <div className="security-info-box">
                        <div className="security-info-row">
                            <span className="security-label">Email:</span>
                            <span className="security-value">{user?.email}</span>
                        </div>
                        <div className="security-info-row">
                            <span className="security-label">Status:</span>
                            <span className={`security-badge ${user?.email_confirmed_at ? "verified" : "unverified"}`}>
                                {user?.email_confirmed_at ? "✓ Verified" : "⚠ Not Verified"}
                            </span>
                        </div>
                        {!user?.email_confirmed_at && (
                            <button
                                onClick={handleResendVerification}
                                className="security-btn security-btn--secondary"
                            >
                                Resend Verification Email
                            </button>
                        )}
                    </div>
                </div>

                {/* Change Password */}
                <form onSubmit={handlePasswordChange} className="security-section">
                    <h2>Change Password</h2>

                    <div className="security-field">
                        <label htmlFor="newPassword">New Password</label>
                        <input
                            type="password"
                            id="newPassword"
                            name="newPassword"
                            value={passwordData.newPassword}
                            onChange={handleChange}
                            placeholder="Enter new password (min. 6 characters)"
                            required
                        />
                    </div>

                    <div className="security-field">
                        <label htmlFor="confirmPassword">Confirm New Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm new password"
                            required
                        />
                    </div>

                    {message.text && (
                        <div className={`security-message security-message--${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="security-btn security-btn--primary"
                    >
                        {loading ? "Updating..." : "Update Password"}
                    </button>
                </form>

                {/* Account Info */}
                <div className="security-section">
                    <h2>Account Information</h2>
                    <div className="security-info-box">
                        <div className="security-info-row">
                            <span className="security-label">User ID:</span>
                            <span className="security-value security-value--mono">{user?.id}</span>
                        </div>
                        <div className="security-info-row">
                            <span className="security-label">Account Created:</span>
                            <span className="security-value">
                                {new Date(user?.created_at).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="security-info-row">
                            <span className="security-label">Last Sign In:</span>
                            <span className="security-value">
                                {user?.last_sign_in_at
                                    ? new Date(user.last_sign_in_at).toLocaleString()
                                    : "N/A"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Security;
