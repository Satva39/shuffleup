import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Navbar.css";

function Navbar() {
  const { user, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="logo">
          Shuffle<span>Up</span>
        </Link>

        <nav className="nav-links">
          <a href="/#games">Games</a>
          <a href="/#how-it-works">How to Play</a>
          <a href="/#about">About</a>
        </nav>

        <div className="nav-actions">
          {!loading && !user && (
            <>
              <Link to="/login" className="login-btn">
                Login
              </Link>

              <Link to="/register" className="signup-btn">
                Sign Up
              </Link>
            </>
          )}

          {!loading && user && (
            <div className="user-menu">
              <button
                className="user-button"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <span className="user-avatar">
                  {user.username.charAt(0).toUpperCase()}
                </span>

                <span className="user-name">
                  {user.username}
                </span>

                <span className={`menu-arrow ${menuOpen ? "open" : ""}`}>
                  ▾
                </span>
              </button>

              {menuOpen && (
                <div className="user-dropdown">
                  <div className="dropdown-user">
                    <span className="dropdown-avatar">
                      {user.username.charAt(0).toUpperCase()}
                    </span>

                    <div>
                      <strong>{user.username}</strong>
                      <small>{user.email}</small>
                    </div>
                  </div>

                  <div className="dropdown-divider" />

                  <Link to="/profile" onClick={() => setMenuOpen(false)}>
                    👤 Profile
                  </Link>


                  <div className="dropdown-divider" />

                  <button
                    className="dropdown-logout"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                  >
                    ↪ Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;