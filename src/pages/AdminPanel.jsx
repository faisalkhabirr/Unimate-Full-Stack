import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import '../styles/AdminPanel.css';

const AdminPanel = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('users'); // users, listings, categories, admins, auth
    
    const [usersData, setUsersData] = useState([]);
    const [listingsData, setListingsData] = useState([]);
    const [categoriesData, setCategoriesData] = useState([]);
    const [adminsData, setAdminsData] = useState([]);
    const [authUsersData, setAuthUsersData] = useState([]);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const verifyAdmin = async () => {
            if (!user) {
                navigate('/login');
                return;
            }
            try {
                const { data, error } = await supabase
                    .from('admins')
                    .select('user_id')
                    .eq('user_id', user.id)
                    .single();
                
                if (error || !data) {
                    console.error("Not an admin or error verifying:", error);
                    setIsAdmin(false);
                    setErrorMsg("Access Denied: You are not recognized as an admin. Have you added your user ID to the 'admins' table in Supabase?");
                    setLoading(false);
                    return;
                }
                
                setIsAdmin(true);
                fetchData('users');
                fetchData('listings');
                fetchData('categories');
                fetchData('admins');
                fetchData('auth_users');
                setLoading(false);
            } catch (err) {
                console.error("Admin verification failed:", err);
                setIsAdmin(false);
                setErrorMsg("Access Denied: " + err.message);
                setLoading(false);
            }
        };

        verifyAdmin();
    }, [user, navigate]);

    const fetchData = async (type) => {
        try {
            if (type === 'users') {
                const { data, error } = await supabase.from('profiles').select('*');
                if (error) throw error;
                setUsersData(data || []);
            } else if (type === 'listings') {
                // Removed profiles join to prevent schema relation errors
                const { data, error } = await supabase.from('listings').select('*');
                if (error) throw error;
                setListingsData(data || []);
            } else if (type === 'categories') {
                const { data, error } = await supabase.from('categories').select('*').order('name');
                if (error) throw error;
                setCategoriesData(data || []);
            } else if (type === 'admins') {
                const { data, error } = await supabase.from('admins').select('*');
                if (error) throw error;
                setAdminsData(data || []);
            } else if (type === 'auth_users') {
                const { data, error } = await supabase.rpc('get_auth_users'); // Using secure RPC function
                if (error) throw error;
                setAuthUsersData(data || []);
            }
        } catch (err) {
            console.error(`Error fetching ${type}:`, err);
            // We won't throw standard errors to UI if it's just the auth view missing, so we can instruct them.
            if(type !== 'auth_users') {
                setErrorMsg(`Failed to fetch ${type}: ${err.message}`);
            }
        }
    };

    // --- USERS CRUD ---
    const handleEditUser = async (usr) => {
        const newBio = window.prompt("Edit bio for user:", usr.bio || '');
        if (newBio !== null) {
            const { error } = await supabase.from('profiles').update({ bio: newBio }).eq('id', usr.id);
            if (error) alert("Error updating user: " + error.message);
            else fetchData('users');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Delete this user profile completely? (Note: This deletes their data but not necessarily their Supabase Auth login credentials. Use Auth tab for that.)")) return;
        const { error } = await supabase.from('profiles').delete().eq('id', userId);
        if (error) alert("Error deleting user: " + error.message);
        else fetchData('users');
    };

    // --- LISTINGS CRUD ---
    const handleEditListing = async (item) => {
        const newTitle = window.prompt("Edit Title:", item.title);
        if (newTitle === null) return;
        
        const newPrice = window.prompt("Edit Price:", item.price);
        if (newPrice === null) return;

        const { error } = await supabase.from('listings').update({ 
            title: newTitle, 
            price: parseFloat(newPrice) || item.price 
        }).eq('id', item.id);
        
        if (error) alert("Error updating listing: " + error.message);
        else fetchData('listings');
    };

    const handleDeleteListing = async (listingId) => {
        if (!window.confirm("Are you sure you want to delete this listing permanently?")) return;
        const { error } = await supabase.from('listings').delete().eq('id', listingId);
        if (error) alert("Error deleting listing: " + error.message);
        else fetchData('listings');
    };

    // --- CATEGORIES CRUD ---
    const handleCreateCategory = async () => {
        const name = window.prompt("Enter new category name:");
        if (!name) return;
        const desc = window.prompt("Enter category description (optional):");
        
        const { error } = await supabase.from('categories').insert([{ name, description: desc }]);
        if (error) alert("Error creating category: " + error.message);
        else fetchData('categories');
    };

    const handleEditCategory = async (cat) => {
        const newName = window.prompt("Edit category name:", cat.name);
        if (newName === null) return;
        
        const newDesc = window.prompt("Edit category description:", cat.description || '');
        if (newDesc === null) return;

        const { error } = await supabase.from('categories').update({ 
            name: newName, 
            description: newDesc 
        }).eq('id', cat.id);
        
        if (error) alert("Error updating category: " + error.message);
        else fetchData('categories');
    };

    const handleDeleteCategory = async (catId) => {
        if (!window.confirm("Are you sure you want to delete this category? (May fail if listings are attached to it)")) return;
        const { error } = await supabase.from('categories').delete().eq('id', catId);
        if (error) alert("Error deleting category: " + error.message);
        else fetchData('categories');
    };

    // --- ADMINS CRUD ---
    const handleAddAdmin = async () => {
        const newAdminId = window.prompt("Enter the User ID (UUID) of the user to make Admin:");
        if (!newAdminId) return;

        const { error } = await supabase.from('admins').insert([{ user_id: newAdminId }]);
        if (error) alert("Error adding admin: " + error.message);
        else fetchData('admins');
    };

    const handleRemoveAdmin = async (adminId) => {
        if (!window.confirm("Are you sure you want to remove this admin?")) return;
        const { error } = await supabase.from('admins').delete().eq('id', adminId);
        if (error) alert("Error removing admin: " + error.message);
        else fetchData('admins');
    };

    // --- AUTH USERS CRUD ---
    const handleDeleteAuthUser = async (userId) => {
        if (!window.confirm("CRITICAL WARNING: This will permanently delete the user's authentication account. If cascade is on, it will also wipe all their data. Continue?")) return;
        
        const { error } = await supabase.rpc('delete_auth_user', { target_user_id: userId });
        if (error) alert("Error deleting auth user: " + error.message);
        else {
            alert("User deleted from Auth.");
            fetchData('auth_users');
            fetchData('users');
        }
    };


    if (loading) {
        return <div className="admin-loading">Verifying admin access...</div>;
    }

    if (!isAdmin) {
        return (
            <div className="admin-container">
                <div className="admin-header">
                    <h1 className="admin-title">Admin Dashboard</h1>
                </div>
                {errorMsg && <div className="admin-error">{errorMsg}</div>}
            </div>
        );
    }

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h1 className="admin-title">Admin Dashboard</h1>
            </div>
            
            {errorMsg && <div className="admin-error">{errorMsg}</div>}

            <div className="admin-tabs">
                <button className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                    Profiles
                </button>
                <button className={`admin-tab ${activeTab === 'auth' ? 'active' : ''}`} onClick={() => setActiveTab('auth')}>
                    Auth Users
                </button>
                <button className={`admin-tab ${activeTab === 'admins' ? 'active' : ''}`} onClick={() => setActiveTab('admins')}>
                    Admins
                </button>
                <button className={`admin-tab ${activeTab === 'listings' ? 'active' : ''}`} onClick={() => setActiveTab('listings')}>
                    Listings
                </button>
                <button className={`admin-tab ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>
                    Categories
                </button>
            </div>

            <div className="admin-content">
                
                {/* --- PROFILES TAB --- */}
                {activeTab === 'users' && (
                    <div className="admin-card">
                        <h2>Public Profiles</h2>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Bio</th>
                                        <th>Created At</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usersData.map((usr) => (
                                        <tr key={usr.id}>
                                            <td style={{ fontSize: '0.8rem', maxWidth:'100px', overflow:'hidden', textOverflow:'ellipsis' }}>{usr.id}</td>
                                            <td>{usr.full_name || 'N/A'}</td>
                                            <td>{usr.bio || 'No bio'}</td>
                                            <td>{usr.updated_at ? new Date(usr.updated_at).toLocaleDateString() : 'N/A'}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button className="admin-action-btn" onClick={() => handleEditUser(usr)}>Edit Bio</button>
                                                    <button className="admin-action-btn btn-danger" onClick={() => handleDeleteUser(usr.id)}>Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {usersData.length === 0 && (
                                        <tr><td colSpan="5">No users found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- AUTH USERS TAB --- */}
                {activeTab === 'auth' && (
                    <div className="admin-card">
                        <h2>Authentication Accounts (Logins)</h2>
                        <p style={{marginBottom: '1rem', color: '#666'}}>
                            Directly managing the Supabase Auth base. Deleting a user here revokes their login entirely.
                        </p>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Auth ID</th>
                                        <th>Email</th>
                                        <th>Last Sign In</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {authUsersData.map((usr) => (
                                        <tr key={usr.id}>
                                            <td style={{ fontSize: '0.8rem', maxWidth:'120px', overflow:'hidden', textOverflow:'ellipsis' }}>{usr.id}</td>
                                            <td><strong>{usr.email}</strong></td>
                                            <td>{usr.last_sign_in_at ? new Date(usr.last_sign_in_at).toLocaleString() : 'Never'}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button className="admin-action-btn btn-danger" onClick={() => handleDeleteAuthUser(usr.id)}>Nuke User</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {authUsersData.length === 0 && (
                                        <tr><td colSpan="4">No auth users found. Note: Did you run the SQL RPC script?</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- ADMINS TAB --- */}
                {activeTab === 'admins' && (
                    <div className="admin-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ margin: 0 }}>Marketplace Administrators</h2>
                            <button className="admin-action-btn" style={{ background: '#3498db', color: 'white' }} onClick={handleAddAdmin}>
                                + Add Admin
                            </button>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Admin Record ID</th>
                                        <th>User ID (UUID)</th>
                                        <th>Assigned On</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {adminsData.map((adm) => (
                                        <tr key={adm.id}>
                                            <td style={{ fontSize: '0.8rem' }}>{adm.id}</td>
                                            <td style={{ fontSize: '0.8rem' }}>{adm.user_id}</td>
                                            <td>{adm.created_at ? new Date(adm.created_at).toLocaleDateString() : 'N/A'}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button className="admin-action-btn btn-danger" onClick={() => handleRemoveAdmin(adm.id)}>Remove Admin</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {adminsData.length === 0 && (
                                        <tr><td colSpan="4">No admins found. (Wait, you are an admin!)</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- LISTINGS TAB --- */}
                {activeTab === 'listings' && (
                    <div className="admin-card">
                        <h2>All Listings</h2>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Seller ID</th>
                                        <th>Price</th>
                                        <th>Condition</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {listingsData.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.title}</td>
                                            <td style={{ fontSize: '0.7rem' }}>{item.seller_id}</td>
                                            <td>${item.price}</td>
                                            <td>{item.condition}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button className="admin-action-btn" onClick={() => handleEditListing(item)}>Edit</button>
                                                    <button className="admin-action-btn btn-danger" onClick={() => handleDeleteListing(item.id)}>Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {listingsData.length === 0 && (
                                        <tr><td colSpan="5">No listings found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- CATEGORIES TAB --- */}
                {activeTab === 'categories' && (
                    <div className="admin-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ margin: 0 }}>Categories</h2>
                            <button className="admin-action-btn" style={{ background: '#3498db', color: 'white' }} onClick={handleCreateCategory}>
                                + New Category
                            </button>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Description</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categoriesData.map((cat) => (
                                        <tr key={cat.id}>
                                            <td>{cat.name}</td>
                                            <td>{cat.description || 'N/A'}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button className="admin-action-btn" onClick={() => handleEditCategory(cat)}>Edit</button>
                                                    <button className="admin-action-btn btn-danger" onClick={() => handleDeleteCategory(cat.id)}>Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {categoriesData.length === 0 && (
                                        <tr><td colSpan="3">No categories found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPanel;
