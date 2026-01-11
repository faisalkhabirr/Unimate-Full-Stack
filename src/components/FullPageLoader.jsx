import "../styles/FullPageLoader.css";

export default function FullPageLoader({ label = "Loading..." }) {
    return (
        <div className="upl-overlay" role="status" aria-live="polite">
            <div className="upl-card">
                <div className="upl-spinner" />
                <p className="upl-text">{label}</p>
            </div>
        </div>
    );
}
