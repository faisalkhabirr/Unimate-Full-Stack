import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import "../styles/CreateListing.css";

const MAX_IMAGES = 8;
const MAX_IMAGE_MB = 2;
const MAX_VIDEOS = 2;
const MAX_VIDEO_MB = 20;

const ACCEPTED_IMAGE = ["image/jpeg", "image/png", "image/webp"];
const ACCEPTED_VIDEO = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];

// ✅ block common personal/commercial email providers
const COMMERCIAL_DOMAINS = new Set([
    "gmail.com",
    "googlemail.com",
    "yahoo.com",
    "yahoo.co.uk",
    "outlook.com",
    "hotmail.com",
    "live.com",
    "msn.com",
    "icloud.com",
    "me.com",
    "aol.com",
    "proton.me",
    "protonmail.com",
    "zoho.com",
    "mail.com",
    "yandex.com",
    "gmx.com",
    "gmx.net",
]);

const DISPOSABLE_KEYWORDS = [
    "tempmail",
    "10minutemail",
    "guerrillamail",
    "mailinator",
    "trashmail",
    "disposable",
];

const getDomain = (email) => {
    if (!email || !email.includes("@")) return "";
    return email.split("@").pop().toLowerCase().trim();
};

const looksDisposable = (domain) => DISPOSABLE_KEYWORDS.some((k) => domain.includes(k));

const isUniversityEmail = (email) => {
    const domain = getDomain(email);
    if (!domain) return false;
    if (COMMERCIAL_DOMAINS.has(domain)) return false;
    if (looksDisposable(domain)) return false;
    return true;
};

const STEP_TITLES = ["Choose category", "Basics", "Details", "Photos & videos", "Publish"];

const CreateListing = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const imgRef = useRef(null);
    const vidRef = useRef(null);

    const [step, setStep] = useState(1);
    const [categories, setCategories] = useState([]);

    const [sellerOk, setSellerOk] = useState(false);
    const [sellerLoading, setSellerLoading] = useState(true);

    const [formData, setFormData] = useState({
        categoryId: "",
        title: "",
        price: "",
        currency: "BDT",
        condition: "",
        negotiable: false,
        location: "",
        stock_count: 1,
        description: "",
        attributes: {
            // General
            brand: "",
            model: "",
            color: "",
            size: "",
            material: "",
            weight: "",
            dimensions: "",
            warranty: "",
            year: "",
            // Electronics
            storage: "",
            ram: "",
            processor: "",
            screen_size: "",
            battery: "",
            // Clothing
            fabric: "",
            fit_type: "",
            gender: "",
            // Books
            author: "",
            isbn: "",
            publisher: "",
            edition: "",
            language: "",
            // Furniture
            assembly_required: "",
            // Additional
            quantity: "",
            custom_field_1: "",
            custom_field_2: "",
        },
    });

    const [images, setImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [videos, setVideos] = useState([]);
    const [videoPreviews, setVideoPreviews] = useState([]);

    const [touched, setTouched] = useState({});

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const [showOptional, setShowOptional] = useState(false);

    // categories
    useEffect(() => {
        (async () => {
            const { data, error } = await supabase
                .from("categories")
                .select("id, name")
                .order("sort_order", { ascending: true });

            if (!error) setCategories(data || []);
        })();
    }, []);

    // student email check
    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                setSellerLoading(true);
                setErrorMsg("");

                if (!user?.id) {
                    if (mounted) setSellerOk(false);
                    return;
                }

                const ok = isUniversityEmail(user.email || "");
                if (mounted) setSellerOk(ok);
            } finally {
                if (mounted) setSellerLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [user]);

    const canGoNext = useMemo(() => {
        if (step === 1) return formData.categoryId.trim().length > 0;

        if (step === 2) {
            const priceOk =
                String(formData.price).trim().length > 0 &&
                !Number.isNaN(Number(formData.price)) &&
                Number(formData.price) >= 0;

            const locationOk = formData.location.trim().length > 0;

            return formData.title.trim().length > 0 && priceOk && formData.condition.trim().length > 0 && locationOk;
        }

        if (step === 3) return formData.description.trim().length > 0;
        if (step === 4) return images.length > 0;
        if (step === 5) return true;

        return false;
    }, [step, formData, images.length]);

    const updateField = (key, value) => {
        setFormData((p) => ({ ...p, [key]: value }));
        setTouched((p) => ({ ...p, [key]: true }));
    };
    const updateAttr = (key, value) => {
        setFormData((p) => ({ ...p, attributes: { ...p.attributes, [key]: value } }));
        setTouched((p) => ({ ...p, [`attr_${key}`]: true }));
    };

    const validateAndAddImages = (fileList) => {
        const incoming = Array.from(fileList || []);
        if (!incoming.length) return;

        const next = [...images];
        const nextPrev = [...imagePreviews];

        for (const f of incoming) {
            if (next.length >= MAX_IMAGES) break;

            if (!ACCEPTED_IMAGE.includes(f.type)) {
                setErrorMsg("Only JPG, PNG, WEBP images are allowed.");
                continue;
            }

            const mb = f.size / (1024 * 1024);
            if (mb > MAX_IMAGE_MB) {
                setErrorMsg(`Each image must be <= ${MAX_IMAGE_MB}MB.`);
                continue;
            }

            next.push(f);
            nextPrev.push(URL.createObjectURL(f));
        }

        setImages(next);
        setImagePreviews(nextPrev);
    };

    const validateAndAddVideos = (fileList) => {
        const incoming = Array.from(fileList || []);
        if (!incoming.length) return;

        const next = [...videos];
        const nextPrev = [...videoPreviews];

        for (const f of incoming) {
            if (next.length >= MAX_VIDEOS) break;

            if (!ACCEPTED_VIDEO.includes(f.type)) {
                setErrorMsg("Only MP4, WEBM, OGG, MOV videos are allowed.");
                continue;
            }

            const mb = f.size / (1024 * 1024);
            if (mb > MAX_VIDEO_MB) {
                setErrorMsg(`Each video must be <= ${MAX_VIDEO_MB}MB.`);
                continue;
            }

            next.push(f);
            nextPrev.push(URL.createObjectURL(f));
        }

        setVideos(next);
        setVideoPreviews(nextPrev);
    };

    const removeImageAt = (idx) => {
        setImages((p) => p.filter((_, i) => i !== idx));
        setImagePreviews((p) => p.filter((_, i) => i !== idx));
    };

    const removeVideoAt = (idx) => {
        setVideos((p) => p.filter((_, i) => i !== idx));
        setVideoPreviews((p) => p.filter((_, i) => i !== idx));
    };

    const processFiles = (files) => {
        const incoming = Array.from(files || []);
        const img = [];
        const vid = [];

        incoming.forEach(f => {
            if (f.type.startsWith("image/")) img.push(f);
            else if (f.type.startsWith("video/")) vid.push(f);
        });

        if (img.length) validateAndAddImages(img);
        if (vid.length) validateAndAddVideos(vid);
    };

    const goNext = () => {
        setErrorMsg("");
        if (!canGoNext) return;
        setStep((s) => Math.min(5, s + 1));
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && canGoNext) {
            e.preventDefault();
            goNext();
        }
    };

    const goBack = () => {
        setErrorMsg("");
        setStep((s) => Math.max(1, s - 1));
    };

    const uploadToBucket = async (bucket, path, file) => {
        const { error } = await supabase.storage.from(bucket).upload(path, file, {
            upsert: false,
            cacheControl: "3600",
        });
        if (error) throw error;

        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        return data.publicUrl;
    };

    const handlePublish = async () => {
        setLoading(true);
        setErrorMsg("");

        let listingId = null;

        try {
            if (!user?.id) throw new Error("You must be logged in.");
            if (!sellerOk) {
                throw new Error(
                    "Student account required. Please use a university email (not Gmail/Yahoo/Outlook)."
                );
            }

            // 1) Create listing first
            const payload = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                price: parseFloat(formData.price),
                currency: formData.currency,
                condition: formData.condition,
                negotiable: !!formData.negotiable,
                location: formData.location.trim(),
                // stock_count: parseInt(formData.stock_count) || 1,
                category_id: formData.categoryId,
                seller_id: user.id,
                attributes: formData.attributes,
                // is_active: true,
            };

            const { data: listing, error: insertError } = await supabase
                .from("listings")
                .insert([payload])
                .select("id")
                .single();

            if (insertError) throw insertError;

            listingId = listing.id;

            // 2) Upload images + insert into listing_images
            const imageRows = [];
            const uploadedUrls = [];

            for (let i = 0; i < images.length; i++) {
                const f = images[i];
                const ext = f.name.split(".").pop();
                const fileName = `${crypto?.randomUUID?.() || Math.random()}.${ext}`;
                const path = `${user.id}/${listingId}/${fileName}`;

                const url = await uploadToBucket("listing-images", path, f);
                uploadedUrls.push(url);

                imageRows.push({
                    listing_id: listingId,
                    image_url: url,
                    is_primary: i === 0,
                    sort_order: i,
                });
            }

            if (imageRows.length) {
                const { error: imgErr } = await supabase.from("listing_images").insert(imageRows);
                if (imgErr) throw imgErr;
            }

            // ✅ 3) CRITICAL FIX: update listings.image_url (and image_urls)
            const primaryUrl = uploadedUrls[0] || null;

            const { error: updErr } = await supabase
                .from("listings")
                .update({
                    image_url: primaryUrl,
                    image_urls: uploadedUrls, // requires jsonb column (recommended)
                })
                .eq("id", listingId);

            if (updErr) throw updErr;

            // 4) Videos optional (only if you have bucket/table)
            if (videos.length) {
                const videoRows = [];
                for (let i = 0; i < videos.length; i++) {
                    const f = videos[i];
                    const ext = f.name.split(".").pop();
                    const fileName = `${crypto?.randomUUID?.() || Math.random()}.${ext}`;
                    const path = `${user.id}/${listingId}/${fileName}`;
                    const url = await uploadToBucket("listing-images", path, f);

                    videoRows.push({
                        listing_id: listingId,
                        video_url: url,
                        sort_order: i,
                    });
                }

                const { error: vidErr } = await supabase.from("listing_videos").insert(videoRows);
                if (vidErr) throw vidErr;
            }

            navigate(`/product/${listingId}`);
        } catch (e) {
            console.error(e);

            // Optional cleanup (so you don’t end up with empty listings if upload fails)
            if (listingId) {
                await supabase.from("listings").delete().eq("id", listingId);
            }

            setErrorMsg(e.message || "Failed to publish listing.");
        } finally {
            setLoading(false);
        }
    };

    // gate screens
    if (sellerLoading) {
        return (
            <div className="cl-page">
                <div className="cl-grid">
                    <div className="cl-card">
                        <h2 className="cl-cardTitle">Checking student account…</h2>
                        <p className="cl-cardHint">We verify your email domain before allowing sales.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!user?.id) {
        return (
            <div className="cl-page">
                <div className="cl-grid">
                    <div className="cl-card">
                        <h2 className="cl-cardTitle">Login required</h2>
                        <p className="cl-cardHint">Please log in to create a listing.</p>
                        <div className="cl-actions">
                            <button className="cl-btn cl-btn--primary" onClick={() => navigate("/login")}>
                                Go to Login
                            </button>
                            <button className="cl-btn cl-btn--soft" onClick={() => navigate("/marketplace")}>
                                Back to Marketplace
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!sellerOk) {
        return (
            <div className="cl-page">
                <div className="cl-grid">
                    <div className="cl-card">
                        <h2 className="cl-cardTitle">Student account required</h2>
                        <p className="cl-cardHint">
                            To sell, you must use a university email address. Personal emails like Gmail/Yahoo/Outlook
                            are not allowed.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const progressPct = Math.round((step / 5) * 100);

    return (
        <div className="cl-page">
            <div className="cl-grid">
                <header className="cl-topbar">
                    <div>
                        <h1 className="cl-title">Create a Listing</h1>
                        <p className="cl-subtitle">
                            Step {step} of 5 • {STEP_TITLES[step - 1]}
                        </p>
                        <div className="cl-progress">
                            <div className="cl-progressBar" style={{ width: `${progressPct}%` }} />
                        </div>
                    </div>

                    <div className="cl-badges">
                        <span className="cl-badge">Sell</span>
                        <span className="cl-badge cl-badge--accent">Student</span>
                    </div>
                </header>

                {errorMsg && <div className="cl-alert">{errorMsg}</div>}

                <section className="cl-card">
                    {/* steps UI unchanged from your original */}
                    {/* --- I kept everything the same --- */}

                    {/* STEP 1 */}
                    {step === 1 && (
                        <>
                            <h2 className="cl-cardTitle">Choose category</h2>
                            <p className="cl-cardHint">This affects discovery and search results.</p>
                            <label className="cl-field">
                                <span className="cl-label">Category *</span>
                                <select
                                    className="cl-input"
                                    value={formData.categoryId}
                                    onChange={(e) => updateField("categoryId", e.target.value)}
                                >
                                    <option value="">Select a category</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </>
                    )}

                    {/* STEP 2 */}
                    {step === 2 && (
                        <>
                            <h2 className="cl-cardTitle">Basics</h2>
                            <p className="cl-cardHint">Your DB allows: new / used / refurbished.</p>

                            <div className="cl-row">
                                <label className="cl-field">
                                    <span className="cl-label">Title *</span>
                                    <input
                                        className="cl-input"
                                        value={formData.title}
                                        onChange={(e) => updateField("title", e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="e.g. Logitech MX Master 3S Mouse"
                                    />
                                </label>

                                <label className="cl-field">
                                    <span className="cl-label">Price (BDT) *</span>
                                    <input
                                        className="cl-input"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.price}
                                        onChange={(e) => updateField("price", e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Enter amount in BDT"
                                    />
                                </label>
                            </div>

                            <div className="cl-row">
                                <label className="cl-field">
                                    <span className="cl-label">Condition *</span>
                                    <select
                                        className="cl-input"
                                        value={formData.condition}
                                        onChange={(e) => updateField("condition", e.target.value)}
                                        onKeyDown={handleKeyDown}
                                    >
                                        <option value="">Select condition</option>
                                        <option value="new">Brand new</option>
                                        <option value="used">Used</option>
                                        <option value="refurbished">Refurbished</option>
                                    </select>
                                </label>

                                <label className="cl-field">
                                    <span className="cl-label">Quantity / Stock *</span>
                                    <input
                                        className="cl-input"
                                        type="number"
                                        min="1"
                                        value={formData.stock_count}
                                        onChange={(e) => updateField("stock_count", e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Units available"
                                    />
                                </label>
                            </div>

                            <div className="cl-row">
                                <label className="cl-field">
                                    <span className="cl-label">Product Location *</span>
                                    <input
                                        className={`cl-input ${touched.location && !formData.location.trim() ? "is-invalid" : ""}`}
                                        value={formData.location}
                                        onChange={(e) => updateField("location", e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="e.g. Hall 5, North Campus, Library area"
                                    />
                                    {touched.location && !formData.location.trim() && (
                                        <span className="cl-error-text">Location is required</span>
                                    )}
                                </label>

                                <label className="cl-field cl-check" style={{ alignSelf: "center", marginTop: "12px" }}>
                                    <span className="cl-label cl-label--inline">Negotiable</span>
                                    <input
                                        type="checkbox"
                                        checked={formData.negotiable}
                                        onChange={(e) => updateField("negotiable", e.target.checked)}
                                    />
                                </label>
                            </div>
                        </>
                    )}

                    {/* STEP 3 */}
                    {step === 3 && (() => {
                        const selectedCat = categories.find((c) => c.id === formData.categoryId);
                        const catName = selectedCat?.name?.toLowerCase() || "";

                        return (
                            <>
                                <h2 className="cl-cardTitle">Details</h2>
                                <label className="cl-field">
                                    <span className="cl-label">Description *</span>
                                    <textarea
                                        className={`cl-input cl-textarea ${touched.description && !formData.description.trim() ? "is-invalid" : ""}`}
                                        rows={7}
                                        value={formData.description}
                                        onChange={(e) => updateField("description", e.target.value)}
                                        placeholder="Describe the item's condition, features, and any defects. Be as detailed as possible."
                                    />
                                    {touched.description && !formData.description.trim() && (
                                        <span className="cl-error-text">Description is required</span>
                                    )}
                                </label>

                                <div className="cl-divider" />
                                <button
                                    type="button"
                                    className="cl-optionalToggle"
                                    onClick={() => setShowOptional(!showOptional)}
                                >
                                    <span>Optional Product Details</span>
                                    <span className={`cl-toggleIcon ${showOptional ? "is-open" : ""}`}>▼</span>
                                </button>

                                {showOptional && (
                                    <div className="cl-optionalContent">
                                        <p className="cl-cardHint" style={{ marginBottom: "1rem" }}>
                                            Fill in relevant fields for your product. All fields are optional.
                                        </p>

                                        {/* General Attributes */}
                                        <h4 className="cl-subsectionTitle">General Information</h4>
                                        <div className="cl-row">
                                            <label className="cl-field">
                                                <span className="cl-label">Brand</span>
                                                <input
                                                    className="cl-input"
                                                    value={formData.attributes.brand}
                                                    onChange={(e) => updateAttr("brand", e.target.value)}
                                                    placeholder="e.g. Apple, Samsung"
                                                />
                                            </label>
                                            <label className="cl-field">
                                                <span className="cl-label">Model</span>
                                                <input
                                                    className="cl-input"
                                                    value={formData.attributes.model}
                                                    onChange={(e) => updateAttr("model", e.target.value)}
                                                    placeholder="e.g. iPhone 13, Galaxy S21"
                                                />
                                            </label>
                                        </div>

                                        {/* Conditional sections */}
                                        {catName.includes("electronics") && (
                                            <>
                                                <div className="cl-divider" />
                                                <h4 className="cl-subsectionTitle">Electronics Details</h4>
                                                <div className="cl-row">
                                                    <label className="cl-field">
                                                        <span className="cl-label">Storage</span>
                                                        <input
                                                            className="cl-input"
                                                            value={formData.attributes.storage}
                                                            onChange={(e) => updateAttr("storage", e.target.value)}
                                                            placeholder="e.g. 128GB, 256GB, 1TB"
                                                        />
                                                    </label>
                                                    <label className="cl-field">
                                                        <span className="cl-label">RAM</span>
                                                        <input
                                                            className="cl-input"
                                                            value={formData.attributes.ram}
                                                            onChange={(e) => updateAttr("ram", e.target.value)}
                                                            placeholder="e.g. 4GB, 8GB, 16GB"
                                                        />
                                                    </label>
                                                </div>
                                                <div className="cl-row">
                                                    <label className="cl-field">
                                                        <span className="cl-label">Processor</span>
                                                        <input
                                                            className="cl-input"
                                                            value={formData.attributes.processor}
                                                            onChange={(e) => updateAttr("processor", e.target.value)}
                                                            placeholder="e.g. Intel i5, M1"
                                                        />
                                                    </label>
                                                    <label className="cl-field">
                                                        <span className="cl-label">Screen Size</span>
                                                        <input
                                                            className="cl-input"
                                                            value={formData.attributes.screen_size}
                                                            onChange={(e) => updateAttr("screen_size", e.target.value)}
                                                            placeholder="e.g. 6.1 inch"
                                                        />
                                                    </label>
                                                </div>
                                            </>
                                        )}

                                        {(catName.includes("clothing") || catName.includes("fashion")) && (
                                            <>
                                                <div className="cl-divider" />
                                                <h4 className="cl-subsectionTitle">Clothing Details</h4>
                                                <div className="cl-row">
                                                    <label className="cl-field">
                                                        <span className="cl-label">Fabric</span>
                                                        <input
                                                            className="cl-input"
                                                            value={formData.attributes.fabric}
                                                            onChange={(e) => updateAttr("fabric", e.target.value)}
                                                            placeholder="e.g. Cotton"
                                                        />
                                                    </label>
                                                    <label className="cl-field">
                                                        <span className="cl-label">Fit Type</span>
                                                        <input
                                                            className="cl-input"
                                                            value={formData.attributes.fit_type}
                                                            onChange={(e) => updateAttr("fit_type", e.target.value)}
                                                            placeholder="e.g. Slim Fit"
                                                        />
                                                    </label>
                                                </div>
                                                <div className="cl-row">
                                                    <label className="cl-field">
                                                        <span className="cl-label">Gender</span>
                                                        <select
                                                            className="cl-input"
                                                            value={formData.attributes.gender}
                                                            onChange={(e) => updateAttr("gender", e.target.value)}
                                                        >
                                                            <option value="">Select</option>
                                                            <option value="male">Male</option>
                                                            <option value="female">Female</option>
                                                            <option value="unisex">Unisex</option>
                                                        </select>
                                                    </label>
                                                    <label className="cl-field">
                                                        <span className="cl-label">Size</span>
                                                        <input
                                                            className="cl-input"
                                                            value={formData.attributes.size}
                                                            onChange={(e) => updateAttr("size", e.target.value)}
                                                            placeholder="e.g. L, XL, 42"
                                                        />
                                                    </label>
                                                </div>
                                            </>
                                        )}

                                        {catName.includes("book") && (
                                            <>
                                                <div className="cl-divider" />
                                                <h4 className="cl-subsectionTitle">Book Details</h4>
                                                <div className="cl-row">
                                                    <label className="cl-field">
                                                        <span className="cl-label">Author</span>
                                                        <input
                                                            className="cl-input"
                                                            value={formData.attributes.author}
                                                            onChange={(e) => updateAttr("author", e.target.value)}
                                                            placeholder="e.g. J.K. Rowling"
                                                        />
                                                    </label>
                                                    <label className="cl-field">
                                                        <span className="cl-label">ISBN</span>
                                                        <input
                                                            className="cl-input"
                                                            value={formData.attributes.isbn}
                                                            onChange={(e) => updateAttr("isbn", e.target.value)}
                                                            placeholder="e.g. 978-3-16..."
                                                        />
                                                    </label>
                                                </div>
                                                <div className="cl-row">
                                                    <label className="cl-field">
                                                        <span className="cl-label">Publisher</span>
                                                        <input
                                                            className="cl-input"
                                                            value={formData.attributes.publisher}
                                                            onChange={(e) => updateAttr("publisher", e.target.value)}
                                                        />
                                                    </label>
                                                    <label className="cl-field">
                                                        <span className="cl-label">Edition</span>
                                                        <input
                                                            className="cl-input"
                                                            value={formData.attributes.edition}
                                                            onChange={(e) => updateAttr("edition", e.target.value)}
                                                        />
                                                    </label>
                                                </div>
                                            </>
                                        )}

                                        {catName.includes("furniture") && (
                                            <>
                                                <div className="cl-divider" />
                                                <h4 className="cl-subsectionTitle">Furniture Details</h4>
                                                <div className="cl-row">
                                                    <label className="cl-field">
                                                        <span className="cl-label">Material</span>
                                                        <input
                                                            className="cl-input"
                                                            value={formData.attributes.material}
                                                            onChange={(e) => updateAttr("material", e.target.value)}
                                                            placeholder="e.g. Wood, Steel"
                                                        />
                                                    </label>
                                                    <label className="cl-field">
                                                        <span className="cl-label">Dimensions</span>
                                                        <input
                                                            className="cl-input"
                                                            value={formData.attributes.dimensions}
                                                            onChange={(e) => updateAttr("dimensions", e.target.value)}
                                                            placeholder="e.g. 120x60x75 cm"
                                                        />
                                                    </label>
                                                </div>
                                            </>
                                        )}

                                        {/* Fallback for other categories */}
                                        {(!catName.includes("electronics") && !catName.includes("clothing") && !catName.includes("book") && !catName.includes("furniture")) && (
                                            <div className="cl-row">
                                                <label className="cl-field">
                                                    <span className="cl-label">Year / Age</span>
                                                    <input
                                                        className="cl-input"
                                                        value={formData.attributes.year}
                                                        onChange={(e) => updateAttr("year", e.target.value)}
                                                        placeholder="e.g. 2023"
                                                    />
                                                </label>
                                                <label className="cl-field">
                                                    <span className="cl-label">Color</span>
                                                    <input
                                                        className="cl-input"
                                                        value={formData.attributes.color}
                                                        onChange={(e) => updateAttr("color", e.target.value)}
                                                    />
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        );
                    })()}


                    {/* STEP 4 */}
                    {step === 4 && (
                        <>
                            <h2 className="cl-cardTitle">Photos & videos</h2>
                            <p className="cl-cardHint">
                                Add up to {MAX_IMAGES} images (required) and {MAX_VIDEOS} videos (optional).
                            </p>

                            <div
                                className="cl-dropzone"
                                tabIndex={0}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    processFiles(e.dataTransfer.files);
                                }}
                                onPaste={(e) => {
                                    const items = e.clipboardData?.items || [];
                                    const files = [];
                                    for (const it of items) {
                                        if (it.kind === "file") {
                                            const f = it.getAsFile();
                                            if (f) files.push(f);
                                        }
                                    }
                                    if (files.length) processFiles(files);
                                }}
                                onClick={() => imgRef.current?.click()}
                            >
                                <div className="cl-dropzoneIcon">⬆</div>
                                <div className="cl-dropzoneTitle">Drop media here</div>
                                <div className="cl-dropzoneMeta">
                                    Browse • Paste (Ctrl+V) • Images ({MAX_IMAGE_MB}MB) & Videos ({MAX_VIDEO_MB}MB)
                                </div>
                            </div>

                            <div className="cl-actions cl-actions--media">
                                <button
                                    className="cl-btn cl-btn--soft"
                                    type="button"
                                    onClick={() => imgRef.current?.click()}
                                >
                                    + Add Images
                                </button>
                                <button
                                    className="cl-btn cl-btn--soft"
                                    type="button"
                                    onClick={() => vidRef.current?.click()}
                                >
                                    + Add Videos
                                </button>
                            </div>

                            <input
                                ref={imgRef}
                                type="file"
                                accept="image/*,video/mp4,video/webm,video/ogg,video/quicktime"
                                multiple
                                style={{ display: "none" }}
                                onChange={(e) => processFiles(e.target.files)}
                            />
                            <input
                                ref={vidRef}
                                type="file"
                                accept="video/mp4"
                                multiple
                                style={{ display: "none" }}
                                onChange={(e) => validateAndAddVideos(e.target.files)}
                            />

                            <div className="cl-divider" />

                            <h3 className="cl-sectionTitle">
                                Images ({images.length}/{MAX_IMAGES})
                            </h3>

                            {images.length === 0 ? (
                                <p className="cl-cardHint">At least 1 image is required.</p>
                            ) : (
                                <div className="cl-mediaGrid">
                                    {imagePreviews.map((src, idx) => (
                                        <div className="cl-mediaTile" key={src}>
                                            <img src={src} alt={`img-${idx}`} className="cl-mediaImg" />
                                            <div className="cl-mediaBar">
                                                <span className="cl-mediaTag">{idx === 0 ? "Primary" : `#${idx + 1}`}</span>
                                                <button type="button" className="cl-link" onClick={() => removeImageAt(idx)}>
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {videos.length > 0 && (
                                <>
                                    <div className="cl-divider" />
                                    <h3 className="cl-sectionTitle">
                                        Videos ({videos.length}/{MAX_VIDEOS})
                                    </h3>
                                    <div className="cl-mediaGrid">
                                        {videoPreviews.map((src, idx) => (
                                            <div className="cl-mediaTile" key={src}>
                                                <video src={src} className="cl-mediaImg" controls muted />
                                                <div className="cl-mediaBar">
                                                    <span className="cl-mediaTag">Video #{idx + 1}</span>
                                                    <button type="button" className="cl-link" onClick={() => removeVideoAt(idx)}>
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {/* STEP 5 */}
                    {step === 5 && (
                        <>
                            <h2 className="cl-cardTitle">Publish</h2>
                            <p className="cl-cardHint">Double-check then publish.</p>

                            <div className="cl-reviewBox">
                                <div>
                                    <strong>Category</strong>
                                    <span>{categories.find((c) => c.id === formData.categoryId)?.name || "-"}</span>
                                </div>
                                <div>
                                    <strong>Title</strong>
                                    <span>{formData.title || "-"}</span>
                                </div>
                                <div>
                                    <strong>Price</strong>
                                    <span>{formData.price ? `${formData.price} ${formData.currency}` : "-"}</span>
                                </div>
                                <div>
                                    <strong>Condition</strong>
                                    <span>{formData.condition || "-"}</span>
                                </div>
                                <div>
                                    <strong>Location</strong>
                                    <span>{formData.location || "-"}</span>
                                </div>
                                <div>
                                    <strong>Negotiable</strong>
                                    <span>{formData.negotiable ? "Yes" : "No"}</span>
                                </div>
                                <div>
                                    <strong>Images</strong>
                                    <span>{images.length}</span>
                                </div>
                                <div>
                                    <strong>Videos</strong>
                                    <span>{videos.length}</span>
                                </div>
                            </div>

                            <div className="cl-actions">
                                <button
                                    className="cl-btn cl-btn--primary"
                                    type="button"
                                    onClick={handlePublish}
                                    disabled={!canGoNext || loading}
                                >
                                    {loading ? "Publishing..." : "Publish Listing"}
                                </button>
                            </div>
                        </>
                    )}

                    <div className="cl-nav">
                        <button
                            className="cl-btn cl-btn--soft"
                            type="button"
                            onClick={goBack}
                            disabled={step === 1 || loading}
                        >
                            ← Back
                        </button>

                        {step < 5 ? (
                            <button
                                className="cl-btn cl-btn--primary"
                                type="button"
                                onClick={goNext}
                                disabled={!canGoNext || loading}
                            >
                                Next →
                            </button>
                        ) : null}
                    </div>
                </section >
            </div >
        </div >
    );
};

export default CreateListing;
