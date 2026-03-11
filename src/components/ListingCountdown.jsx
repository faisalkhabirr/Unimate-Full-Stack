import { useState, useEffect } from 'react';

const LISTING_DURATION_DAYS = 30;

const ListingCountdown = ({ createdAt }) => {
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        if (!createdAt) return;

        const calculateTimeLeft = () => {
            const created = new Date(createdAt);
            const expires = new Date(created.getTime() + LISTING_DURATION_DAYS * 24 * 60 * 60 * 1000);
            const now = new Date();
            const difference = expires - now;

            if (difference <= 0) {
                return 0;
            }

            return difference;
        };

        // Initial calculation
        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            const t = calculateTimeLeft();
            setTimeLeft(t);
            if (t === 0) clearInterval(timer);
        }, 1000);

        return () => clearInterval(timer);
    }, [createdAt]);

    if (timeLeft === null) return null; // Loading or invalid date

    if (timeLeft === 0) {
        return <div className="listing-countdown expired">Expired</div>;
    }

    // Format time
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
    const seconds = Math.floor((timeLeft / 1000) % 60);

    return (
        <div className="listing-countdown">
            Deletes in: {days}d {hours.toString().padStart(2, '0')}h {minutes.toString().padStart(2, '0')}m {seconds.toString().padStart(2, '0')}s
        </div>
    );
};

export default ListingCountdown;
