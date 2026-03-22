import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import "../styles/CreateListing.css";

const MAX_IMAGES = 8;
const MAX_IMAGE_MB = 2;
const MAX_VIDEOS = 2;
const MAX_VIDEO_MB = 20;
const ACCEPTED_IMAGE = ["image/jpeg", "image/png", "image/webp"];
const ACCEPTED_VIDEO = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];

const quillModules = {
    toolbar: [
        ['bold', 'italic', 'underline']
    ]
};

const EditListing = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { listingId } = useParams();

    const fileRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const [listing, setListing] = useState(null);
    const [categories, setCategories] = useState([]);

    const [formData, setFormData] = useState({
        title: "",
        price: "",
        description: "",
        condition: "",
        negotiable: false,
        location: "",
        attributes: {
            brand: "",
            model: "",
            color: "",
            size: "",
            material: "",
            weight: "",
            dimensions: "",
            warranty: "",
            year: "",
            quantity: "",
            storage: "",
            ram: "",
            processor: "",
            screen_size: "",
            battery: "",
            fabric: "",
            fit_type: "",
            gender: "",
            author: "",
            isbn: "",
            publisher: "",
            edition: "",
            language: "",
            assembly_required: "",
            custom_field_1: "",
            custom_field_2: "",
        },
        stock_count: 1,
    });

    const [touched, setTouched] = useState({});

    const [showOptional, setShowOptional] = useState(false);
    const [images, setImages] = useState([]); // existing images rows
    const [newFiles, setNewFiles] = useState([]); // File[]
    const [newPreviews, setNewPreviews] = useState([]); // string[]
    const [videos, setVideos] = useState([]); // existing { id, video_url, sort_order }
    const [newVideoFiles, setNewVideoFiles] = useState([]); // File[]

    const canSave = useMemo(() => {
        return (
            formData.title.trim().length > 0 &&
            String(formData.price).trim().length > 0 &&
            formData.description.trim().length > 0 &&
            formData.condition.trim().length > 0 &&
            formData.location.trim().length > 0 &&
            !saving
        );
    }, [formData, saving]);

    useEffect(() => {
        let mounted = true;

        const fetchListing = async () => {
            try {
                setLoading(true);
                setErrorMsg("");

                if (!user?.id) return;

                const { data: catData } = await supabase.from("categories").select("*");
                if (catData) setCategories(catData);

                const { data, error } = await supabase
                    .from("listings")
                    .select(`
            *,
            categories ( name ),
            listing_images ( id, image_url, is_primary, sort_order ),
            listing_videos ( id, video_url, sort_order )
          `)
                    .eq("id", listingId)
                    .single();

                if (error) throw error;

                if (data.seller_id !== user.id) {
                    navigate("/my-listings");
                    return;
                }

                if (!mounted) return;

                setListing(data);
                setImages((data.listing_images || []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));
                setVideos((data.listing_videos || []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));

                const attrs = data.attributes || {};
                setFormData({
                    title: data.title || "",
                    price: data.price ?? "",
                    description: data.description || "",
                    condition: data.condition || "",
                    negotiable: !!data.negotiable,
                    location: data.location || "",
                    stock_count: data.stock_count || 1,
                    attributes: {
                        brand: attrs.brand || "",
                        model: attrs.model || "",
                        color: attrs.color || "",
                        size: attrs.size || "",
                        material: attrs.material || "",
                        weight: attrs.weight || "",
                        dimensions: attrs.dimensions || "",
                        warranty: attrs.warranty || "",
                        year: attrs.year || "",
                        quantity: attrs.quantity || "",
                        storage: attrs.storage || "",
                        ram: attrs.ram || "",
                        processor: attrs.processor || "",
                        screen_size: attrs.screen_size || "",
                        battery: attrs.battery || "",
                        fabric: attrs.fabric || "",
                        fit_type: attrs.fit_type || "",
                        gender: attrs.gender || "",
                        author: attrs.author || "",
                        isbn: attrs.isbn || "",
                        publisher: attrs.publisher || "",
                        edition: attrs.edition || "",
                        language: attrs.language || "",
                        assembly_required: attrs.assembly_required || "",
                        custom_field_1: attrs.custom_field_1 || "",
                        custom_field_2: attrs.custom_field_2 || "",
                    },
                });
            } catch (e) {
                console.error(e);
                setErrorMsg("Could not load listing details.");
            } finally {
                setLoading(false);
            }
        };

        if (user && listingId) fetchListing();

        return () => {
            mounted = false;
        };
    }, [user, listingId, navigate]);

    const updateField = (key, value) => {
        setFormData((p) => ({ ...p, [key]: value }));
        setTouched((p) => ({ ...p, [key]: true }));
    };

    const updateAttr = (key, value) => {
        setFormData((p) => ({ ...p, attributes: { ...p.attributes, [key]: value } }));
        setTouched((p) => ({ ...p, [`attr_${key}`]: true }));
    };

    const validateAndAddFiles = (fileList) => {
        const incoming = Array.from(fileList || []);
        if (!incoming.length) return;

        const totalCount = images.length + newFiles.length;
        if (totalCount >= MAX_IMAGES) {
            setErrorMsg(`You can upload up to ${MAX_IMAGES} images.`);
            return;
        }

        const nextFiles = [...newFiles];
        const nextPrev = [...newPreviews];

        for (const f of incoming) {
            if (images.length + nextFiles.length >= MAX_IMAGES) break;

            if (!ACCEPTED_IMAGE.includes(f.type)) {
                setErrorMsg("Only JPG, PNG, WEBP images are allowed.");
                continue;
            }

            const mb = f.size / (1024 * 1024);
            if (mb > MAX_IMAGE_MB) {
                setErrorMsg(`Each image must be <= ${MAX_IMAGE_MB}MB.`);
                continue;
            }

            nextFiles.push(f);
            nextPrev.push(URL.createObjectURL(f));
        }

        setNewFiles(nextFiles);
        setNewPreviews(nextPrev);
    };

    const removeNewAt = (idx) => {
        setNewFiles((p) => p.filter((_, i) => i !== idx));
        setNewPreviews((p) => p.filter((_, i) => i !== idx));
    };

    const validateAndAddVideos = (fileList) => {
        const incoming = Array.from(fileList || []);
        if (!incoming.length) return;

        const totalCount = videos.length + newVideoFiles.length;
        if (totalCount >= MAX_VIDEOS) {
            setErrorMsg(`You can upload up to ${MAX_VIDEOS} videos.`);
            return;
        }

        const nextFiles = [...newVideoFiles];
        for (const f of incoming) {
            if (videos.length + nextFiles.length >= MAX_VIDEOS) break;

            if (!ACCEPTED_VIDEO.includes(f.type)) {
                setErrorMsg("Only MP4, WEBM, OGG, MOV videos are allowed.");
                continue;
            }
            const mb = f.size / (1024 * 1024);
            if (mb > MAX_VIDEO_MB) {
                setErrorMsg(`Each video must be <= ${MAX_VIDEO_MB}MB.`);
                continue;
            }
            nextFiles.push(f);
        }
        setNewVideoFiles(nextFiles);
    };

    const removeNewVideoAt = (idx) => {
        setNewVideoFiles((p) => p.filter((_, i) => i !== idx));
    };

    const processFiles = (files) => {
        const incoming = Array.from(files || []);
        const img = [];
        const vid = [];
        incoming.forEach(f => {
            if (f.type.startsWith("image/")) img.push(f);
            else if (f.type.startsWith("video/")) vid.push(f);
        });
        if (img.length) validateAndAddFiles(img);
        if (vid.length) validateAndAddVideos(vid);
    };

    // ✅ Handle Paste
    useEffect(() => {
        const handlePaste = (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            const extracted = [];
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf("image") !== -1 || items[i].type.indexOf("video") !== -1) {
                    const blob = items[i].getAsFile();
                    if (blob) extracted.push(blob);
                }
            }
            if (extracted.length > 0) {
                e.preventDefault();
                processFiles(extracted);
            }
        };

        window.addEventListener("paste", handlePaste);
        return () => window.removeEventListener("paste", handlePaste);
    }, [images, newFiles, videos, newVideoFiles]);

    // ✅ Handle Drop
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            processFiles(files);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const [isDragging, setIsDragging] = useState(false);

    const removeExistingImage = async (imgRow) => {
        // DB delete only (optionally you can also delete from storage later)
        try {
            setSaving(true);
            setErrorMsg("");

            const { error } = await supabase
                .from("listing_images")
                .delete()
                .eq("id", imgRow.id);

            if (error) throw error;

            setImages((p) => p.filter((x) => x.id !== imgRow.id));
        } catch (e) {
            console.error(e);
            setErrorMsg(e.message || "Could not remove image.");
        } finally {
            setSaving(false);
        }
    };

    const removeExistingVideo = async (vidRow) => {
        try {
            setSaving(true);
            setErrorMsg("");
            const { error } = await supabase.from("listing_videos").delete().eq("id", vidRow.id);
            if (error) throw error;
            setVideos((p) => p.filter((x) => x.id !== vidRow.id));
        } catch (e) {
            console.error(e);
            setErrorMsg(e.message || "Could not remove video.");
        } finally {
            setSaving(false);
        }
    };

    const setPrimary = async (imgId) => {
        try {
            setSaving(true);
            setErrorMsg("");

            // set all to false first
            const { error: clearErr } = await supabase
                .from("listing_images")
                .update({ is_primary: false })
                .eq("listing_id", listingId);

            if (clearErr) throw clearErr;

            const { error: setErr } = await supabase
                .from("listing_images")
                .update({ is_primary: true, sort_order: 0 })
                .eq("id", imgId);

            if (setErr) throw setErr;

            // refresh local
            setImages((p) =>
                p
                    .map((x) => ({ ...x, is_primary: x.id === imgId }))
                    .sort((a, b) => (b.is_primary === true) - (a.is_primary === true))
            );
        } catch (e) {
            console.error(e);
            setErrorMsg(e.message || "Could not set primary image.");
        } finally {
            setSaving(false);
        }
    };

    const uploadToBucket = async (bucket, path, file) => {
        const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
            upsert: false,
            cacheControl: "3600",
        });
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        return data.publicUrl;
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && canSave) {
            e.preventDefault();
            handleSave(e);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrorMsg("");

        try {
            if (!user?.id) throw new Error("You must be logged in.");
            if (!listingId) throw new Error("Invalid listing.");
            if (!canSave) throw new Error("Please complete required fields.");

            // 1) update listing
            const { data: updatedData, error: updateErr } = await supabase
                .from("listings")
                .update({
                    title: formData.title.trim(),
                    description: formData.description.trim(),
                    price: parseFloat(formData.price),
                    condition: formData.condition,
                    negotiable: !!formData.negotiable,
                    location: formData.location.trim(),
                    stock_count: parseInt(formData.stock_count, 10) >= 0 ? parseInt(formData.stock_count, 10) : 1,
                    attributes: {
                        ...formData.attributes,
                        // Trim all strings in attributes
                        brand: formData.attributes.brand?.trim() || null,
                        model: formData.attributes.model?.trim() || null,
                        color: formData.attributes.color?.trim() || null,
                        size: formData.attributes.size?.trim() || null,
                        material: formData.attributes.material?.trim() || null,
                        weight: formData.attributes.weight?.trim() || null,
                        dimensions: formData.attributes.dimensions?.trim() || null,
                        warranty: formData.attributes.warranty?.trim() || null,
                        year: formData.attributes.year?.trim() || null,
                        quantity: formData.attributes.quantity?.trim() || null,
                        storage: formData.attributes.storage?.trim() || null,
                        ram: formData.attributes.ram?.trim() || null,
                        processor: formData.attributes.processor?.trim() || null,
                        screen_size: formData.attributes.screen_size?.trim() || null,
                        battery: formData.attributes.battery?.trim() || null,
                        fabric: formData.attributes.fabric?.trim() || null,
                        fit_type: formData.attributes.fit_type?.trim() || null,
                        gender: formData.attributes.gender?.trim() || null,
                        author: formData.attributes.author?.trim() || null,
                        isbn: formData.attributes.isbn?.trim() || null,
                        publisher: formData.attributes.publisher?.trim() || null,
                        edition: formData.attributes.edition?.trim() || null,
                        language: formData.attributes.language?.trim() || null,
                        assembly_required: formData.attributes.assembly_required?.trim() || null,
                        custom_field_1: formData.attributes.custom_field_1?.trim() || null,
                        custom_field_2: formData.attributes.custom_field_2?.trim() || null,
                    },
                    updated_at: new Date().toISOString(),
                })
                .eq("id", listingId)
                .select();

            if (updateErr) throw updateErr;

            if (!updatedData || updatedData.length === 0) {
                throw new Error("Update failed. You might not have permission to edit this listing.");
            }

            // 2) upload new images if any
            if (newFiles.length > 0) {
                const startSort = images.length; // continue after existing
                const rows = [];

                for (let i = 0; i < newFiles.length; i++) {
                    const f = newFiles[i];
                    const ext = f.name.split(".").pop();
                    const name = `${crypto?.randomUUID?.() || Math.random()}.${ext}`;
                    const path = `${user.id}/${listingId}/${name}`;

                    const url = await uploadToBucket("listing-images", path, f);

                    rows.push({
                        listing_id: listingId,
                        image_url: url,
                        is_primary: false,
                        sort_order: startSort + i,
                    });
                }

                const { data: inserted, error: imgErr } = await supabase
                    .from("listing_images")
                    .insert(rows)
                    .select("id, image_url, is_primary, sort_order");

                if (imgErr) throw imgErr;

                setImages((p) => [...p, ...(inserted || [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));
                setNewFiles([]);
                setNewPreviews([]);
            }

            // 3) upload new videos if any
            if (newVideoFiles.length > 0) {
                const startSortVideo = videos.length;
                const vRows = [];
                for (let i = 0; i < newVideoFiles.length; i++) {
                    const f = newVideoFiles[i];
                    const ext = f.name.split(".").pop();
                    const name = `${crypto?.randomUUID?.() || Math.random()}.${ext}`;
                    const path = `${user.id}/${listingId}/${name}`;
                    const url = await uploadToBucket("listing-images", path, f);

                    vRows.push({
                        listing_id: listingId,
                        video_url: url,
                        sort_order: startSortVideo + i,
                    });
                }
                const { data: insertedV, error: vidErr } = await supabase
                    .from("listing_videos")
                    .insert(vRows)
                    .select("id, video_url, sort_order");

                if (vidErr) throw vidErr;
                setVideos((p) => [...p, ...(insertedV || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
                setNewVideoFiles([]);
            }

            navigate(`/product/${listingId}`);
        } catch (e2) {
            console.error(e2);
            setErrorMsg(e2.message || "Failed to save changes.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="cl-page">
                <div className="cl-card">
                    <h2 className="cl-cardTitle">Loading listing…</h2>
                </div>
            </div>
        );
    }

    if (!listing) {
        return (
            <div className="cl-page">
                <div className="cl-card">
                    <h2 className="cl-cardTitle">Listing not found</h2>
                    <button className="cl-btn cl-btn--soft" onClick={() => navigate("/my-listings")}>
                        Back
                    </button>
                </div>
            </div>
        );
    }
    const selectedCat = categories.find((c) => c.id === formData.categoryId);
    const catName = selectedCat?.name?.toLowerCase() || "";

    return (
        <div
            className={`cl-page ${isDragging ? "cl-dragging" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
        >
            <header className="cl-topbar">
                <div>
                    <h1 className="cl-title">Edit Listing</h1>
                    <p className="cl-subtitle">Update details and manage media.</p>
                </div>

                <div className="cl-badges">
                    <span className="cl-badge">My Listings</span>
                    <span className="cl-badge cl-badge--accent">Edit</span>
                </div>
            </header>

            {errorMsg && <div className="cl-alert">{errorMsg}</div>}

            <div className="cl-grid">
                <section className="cl-card">
                    <form onSubmit={handleSave} className="cl-form">
                        <div className="cl-row">
                            <label className="cl-field">
                                <span className="cl-label">Title *</span>
                                <input
                                    className={`cl-input ${touched.title && !formData.title.trim() ? "is-invalid" : ""}`}
                                    value={formData.title}
                                    onChange={(e) => updateField("title", e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="e.g. Logitech MX Master 3S Mouse"
                                />
                                {touched.title && !formData.title.trim() && (
                                    <span className="cl-error-text">Title is required</span>
                                )}
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
                                    min="0"
                                    value={formData.stock_count}
                                    onChange={(e) => updateField("stock_count", e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Units available"
                                />
                            </label>
                        </div>

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

                        <label className="cl-field cl-check" style={{ marginTop: "12px" }}>
                            <span className="cl-label cl-label--inline">Negotiable</span>
                            <input
                                type="checkbox"
                                checked={formData.negotiable}
                                onChange={(e) => updateField("negotiable", e.target.checked)}
                            />
                        </label>

                        <label className="cl-field">
                            <span className="cl-label">Description *</span>
                            <ReactQuill
                                theme="snow"
                                modules={quillModules}
                                value={formData.description}
                                onChange={(val) => updateField("description", (val === '<p><br></p>' ? '' : val))}
                                placeholder="Describe the item's condition, features, and any defects. Be as detailed as possible."
                                className={touched.description && !formData.description.trim() ? "is-invalid" : ""}
                            />
                            {touched.description && !formData.description.trim() && (
                                <span className="cl-error-text">Description is required</span>
                            )}
                        </label>

                        <div className="cl-divider" />

                        <div className="cl-divider" />
                        <h3 className="cl-sectionTitle">Optional Product Details</h3>
                        <p className="cl-cardHint" style={{ marginBottom: "1rem" }}>
                            Fill in relevant fields for your product. All fields are optional.
                        </p>

                        {/* General Attributes */}
                        <h4 className="cl-subsectionTitle">General Information</h4>
                        <div className="cl-row">
                            <label className="cl-field">
                                <span className="cl-label">Brand</span>
                                <input className="cl-input" value={formData.attributes.brand} onChange={(e) => updateAttr("brand", e.target.value)} placeholder="e.g. Apple, Samsung" />
                            </label>
                            <label className="cl-field">
                                <span className="cl-label">Model</span>
                                <input className="cl-input" value={formData.attributes.model} onChange={(e) => updateAttr("model", e.target.value)} placeholder="e.g. iPhone 13" />
                            </label>
                        </div>

                        <h3 className="cl-sectionTitle" style={{ marginTop: "1rem" }}>Additional Details</h3>

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
                                            placeholder="e.g. iPhone 13"
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

                        <div className="cl-actions">
                            <button type="button" className="cl-btn cl-btn--soft" onClick={() => navigate("/my-listings")} disabled={saving}>
                                Cancel
                            </button>
                            <button type="submit" className="cl-btn cl-btn--primary" disabled={!canSave}>
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </section>

                <aside className="cl-card cl-side">
                    <div className="cl-cardHead">
                        <h2 className="cl-cardTitle">Media</h2>
                        <p className="cl-cardHint">Manage images (set primary, remove, add more).</p>
                    </div>

                    <div className="cl-actions">
                        <button type="button" className="cl-btn cl-btn--soft" onClick={() => fileRef.current?.click()} disabled={saving}>
                            + Add Media
                        </button>
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*,video/mp4,video/webm,video/ogg,video/quicktime"
                            multiple
                            style={{ display: "none" }}
                            onChange={(e) => processFiles(e.target.files)}
                        />
                    </div>

                    <div className="cl-divider" />

                    <h3 className="cl-sectionTitle">Existing images ({images.length}/{MAX_IMAGES})</h3>
                    {images.length === 0 ? (
                        <p className="cl-cardHint">No images saved yet.</p>
                    ) : (
                        <div className="cl-mediaGrid">
                            {images.map((img) => (
                                <div className="cl-mediaTile" key={img.id}>
                                    <img src={img.image_url} alt="listing" className="cl-mediaImg" />
                                    <div className="cl-mediaBar">
                                        <span>{img.is_primary ? "Primary" : "Image"}</span>
                                        <div style={{ display: "flex", gap: 10 }}>
                                            {!img.is_primary && (
                                                <button type="button" className="cl-link" onClick={() => setPrimary(img.id)} disabled={saving}>
                                                    Set primary
                                                </button>
                                            )}
                                            <button type="button" className="cl-link" onClick={() => removeExistingImage(img)} disabled={saving}>
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* VIDEOS */}
                    <div className="cl-divider" />
                    <h3 className="cl-sectionTitle">Videos ({videos.length})</h3>
                    {videos.map((v) => (
                        <div className="cl-mediaTile" key={v.id}>
                            <video src={v.video_url} className="cl-mediaImg" controls muted />
                            <div className="cl-mediaBar">
                                <span>Video</span>
                                <button type="button" className="cl-link" onClick={() => removeExistingVideo(v)} disabled={saving}>Remove</button>
                            </div>
                        </div>
                    ))}

                    <div className="cl-divider" />

                    <h3 className="cl-sectionTitle">New uploads ({newFiles.length + newVideoFiles.length})</h3>
                    {newFiles.length === 0 && newVideoFiles.length === 0 ? (
                        <p className="cl-cardHint">Select files to upload and save.</p>
                    ) : (
                        <div className="cl-mediaGrid">
                            {newPreviews.map((src, idx) => (
                                <div className="cl-mediaTile" key={src}>
                                    <img src={src} alt={`new-${idx}`} className="cl-mediaImg" />
                                    <div className="cl-mediaBar">
                                        <span>New Img</span>
                                        <button type="button" className="cl-link" onClick={() => removeNewAt(idx)} disabled={saving}>
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {newVideoFiles.map((f, idx) => (
                                <div className="cl-mediaTile" key={`v-${idx}`}>
                                    <div className="cl-mediaImg" style={{ display: 'grid', placeItems: 'center', background: '#000', color: '#fff' }}>
                                        VIDEO
                                    </div>
                                    <div className="cl-mediaBar">
                                        <span>New Vid</span>
                                        <button type="button" className="cl-link" onClick={() => removeNewVideoAt(idx)} disabled={saving}>
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
};

export default EditListing;
