import { Link } from 'react-router-dom';
import '../styles/Landing.css';
import heroGif from "../assets/hero101.gif";
const Landing = () => {

    const items = [
        {
            id: "01",
            title: "Get your first sale online",
            desc: "Set up your store and start selling in minutes.",
            img: "/sale01.jpg",
        },
        {
            id: "02",
            title: "Build steady sales",
            desc: "Tools to market, optimize, and grow your revenue.",
            img: "/buildSale.jpg",
        },
        {
            id: "03",
            title: "Scale long-term",
            desc: "Analytics and automation to scale confidently.",
            img: "/scale01.jpg",
        },
    ];

    return (
        <div className="landing-page">

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-container">

                    {/* Left Content */}
                    <div className="hero-content">
                        <h1 className="hero-title">
                            Keep it moving. <br />
                            <span className="highlight-text">
                                From classroom concepts <br /> to real-world sell
                            </span>
                        </h1>

                        <p className="hero-subtitle">
                            Turn your campus ideas into real transactions.
                            Buy, sell, and connect safely within your university community.
                        </p>

                        <div className="hero-buttons">
                            <Link to="/register" className="btn btn-primary btn-hero-get-started">
                                Get started <span className="btn-arrow">→</span>
                            </Link>
                        </div>
                    </div>

                    {/* Right Media */}
                    <div className="hero-media">
                        <img
                            src={heroGif}
                            alt="Unimate demo"
                            className="hero-gif"
                        />
                    </div>

                </div>
            </section>

            {/* How It Works Section */}
            <section className="ecom-stage">
                <div className="ecom-stage__inner">
                    <h2 className="ecom-stage__title">
                        Ecommerce for any stage of your business journey
                    </h2>

                    <div className="ecom-stage__cards">
                        {items.map((item) => (
                            <article className="ecom-card" key={item.id}>
                                <div className="ecom-card__media">
                                    <img src={item.img} alt={item.title} />
                                </div>

                                <div className="ecom-card__body-content">
                                    <div className="ecom-card__body-text">
                                        <h3 className="ecom-card__heading">{item.title}</h3>
                                        <p className="ecom-card__desc">{item.desc}</p>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="notice">
                <div className="notice-bar">
                    <div className="notice-track">
                        <div className="notice-content">
                            <span>Sign Up, Sell online with ease and keep what you earn, we don't charge transaction fees.</span>
                            <span>Sign Up, Sell online with ease and keep what you earn, we don't charge transaction fees.</span>
                            <span>Sign Up, Sell online with ease and keep what you earn, we don't charge transaction fees.</span>
                        </div>

                        <div className="notice-content" aria-hidden="true">
                            <span>Sign Up, Sell online with ease and keep what you earn, we don't charge transaction fees.</span>
                            <span>Sign Up, Sell online with ease and keep what you earn, we don't charge transaction fees.</span>
                            <span>Sign Up, Sell online with ease and keep what you earn, we don't charge transaction fees.</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* sell anywhere section */}

            <section className="sell-anywhere">
                <div className="sell-anywhere__inner">

                    {/* Left Content */}
                    <div className="sell-anywhere__content">
                        <h2 className="sell-anywhere__title">Sell Anywhere</h2>
                        <p className="sell-anywhere__desc">
                            Reach customers across multiple platforms with ease.
                            Sell on social media, marketplaces, and your own store —
                            all managed from one powerful dashboard.
                        </p>
                        <div className="hero-buttons">
                            <Link to="/register" className="btn btn-primary btn-hero-get-started">
                                Get started <span className="btn-arrow">→</span>
                            </Link>
                        </div>
                    </div>

                    {/* Right Visual */}
                    <div className="sell-anywhere__visual">
                        <div className="sell-anywhere__card">
                            <img
                                src="/BuySell.gif"
                                alt="Sell anywhere illustration"
                            />
                        </div>
                    </div>

                </div>
            </section>


            {/* Benefits Section */}
            <section className="trust">

                <div className="trust__header">
                    <h2>Built for Students. Designed for Trust.</h2>
                    <p>A safer, faster way to buy and sell within your campus community.</p>
                </div>

                <div className="trust__inner">
                    <article className="trust-card">
                        {/* <div className="trust-card__icon">🔒</div> */}
                        <div className="trust-card__text">
                            <h3>Verified Students Only</h3>
                            <p>Safety is our priority. Every user is verified via their .edu email.</p>
                        </div>
                    </article>

                    <article className="trust-card">
                        {/* <div className="trust-card__icon">📍</div> */}
                        <div className="trust-card__text">
                            <h3>On-Campus Meetups</h3>
                            <p>No shipping fees. No travel. Just meet at the library or student union.</p>
                        </div>
                    </article>

                    <article className="trust-card">
                        {/* <div className="trust-card__icon">🚀</div> */}
                        <div className="trust-card__text">
                            <h3>Fast & Simple</h3>
                            <p>List an item in under 30 seconds. Find what you need instantly.</p>
                        </div>
                    </article>
                </div>
            </section>

        </div>
    );
};

export default Landing;
