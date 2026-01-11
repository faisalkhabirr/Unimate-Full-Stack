import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "../components/Navbar";
import Landing from "../pages/Landing";
import Marketplace from "../pages/Marketplace";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Profile from "../pages/Profile";
import CreateListing from "../pages/CreateListing";
import MyListings from "../pages/MyListings";
import EditListing from "../pages/EditListing";
import MyDeals from "../pages/MyDeals";
import Messages from "../pages/Messages";
import Chat from "../pages/Chat";
import ProductPage from "../pages/ProductPage"; // ✅ ADD THIS
import { AuthProvider } from "../context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";
import Footer from "../components/Footer";
import GlobalNetworkLoader from "../components/GlobalNetworkLoader";

const AppRoutes = () => {
    return (
        <Router>
            <AuthProvider>
                <GlobalNetworkLoader />
                <Navbar />
                <Routes>
                    <Route path="/" element={<Landing />} />

                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Protected Routes */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/marketplace" element={<Marketplace />} />
                        <Route path="/product/:id" element={<ProductPage />} />
                        <Route path="/create-listing" element={<CreateListing />} />
                        <Route path="/my-listings" element={<MyListings />} />
                        <Route path="/edit-listing/:listingId" element={<EditListing />} />
                        <Route path="/my-deals" element={<MyDeals />} />
                        <Route path="/messages" element={<Messages />} />
                        <Route path="/chat/:chatId" element={<Chat />} />
                        <Route path="/profile" element={<Profile />} />
                    </Route>
                </Routes>
                <Footer />
            </AuthProvider>
        </Router>
    );
};

export default AppRoutes;
