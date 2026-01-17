import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import "../styles/Settings.css";

const Settings = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        full_name: "",
        phone: "",
        address: "",
        campus: "",
        student_id: "",
        bio: "",
    });

    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    useEffect(() => {
        if (user?.user_metadata) {
            setFormData({
                full_name: user.user_metadata.full_name || user.user_metadata.name || "",
                phone: user.user_metadata.phone || "",
                address: user.user_metadata.address || "",
                campus: user.user_metadata.campus || "",
                student_id: user.user_metadata.student_id || "",
                bio: user.user_metadata.bio || "",
            });
            setAvatarPreview(user.user_metadata.avatar_url || null);
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    full_name: formData.full_name.trim(),
                    phone: formData.phone.trim(),
                    address: formData.address.trim(),
                    campus: formData.campus.trim(),
                    student_id: formData.student_id.trim(),
                    bio: formData.bio.trim(),
                    avatar_url: avatarUrl,
                },
            });

            if (error) throw error;

            // Sync to public profiles table (fail silently if table doesn't exist)
            try {
                const updates = {
                    id: user.id,
                    full_name: formData.full_name.trim(),
                    campus: formData.campus.trim(),
                    student_id: formData.student_id.trim(),
                    bio: formData.bio.trim(),
                    avatar_url: avatarUrl,
                    updated_at: new Date(),
                };

                await supabase.from("profiles").upsert(updates);
            } catch (err) {
                console.warn("Could not sync to profiles table", err);
            }

            setMessage({ type: "success", text: "Profile updated successfully!" });

            // Refresh the page after 1.5 seconds to show updated data
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error) {
            console.error("Error updating profile:", error);
            setMessage({ type: "error", text: error.message || "Failed to update profile" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="settings-container">
            <div className="settings-shell">
                <div className="settings-header">
                    <button onClick={() => navigate("/profile")} className="settings-back-btn">
                        ← Back to Profile
                    </button>
                    <h1>Edit Profile</h1>
                    <p>Update your personal information and delivery details</p>
                </div>

                <form onSubmit={handleSubmit} className="settings-form">
                    <div className="settings-section">
                        <h2>Profile Picture</h2>
                        <div className="settings-field">
                            {avatarPreview && (
                                <img
                                    src={avatarPreview}
                                    alt="Avatar preview"
                                    style={{
                                        width: "100px",
                                        height: "100px",
                                        borderRadius: "50%",
                                        objectFit: "cover",
                                        marginBottom: "1rem",
                                    }}
                                />
                            )}
                            <label htmlFor="avatar">Profile Picture</label>
                            <input
                                type="file"
                                id="avatar"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setAvatarFile(file);
                                        setAvatarPreview(URL.createObjectURL(file));
                                    }
                                }}
                            />
                        </div>
                    </div>

                    <div className="settings-section">
                        <h2>Personal Information</h2>

                        <div className="settings-field">
                            <label htmlFor="bio">Bio</label>
                            <textarea
                                id="bio"
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                placeholder="Tell us about yourself"
                                rows="3"
                            />
                        </div>

                        <div className="settings-field">
                            <label htmlFor="full_name">Full Name</label>
                            <input
                                type="text"
                                id="full_name"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                placeholder="Enter your full name"
                            />
                        </div>

                        <div className="settings-field">
                            <label htmlFor="phone">Phone Number</label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Enter your phone number"
                            />
                        </div>

                        <div className="settings-field">
                            <label htmlFor="address">Address</label>
                            <textarea
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Enter your address"
                                rows="3"
                            />
                        </div>
                    </div>

                    <div className="settings-section">
                        <h2>University Details</h2>

                        <div className="settings-field">
                            <label htmlFor="campus">Campus</label>
                            <input
                                type="text"
                                id="campus"
                                name="campus"
                                value={formData.campus}
                                onChange={handleChange}
                                placeholder="Enter your campus name"
                            />
                        </div>

                        <div className="settings-field">
                            <label htmlFor="student_id">Student ID</label>
                            <input
                                type="text"
                                id="student_id"
                                name="student_id"
                                value={formData.student_id}
                                onChange={handleChange}
                                placeholder="Enter your student ID"
                            />
                        </div>
                    </div>

                    {message.text && (
                        <div className={`settings-message settings-message--${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="settings-actions">
                        <button
                            type="button"
                            onClick={() => navigate("/profile")}
                            className="settings-btn settings-btn--cancel"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="settings-btn settings-btn--save"
                        >
                            {loading ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Settings;
