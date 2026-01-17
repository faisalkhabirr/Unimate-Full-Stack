import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import "../styles/CreateListing.css";

const MAX_IMAGES = 8;
const MAX_IMAGE_MB = 2;
const MAX_VIDEOS = 2;
const MAX_VIDEO_MB = 20;
const ACCEPTED_IMAGE = ["image/jpeg", "image/png", "image/webp"];
const ACCEPTED_VIDEO = ["video/mp4"];

const EditListing = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { listingId } = useParams();

    const fileRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const [listing, setListing] = useState(null);

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
    });

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

                const { data, error } = await supabase
                    .from("listings")
                    .select(`
            *,
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
    };

    const updateAttr = (key, value) => {
        setFormData((p) => ({ ...p, attributes: { ...p.attributes, [key]: value } }));
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
                setErrorMsg("Only MP4 videos are allowed.");
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
                    const url = await uploadToBucket("listing-videos", path, f);

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
                                <input className="cl-input" value={formData.title} onChange={(e) => updateField("title", e.target.value)} />
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
                                />
                            </label>
                        </div>

                        <div className="cl-row">
                            <label className="cl-field">
                                <span className="cl-label">Condition *</span>
                                <select className="cl-input" value={formData.condition} onChange={(e) => updateField("condition", e.target.value)}>
                                    <option value="">Select condition</option>
                                    <option value="new">Brand new</option>
                                    <option value="like_new">Like new</option>
                                    <option value="used">Used</option>
                                    <option value="refurbished">Refurbished</option>
                                </select>
                            </label>

                            <label className="cl-field cl-check">
                                <span className="cl-label">Negotiable</span>
                                <input
                                    type="checkbox"
                                    checked={formData.negotiable}
                                    onChange={(e) => updateField("negotiable", e.target.checked)}
                                />
                            </label>
                        </div>

                        <label className="cl-field">
                            <span className="cl-label">Pickup location *</span>
                            <input className="cl-input" value={formData.location} onChange={(e) => updateField("location", e.target.value)} />
                        </label>

                        <label className="cl-field">
                            <span className="cl-label">Description *</span>
                            <textarea
                                className="cl-input cl-textarea"
                                rows={6}
                                value={formData.description}
                                onChange={(e) => updateField("description", e.target.value)}
                            />
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

                        <div className="cl-row">
                            <label className="cl-field">
                                <span className="cl-label">Color</span>
                                <input className="cl-input" value={formData.attributes.color} onChange={(e) => updateAttr("color", e.target.value)} placeholder="e.g. Black, White" />
                            </label>
                            <label className="cl-field">
                                <span className="cl-label">Size</span>
                                <input className="cl-input" value={formData.attributes.size} onChange={(e) => updateAttr("size", e.target.value)} placeholder="e.g. M, L, XL" />
                            </label>
                        </div>

                        <div className="cl-row">
                            <label className="cl-field">
                                <span className="cl-label">Material</span>
                                <input className="cl-input" value={formData.attributes.material} onChange={(e) => updateAttr("material", e.target.value)} placeholder="e.g. Cotton, Leather" />
                            </label>
                            <label className="cl-field">
                                <span className="cl-label">Weight</span>
                                <input className="cl-input" value={formData.attributes.weight} onChange={(e) => updateAttr("weight", e.target.value)} placeholder="e.g. 500g, 2kg" />
                            </label>
                        </div>

                        <div className="cl-row">
                            <label className="cl-field">
                                <span className="cl-label">Dimensions (L×W×H)</span>
                                <input className="cl-input" value={formData.attributes.dimensions} onChange={(e) => updateAttr("dimensions", e.target.value)} placeholder="e.g. 20×15×5 cm" />
                            </label>
                            <label className="cl-field">
                                <span className="cl-label">Warranty</span>
                                <input className="cl-input" value={formData.attributes.warranty} onChange={(e) => updateAttr("warranty", e.target.value)} placeholder="e.g. 1 year" />
                            </label>
                        </div>

                        <div className="cl-row">
                            <label className="cl-field">
                                <span className="cl-label">Year / Age</span>
                                <input className="cl-input" value={formData.attributes.year} onChange={(e) => updateAttr("year", e.target.value)} placeholder="e.g. 2023" />
                            </label>
                            <label className="cl-field">
                                <span className="cl-label">Quantity Available</span>
                                <input className="cl-input" type="number" min="1" value={formData.attributes.quantity} onChange={(e) => updateAttr("quantity", e.target.value)} placeholder="e.g. 1, 5" />
                            </label>
                        </div>

                        {/* Electronics */}
                        <div className="cl-divider" />
                        <h4 className="cl-subsectionTitle">Electronics</h4>
                        <div className="cl-row">
                            <label className="cl-field">
                                <span className="cl-label">Storage</span>
                                <input className="cl-input" value={formData.attributes.storage} onChange={(e) => updateAttr("storage", e.target.value)} placeholder="e.g. 128GB, 1TB" />
                            </label>
                            <label className="cl-field">
                                <span className="cl-label">RAM</span>
                                <input className="cl-input" value={formData.attributes.ram} onChange={(e) => updateAttr("ram", e.target.value)} placeholder="e.g. 8GB, 16GB" />
                            </label>
                        </div>
                        <div className="cl-row">
                            <label className="cl-field">
                                <span className="cl-label">Processor</span>
                                <input className="cl-input" value={formData.attributes.processor} onChange={(e) => updateAttr("processor", e.target.value)} placeholder="e.g. Intel i5" />
                            </label>
                            <label className="cl-field">
                                <span className="cl-label">Screen Size</span>
                                <input className="cl-input" value={formData.attributes.screen_size} onChange={(e) => updateAttr("screen_size", e.target.value)} placeholder="e.g. 15.6 inch" />
                            </label>
                        </div>

                        {/* Clothing */}
                        <div className="cl-divider" />
                        <h4 className="cl-subsectionTitle">Clothing</h4>
                        <div className="cl-row">
                            <label className="cl-field">
                                <span className="cl-label">Fabric</span>
                                <input className="cl-input" value={formData.attributes.fabric} onChange={(e) => updateAttr("fabric", e.target.value)} placeholder="e.g. Cotton" />
                            </label>
                            <label className="cl-field">
                                <span className="cl-label">Fit Type</span>
                                <input className="cl-input" value={formData.attributes.fit_type} onChange={(e) => updateAttr("fit_type", e.target.value)} placeholder="e.g. Slim" />
                            </label>
                        </div>
                        <div className="cl-row">
                            <label className="cl-field">
                                <span className="cl-label">Gender</span>
                                <select className="cl-input" value={formData.attributes.gender} onChange={(e) => updateAttr("gender", e.target.value)}>
                                    <option value="">Select</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="unisex">Unisex</option>
                                    <option value="kids">Kids</option>
                                </select>
                            </label>
                            <div className="cl-field cl-field--ghost" />
                        </div>

                        {/* Books */}
                        <div className="cl-divider" />
                        <h4 className="cl-subsectionTitle">Books</h4>
                        <div className="cl-row">
                            <label className="cl-field">
                                <span className="cl-label">Author</span>
                                <input className="cl-input" value={formData.attributes.author} onChange={(e) => updateAttr("author", e.target.value)} />
                            </label>
                            <label className="cl-field">
                                <span className="cl-label">ISBN</span>
                                <input className="cl-input" value={formData.attributes.isbn} onChange={(e) => updateAttr("isbn", e.target.value)} />
                            </label>
                        </div>

                        {/* Others */}
                        <div className="cl-divider" />
                        <h4 className="cl-subsectionTitle">Other Details</h4>
                        <div className="cl-row">
                            <label className="cl-field">
                                <span className="cl-label">Assembly Required?</span>
                                <input className="cl-input" value={formData.attributes.assembly_required} onChange={(e) => updateAttr("assembly_required", e.target.value)} placeholder="e.g. Yes/No" />
                            </label>
                            <div className="cl-field cl-field--ghost" />
                        </div>

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
                            accept="image/*,video/mp4"
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
