import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { chatService } from "../services/chatService";
// import ProductModal from "../components/ProductModal";
import "../styles/Marketplace.css";

/**
 * NOTE:
 * - Filters work best if your listings table has some of these columns:
 *   - in_stock (boolean) OR stock (number)
 *   - category OR product_type (string)
 *   - color (string), material (string), size (string)
 *
 * If they don't exist, UI still renders and filtering gracefully falls back.
 */

const Marketplace = () => {
    const [listings, setListings] = useState([]);
    // const [selectedListing, setSelectedListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // keep your search bar section
    const [searchQuery, setSearchQuery] = useState("");

    // collection-style UI controls
    const [filtersOpen, setFiltersOpen] = useState(true);
    const [sort, setSort] = useState("rating"); // UI says "Sort by average rating" like screenshot

    // filters
    const [inStock, setInStock] = useState(false);
    const [outOfStock, setOutOfStock] = useState(false);

    const [selectedTypes, setSelectedTypes] = useState(new Set()); // product types
    const [selectedColors, setSelectedColors] = useState(new Set());
    const [selectedMaterials, setSelectedMaterials] = useState(new Set());
    const [selectedSizes, setSelectedSizes] = useState(new Set());

    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchListings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchListings = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("listings")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setListings(data || []);
        } catch (err) {
            console.error("Error fetching listings:", err);
            setError("Could not load listings. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleMessage = async (listing) => {
        if (!user) {
            navigate("/login");
            return;
        }

        if (user.id === listing.seller_id) {
            alert("You cannot chat with yourself!");
            return;
        }

        try {
            const chatId = await chatService.getOrCreateChat(
                listing.id,
                listing.seller_id,
                user.id
            );
            navigate(`/chat/${chatId}`);
        } catch (error) {
            console.error("Error starting chat:", error);
            alert("Could not start chat. Please try again.");
        }
    };

    // Helpers to read optional fields safely
    const getType = (item) =>
        (item.product_type || item.category || item.type || "").toString().trim();

    const getColor = (item) => (item.color || "").toString().trim();
    const getMaterial = (item) => (item.material || "").toString().trim();
    const getSize = (item) => (item.size || "").toString().trim();

    const isItemInStock = (item) => {
        // supports boolean in_stock OR numeric stock
        if (typeof item.in_stock === "boolean") return item.in_stock;
        if (typeof item.stock === "number") return item.stock > 0;
        // if unknown, treat as in stock so items don't disappear unexpectedly
        return true;
    };

    // Build filter options from listings
    const filterOptions = useMemo(() => {
        const typeCount = new Map();
        const colorCount = new Map();
        const materialCount = new Map();
        const sizeCount = new Map();

        let minPrice = Infinity;
        let maxPrice = -Infinity;

        let inCount = 0;
        let outCount = 0;

        listings.forEach((item) => {
            const t = getType(item);
            if (t) typeCount.set(t, (typeCount.get(t) || 0) + 1);

            const c = getColor(item);
            if (c) colorCount.set(c, (colorCount.get(c) || 0) + 1);

            const m = getMaterial(item);
            if (m) materialCount.set(m, (materialCount.get(m) || 0) + 1);

            const s = getSize(item);
            if (s) sizeCount.set(s, (sizeCount.get(s) || 0) + 1);

            const price = Number(item.price || 0);
            if (!Number.isNaN(price)) {
                minPrice = Math.min(minPrice, price);
                maxPrice = Math.max(maxPrice, price);
            }

            if (isItemInStock(item)) inCount += 1;
            else outCount += 1;
        });

        if (minPrice === Infinity) minPrice = 0;
        if (maxPrice === -Infinity) maxPrice = 0;

        return {
            typeCount,
            colorCount,
            materialCount,
            sizeCount,
            priceMin: minPrice,
            priceMax: maxPrice,
            inCount,
            outCount,
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [listings]);

    // Price range state (initialized once we know bounds)
    const [priceMin, setPriceMin] = useState(0);
    const [priceMax, setPriceMax] = useState(0);

    useEffect(() => {
        // only set initial bounds when listings load
        setPriceMin(filterOptions.priceMin);
        setPriceMax(filterOptions.priceMax);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterOptions.priceMin, filterOptions.priceMax]);

    useEffect(() => {
        const mq = window.matchMedia("(max-width: 900px)");

        const apply = () => setFiltersOpen(!mq.matches);
        apply();

        mq.addEventListener?.("change", apply);
        return () => mq.removeEventListener?.("change", apply);
    }, []);

    const toggleSetValue = (setState, value) => {
        setState((prev) => {
            const next = new Set(prev);
            if (next.has(value)) next.delete(value);
            else next.add(value);
            return next;
        });
    };

    // Main filtered listings (search + all filters + sort)
    const filteredListings = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();

        let arr = listings.filter((item) => {
            const title = (item.title || "").toLowerCase();
            const desc = (item.description || "").toLowerCase();
            const matchesSearch = !q || title.includes(q) || desc.includes(q);

            // availability
            const stockStatus = isItemInStock(item);
            const matchesStock =
                (!inStock && !outOfStock) ||
                (inStock && stockStatus) ||
                (outOfStock && !stockStatus);

            // product type
            const t = getType(item);
            const matchesType =
                selectedTypes.size === 0 || (t && selectedTypes.has(t));

            // color/material/size
            const c = getColor(item);
            const m = getMaterial(item);
            const s = getSize(item);

            const matchesColor =
                selectedColors.size === 0 || (c && selectedColors.has(c));
            const matchesMaterial =
                selectedMaterials.size === 0 || (m && selectedMaterials.has(m));
            const matchesSize =
                selectedSizes.size === 0 || (s && selectedSizes.has(s));

            // price
            const p = Number(item.price || 0);
            const matchesPrice =
                Number.isNaN(p) ? true : p >= priceMin && p <= priceMax;

            return (
                matchesSearch &&
                matchesStock &&
                matchesType &&
                matchesColor &&
                matchesMaterial &&
                matchesSize &&
                matchesPrice
            );
        });

        // sort (rating-like UI; your DB probably doesn't have rating so we fall back)
        if (sort === "price_low") arr.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
        if (sort === "price_high") arr.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
        if (sort === "latest") arr.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

        // "rating" sort fallback: if item.rating exists, use it; otherwise keep current (latest from query)
        if (sort === "rating") {
            const hasRating = arr.some((x) => x.rating != null);
            if (hasRating) arr.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
        }

        return arr;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        listings,
        searchQuery,
        inStock,
        outOfStock,
        selectedTypes,
        selectedColors,
        selectedMaterials,
        selectedSizes,
        priceMin,
        priceMax,
        sort,
    ]);

    const clearAllFilters = () => {
        setInStock(false);
        setOutOfStock(false);
        setSelectedTypes(new Set());
        setSelectedColors(new Set());
        setSelectedMaterials(new Set());
        setSelectedSizes(new Set());
        setPriceMin(filterOptions.priceMin);
        setPriceMax(filterOptions.priceMax);
    };

    if (loading) {
        return (
            <div className="marketplace-container">
                <div className="loading-state">Loading marketplace...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="marketplace-container">
                <div className="error-state">{error}</div>
            </div>
        );
    }

    return (
        <div className="marketplace-container mp-page">
            {/* =========================Search hero section (restyled minimalist)
      ========================== */}
            <section className="mp-hero-min">
                <div className="mp-hero-min__inner">
                    <div className="mp-hero-min__text">
                        <h1 className="mp-hero-min__title">Market Place</h1>
                        <p className="mp-hero-min__caption">
                            Curated student listings - browse, filter, and message sellers instantly!
                        </p>
                    </div>

                    <div className="mp-hero-min__search">
                        <input
                            className="mp-searchbar"
                            type="text"
                            placeholder="Search items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </section>

            {/* =========================
          Advertisement section (restyled to match screenshots)
      ========================== */}
            <section className="mp-ad-min">
                <div className="mp-ad-min__inner">
                    <div className="mp-ad-min__left">
                        <span className="mp-ad-min__tag">Featured</span>
                        <h3>Boost your listing</h3>
                        <p>Get more views and faster replies by featuring your product.</p>
                    </div>
                    <div className="mp-ad-min__right">
                        <button className="mp-btn-min mp-btn-min--primary" type="button">
                            Advertise Now
                        </button>
                        <button className="mp-btn-min" type="button">
                            Learn More
                        </button>
                    </div>
                </div>
            </section>

            {/* =========================
          Sidebar filters + top toolbar + grid
      ========================== */}
            <section className="mp-collection">
                <div className="mp-collection__toolbar">
                    <button
                        type="button"
                        className="mp-linkbtn"
                        onClick={() => setFiltersOpen((v) => !v)}
                    >
                        <svg
                            className="mp-filterbtn__icon"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                        >
                            <path
                                d="M3 5h18l-7 8v5l-4 2v-7L3 5Z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinejoin="round"
                            />
                        </svg>
                        {filtersOpen ? "Hide Filter" : "Show Filter"}
                    </button>

                    <div className="mp-toolbar__spacer" />

                    <div className="mp-sort">
                        <span className="mp-sort__label">Sort by</span>
                        <select
                            className="mp-sort__select"
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                        >
                            <option value="rating">Sort by average rating</option>
                            <option value="latest">Sort by latest</option>
                            <option value="price_low">Sort by price: low to high</option>
                            <option value="price_high">Sort by price: high to low</option>
                        </select>
                    </div>

                    <div className="mp-results">
                        Showing <b>{filteredListings.length}</b> results
                    </div>
                </div>

                <div className={`mp-collection__body ${filtersOpen ? "" : "no-filters"}`}>
                    {/* LEFT FILTERS */}
                    {filtersOpen && (
                        <aside className="mp-filters">
                            <div className="mp-filters__head">
                                <h3>Filter</h3>
                                <button className="mp-linkbtn" type="button" onClick={clearAllFilters}>
                                    Clear all
                                </button>
                            </div>

                            {/* Availability */}
                            <div className="mp-filterblock">
                                <h4>Availability</h4>

                                <label className="mp-checkrow">
                                    <input
                                        type="checkbox"
                                        checked={inStock}
                                        onChange={(e) => setInStock(e.target.checked)}
                                    />
                                    <span>In stock</span>
                                    <span className="mp-count">{filterOptions.inCount}</span>
                                </label>

                                <label className="mp-checkrow">
                                    <input
                                        type="checkbox"
                                        checked={outOfStock}
                                        onChange={(e) => setOutOfStock(e.target.checked)}
                                    />
                                    <span>Out of stock</span>
                                    <span className="mp-count">{filterOptions.outCount}</span>
                                </label>
                            </div>

                            {/* Product Type */}
                            <div className="mp-filterblock">
                                <h4>Product Type</h4>

                                {filterOptions.typeCount.size === 0 ? (
                                    <p className="mp-hint">No product types found in data.</p>
                                ) : (
                                    [...filterOptions.typeCount.entries()]
                                        .sort((a, b) => b[1] - a[1])
                                        .slice(0, 12)
                                        .map(([t, count]) => (
                                            <button
                                                key={t}
                                                type="button"
                                                className={`mp-optionrow ${selectedTypes.has(t) ? "is-active" : ""
                                                    }`}
                                                onClick={() => toggleSetValue(setSelectedTypes, t)}
                                                title={t}
                                            >
                                                <span className="mp-optionrow__text">{t}</span>
                                                <span className="mp-count">{count}</span>
                                            </button>
                                        ))
                                )}
                            </div>

                            {/* Price */}
                            <div className="mp-filterblock">
                                <h4>Price</h4>

                                <div className="mp-range">
                                    <input
                                        type="range"
                                        min={filterOptions.priceMin}
                                        max={filterOptions.priceMax}
                                        value={priceMin}
                                        onChange={(e) => {
                                            const v = Number(e.target.value);
                                            setPriceMin(Math.min(v, priceMax));
                                        }}
                                    />
                                    <input
                                        type="range"
                                        min={filterOptions.priceMin}
                                        max={filterOptions.priceMax}
                                        value={priceMax}
                                        onChange={(e) => {
                                            const v = Number(e.target.value);
                                            setPriceMax(Math.max(v, priceMin));
                                        }}
                                    />
                                </div>

                                <div className="mp-priceboxes">
                                    <div className="mp-pricebox">
                                        <label>Min</label>
                                        <input
                                            value={priceMin}
                                            onChange={(e) => setPriceMin(Number(e.target.value || 0))}
                                            type="number"
                                        />
                                    </div>
                                    <div className="mp-pricebox">
                                        <label>Max</label>
                                        <input
                                            value={priceMax}
                                            onChange={(e) => setPriceMax(Number(e.target.value || 0))}
                                            type="number"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Color */}
                            <div className="mp-filterblock">
                                <h4>Color</h4>

                                {filterOptions.colorCount.size === 0 ? (
                                    <p className="mp-hint">No colors found in data.</p>
                                ) : (
                                    [...filterOptions.colorCount.entries()]
                                        .sort((a, b) => b[1] - a[1])
                                        .slice(0, 10)
                                        .map(([c, count]) => (
                                            <button
                                                key={c}
                                                type="button"
                                                className={`mp-optionrow ${selectedColors.has(c) ? "is-active" : ""
                                                    }`}
                                                onClick={() => toggleSetValue(setSelectedColors, c)}
                                                title={c}
                                            >
                                                <span className="mp-optionrow__text">{c}</span>
                                                <span className="mp-count">{count}</span>
                                            </button>
                                        ))
                                )}
                            </div>

                            {/* Material */}
                            <div className="mp-filterblock">
                                <h4>Material</h4>

                                {filterOptions.materialCount.size === 0 ? (
                                    <p className="mp-hint">No materials found in data.</p>
                                ) : (
                                    [...filterOptions.materialCount.entries()]
                                        .sort((a, b) => b[1] - a[1])
                                        .slice(0, 10)
                                        .map(([m, count]) => (
                                            <button
                                                key={m}
                                                type="button"
                                                className={`mp-optionrow ${selectedMaterials.has(m) ? "is-active" : ""
                                                    }`}
                                                onClick={() => toggleSetValue(setSelectedMaterials, m)}
                                                title={m}
                                            >
                                                <span className="mp-optionrow__text">{m}</span>
                                                <span className="mp-count">{count}</span>
                                            </button>
                                        ))
                                )}
                            </div>

                            {/* Size */}
                            <div className="mp-filterblock">
                                <h4>Size</h4>

                                {filterOptions.sizeCount.size === 0 ? (
                                    <p className="mp-hint">No sizes found in data.</p>
                                ) : (
                                    [...filterOptions.sizeCount.entries()]
                                        .sort((a, b) => b[1] - a[1])
                                        .slice(0, 10)
                                        .map(([s, count]) => (
                                            <button
                                                key={s}
                                                type="button"
                                                className={`mp-optionrow ${selectedSizes.has(s) ? "is-active" : ""
                                                    }`}
                                                onClick={() => toggleSetValue(setSelectedSizes, s)}
                                                title={s}
                                            >
                                                <span className="mp-optionrow__text">{s}</span>
                                                <span className="mp-count">{count}</span>
                                            </button>
                                        ))
                                )}
                            </div>
                        </aside>
                    )}

                    {/* RIGHT GRID */}
                    <div className="mp-gridwrap">
                        {filteredListings.length === 0 ? (
                            <div className="empty-state">
                                <h3>No items found</h3>
                                <p>Try adjusting filters or searching with another keyword.</p>
                            </div>
                        ) : (
                            <div className="mp-grid">
                                {filteredListings.map((item) => (
                                    <article className="mp-card" key={item.id}>
                                        <button
                                            type="button"
                                            className="mp-card__media"
                                            onClick={() => navigate(`/product/${item.id}`, { state: { listing: item } })}
                                            aria-label={`Open details for ${item.title}`}
                                        >
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.title} loading="lazy" />
                                            ) : (
                                                <div className="mp-noimg">📷</div>
                                            )}
                                        </button>

                                        <div className="mp-card__info">
                                            <div className="mp-card__type">
                                                {(getType(item) || "LISTING").toUpperCase()}
                                            </div>

                                            <button
                                                type="button"
                                                className="mp-card__title"
                                                onClick={() => navigate(`/product/${item.id}`, { state: { listing: item } })}
                                            >
                                                {item.title}
                                            </button>

                                            <div className="mp-card__price">${item.price}</div>

                                            {/* <div className="mp-card__actions">
                                                <button
                                                    className="mp-actionbtn"
                                                    type="button"
                                                    onClick={() => setSelectedListing(item)}
                                                >
                                                    Details
                                                </button>

                                                {user && user.id !== item.seller_id && (
                                                    <button
                                                        className="mp-actionbtn mp-actionbtn--primary"
                                                        type="button"
                                                        onClick={() => handleMessage(item)}
                                                    >
                                                        Message
                                                    </button>
                                                )}
                                            </div> */}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* {selectedListing && (
                <ProductModal
                    listing={selectedListing}
                    onClose={() => setSelectedListing(null)}
                />
            )} */}
        </div>
    );
};

export default Marketplace;
