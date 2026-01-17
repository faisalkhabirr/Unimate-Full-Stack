import "../styles/Footer.css";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faMagnifyingGlass,
    faGlobe
} from "@fortawesome/free-solid-svg-icons";
import {
    faFacebookF,
    faInstagram,
    faPinterestP,
    faXTwitter,
    faYoutube,
    faApple,
    faGooglePlay
} from "@fortawesome/free-brands-svg-icons";

const Footer = () => {
    const [searchTerm, setSearchTerm] = useState("");

    const handleSearch = () => {
        if (!searchTerm.trim()) return;

        console.log("Searching for:", searchTerm);

        // Later you can connect it like this:
        // navigate(`/marketplace?search=${encodeURIComponent(searchTerm)}`);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleSearch();
    };

    return (
        <footer className="site-footer">
            <div className="footer-inner">

                {/* Left section */}
                <div className="footer-left">
                    <div className="footer-global">
                        <FontAwesomeIcon icon={faGlobe} />
                        <span>Bangladesh</span>
                    </div>
                </div>

                {/* Right section */}
                <div className="footer-right ">
                    <div className="footer-socials">
                        <a href="#" aria-label="Pinterest">
                            <FontAwesomeIcon icon={faPinterestP} />
                        </a>
                        <a href="#" aria-label="Facebook">
                            <FontAwesomeIcon icon={faFacebookF} />
                        </a>
                        <a href="#" aria-label="X">
                            <FontAwesomeIcon icon={faXTwitter} />
                        </a>
                        <a href="#" aria-label="Instagram">
                            <FontAwesomeIcon icon={faInstagram} />
                        </a>
                        <a href="#" aria-label="YouTube">
                            <FontAwesomeIcon icon={faYoutube} />
                        </a>
                    </div>

                </div>
            </div>

            {/* Bottom section */}
            <div className="footer-bottom">
                <nav className="footer-links">
                    <a href="#">Privacy Policy</a>
                    <a href="#">Terms of Service</a>
                    <a href="#">Copyright Policy</a>
                </nav>

                <div className="footer-copy">
                    A product of Purple Tech
                </div>

                <div className="footer-copy">
                    © 2026 Unimate
                </div>
            </div>
        </footer>
    );
};

export default Footer;
