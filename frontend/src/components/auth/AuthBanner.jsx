export default function AuthBanner() {
    return (
        <div className="auth-banner">
            <div className="banner-overlay"></div>
            <div className="banner-content">
                <div className="emblem-container">
                    <i className="fa-solid fa-scale-balanced emblem-icon"></i>
                </div>
                <h1 className="brand-title">JURIS&bull;TRAIL</h1>
                <p className="brand-subtitle">CASE MEMORY & INVESTIGATION ASSISTANT</p>
                <div className="divider-gold"></div>
                <blockquote className="legal-quote">
                    "Satyameva Jayate"
                    <span>Truth Alone Triumphs</span>
                </blockquote>
                <p className="banner-desc">
                    A persistent AI cognitive layer building long-term memory, resolving cross-document timelines, and mapping evidence contradictions for Indian litigation teams.
                </p>
            </div>
        </div>
    );
}
