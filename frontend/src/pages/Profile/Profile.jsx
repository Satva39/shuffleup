import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/navbar/Navbar";
import "./Profile.css";

function Profile() {
    const navigate = useNavigate();
    const { user, loading, logout } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            navigate("/login", { replace: true });
        }
    }, [loading, user, navigate]);

    if (loading || !user) {
        return null;
    }

    const memberSince = user.created_at
        ? new Date(user.created_at).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
        : null;

    return (
        <div className="profile-page">
            <Navbar />

            <main className="profile-container">
                <section className="profile-card">
                    <div className="profile-heading">
                        <p className="profile-eyebrow">YOUR ACCOUNT</p>
                        <h1>Profile</h1>
                        <span>Your ShuffleUp account information.</span>
                    </div>

                    <div className="profile-identity">
                        <div className="profile-avatar">
                            {user.username.charAt(0).toUpperCase()}
                        </div>

                        <div>
                            <h2>{user.username}</h2>
                            <p>{user.email}</p>
                        </div>
                    </div>

                    <div className="profile-details">
                        <div className="profile-detail">
                            <span>Username</span>
                            <strong>{user.username}</strong>
                        </div>

                        <div className="profile-detail">
                            <span>Email</span>
                            <strong>{user.email}</strong>
                        </div>

                        {memberSince && (
                            <div className="profile-detail">
                                <span>Member since</span>
                                <strong>{memberSince}</strong>
                            </div>
                        )}
                    </div>

                    <button
                        className="profile-logout"
                        onClick={logout}
                    >
                        Logout
                    </button>
                </section>
            </main>
        </div>
    );
}

export default Profile;
