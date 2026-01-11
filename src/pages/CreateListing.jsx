import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import "../styles/CreateListing.css";

const CATEGORY_OPTIONS = [
    "Textbook",
    "Electronics",
    "Clothing",
    "Accessories",
    "Stationery",
    "Dorm / Home",
    "Sports",
    "Other",
];

const PLACEHOLDER_IMG =
    "https://via.placeholder.com/400x300/f7f8f9/636e72?text=No+Image";

const CreateListing = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const fileRef = useRef(null);

    const [formData, setFormData] = useState({
        title: "",
        price: "",
        description: "",
        category: "",
        condition: "",
        color: "",
        size: "",
        material: "",
    });

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const canSubmit = useMemo(() => {
        return (
            formData.title.trim().length > 0 &&
            String(formData.price).trim().length > 0 &&
            formData.category.trim().length > 0 &&
            formData.description.trim().length > 0 &&
            !loading
        );
    }, [formData, loading]);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const onPickFile = () => fileRef.current?.click();

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImageFile(file);

        // preview
        const url = URL.createObjectURL(file);
        setImagePreview(url);
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview("");
        if (fileRef.current) fileRef.current.value = "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");

        try {
            if (!user?.id) throw new Error("You must be logged in to create a listing.");

            let publicUrl = PLACEHOLDER_IMG;

            // Only upload image if one is selected
            if (imageFile) {
                const fileExt = imageFile.name.split(".").pop();
                const fileName = `${crypto?.randomUUID?.() || Math.random()}.${fileExt}`;
                const filePath = `${user.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from("listing-images")
                    .upload(filePath, imageFile, {
                        upsert: false,
                        cacheControl: "3600",
                    });

                if (uploadError) throw uploadError;

                const {
                    data: { publicUrl: uploadedUrl },
                } = supabase.storage.from("listing-images").getPublicUrl(filePath);

                publicUrl = uploadedUrl;
            }

            // Insert into Database (include new fields)
            const payload = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                price: parseFloat(formData.price),
                image_url: publicUrl,
                seller_id: user.id,

                // NEW fields
                category: formData.category,
                color: formData.color.trim() || null,
                size: formData.size.trim() || null,
                material: formData.material.trim() || null,
            };

            const { error: insertError } = await supabase.from("listings").insert([payload]);
            if (insertError) throw insertError;

            navigate("/marketplace");
        } catch (error) {
            console.error("Error creating listing:", error);
            setErrorMsg(error.message || "Failed to create listing");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="cl-page">
            {/* Header */}
            <header className="cl-topbar">
                <div>
                    <h1 className="cl-title">Create Listing</h1>
                    <p className="cl-subtitle">Publish an item with clean details and optional attributes.</p>
                </div>

                <div className="cl-badges">
                    <span className="cl-badge">Dashboard</span>
                    <span className="cl-badge cl-badge--accent">Sell</span>
                </div>
            </header>

            <div className="cl-grid">
                {/* Main form */}
                <section className="cl-card">
                    <div className="cl-cardHead">
                        <h2 className="cl-cardTitle">Listing details</h2>
                        <p className="cl-cardHint">Fields marked * are required.</p>
                    </div>

                    {errorMsg && <div className="cl-alert">{errorMsg}</div>}

                    <form onSubmit={handleSubmit} className="cl-form">
                        <div className="cl-row">
                            <label className="cl-field">
                                <span className="cl-label">Title *</span>
                                <input
                                    className="cl-input"
                                    type="text"
                                    id="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="Title of your Product"
                                    required
                                />
                            </label>

                            <label className="cl-field">
                                <span className="cl-label">Price(BDT)*</span>
                                <input
                                    className="cl-input"
                                    type="number"
                                    id="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    placeholder="25.00"
                                    step="0.01"
                                    min="0"
                                    required
                                />
                            </label>
                        </div>

                        <div className="cl-row">
                            <label className="cl-field">
                                <span className="cl-label">Category </span>
                                <select
                                    className="cl-input"
                                    id="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">
                                        Select a category
                                    </option>
                                    {CATEGORY_OPTIONS.map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="cl-field">
                                <span className="cl-label">Condition *</span>
                                <select
                                    className="cl-input"
                                    id="condition"
                                    value={formData.condition}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="new">Brand new</option>
                                    <option value="used">Used</option>
                                </select>
                            </label>
                        </div>

                        <label className="cl-field">
                            <span className="cl-label">Description *</span>
                            <textarea
                                className="cl-input cl-textarea"
                                id="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Describe condition, pickup location, what’s included, etc."
                                rows="5"
                                required
                            />
                        </label>

                        <div className="cl-divider" />

                        <div className="cl-section">
                            <div className="cl-sectionHead">
                                <h3 className="cl-sectionTitle">Optional attributes</h3>
                                <p className="cl-sectionDesc">
                                    Useful for clothing, accessories, tech gear, etc. Leave blank if not relevant.
                                </p>
                            </div>

                            <div className="cl-row">
                                <label className="cl-field">
                                    <span className="cl-label">Color (optional)</span>
                                    <input
                                        className="cl-input"
                                        type="text"
                                        id="color"
                                        value={formData.color}
                                        onChange={handleChange}
                                        placeholder="e.g. Black"
                                    />
                                </label>

                                <label className="cl-field">
                                    <span className="cl-label">Size (optional)</span>
                                    <input
                                        className="cl-input"
                                        type="text"
                                        id="size"
                                        value={formData.size}
                                        onChange={handleChange}
                                        placeholder="e.g. M / 32 / A4"
                                    />
                                </label>
                            </div>

                            <div className="cl-row">
                                <label className="cl-field">
                                    <span className="cl-label">Material (optional)</span>
                                    <input
                                        className="cl-input"
                                        type="text"
                                        id="material"
                                        value={formData.material}
                                        onChange={handleChange}
                                        placeholder="e.g. Cotton / Leather / Plastic"
                                    />
                                </label>

                                <div className="cl-field cl-field--ghost" />
                            </div>
                        </div>

                        <div className="cl-actions">
                            <button
                                type="button"
                                className="cl-btn cl-btn--soft"
                                onClick={() => {
                                    setFormData({
                                        title: "",
                                        price: "",
                                        description: "",
                                        category: "",
                                        color: "",
                                        size: "",
                                        material: "",
                                    });
                                    removeImage();
                                    setErrorMsg("");
                                }}
                                disabled={loading}
                            >
                                Reset
                            </button>

                            <button className="cl-btn cl-btn--primary" type="submit" disabled={!canSubmit}>
                                {loading ? "Publishing..." : "Publish Listing"}
                            </button>
                        </div>
                    </form>
                </section>

                {/* Media / preview */}
                <aside className="cl-card cl-side">
                    <div className="cl-cardHead">
                        <h2 className="cl-cardTitle">Media</h2>
                        <p className="cl-cardHint">A clean photo improves trust.</p>
                    </div>

                    <div className="cl-media">
                        <input
                            ref={fileRef}
                            className="cl-file"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                        />

                        {!imagePreview ? (
                            <div className="cl-drop">
                                <div className="cl-dropIcon">⬆</div>
                                <div className="cl-dropText">
                                    <strong>Upload an image</strong> or{" "}
                                    <button type="button" className="cl-link" onClick={onPickFile}>
                                        browse
                                    </button>
                                </div>
                                <div className="cl-dropMeta">Optional • Max 2MB recommended</div>
                            </div>
                        ) : (
                            <div className="cl-preview">
                                <img className="cl-previewImg" src={imagePreview} alt="Listing preview" />
                                <div className="cl-previewBar">
                                    <div className="cl-previewName">{imageFile?.name}</div>
                                    <button type="button" className="cl-btn cl-btn--danger" onClick={removeImage}>
                                        Remove
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="cl-tipCard">
                            <h3 className="cl-tipTitle">Quick tips</h3>
                            <ul className="cl-tipList">
                                <li>Use a specific title (brand/model if possible).</li>
                                <li>Write condition + pickup details in description.</li>
                                <li>Pick the right category for better discovery.</li>
                            </ul>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default CreateListing;
