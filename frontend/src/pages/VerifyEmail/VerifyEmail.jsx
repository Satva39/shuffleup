import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifyEmail } from "../../services/auth";
import "../Login/Login.css";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const started = useRef(false);
  const [status, setStatus] = useState(token ? "Verifying your email..." : "This verification link is missing its token.");
  const [failed, setFailed] = useState(!token);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    let active = true;
    verifyEmail(token)
      .then((result) => { if (active) { setStatus(result.message || "Email verified. You can sign in now."); setFailed(false); } })
      .catch((error) => { if (active) { setStatus(error.message || "This verification link is invalid or has expired."); setFailed(true); } });
    return () => { active = false; };
  }, [token]);

  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo">Shuffle<span>Up</span></Link>
        <div className="auth-heading">
          <p>EMAIL VERIFICATION</p>
          <h1>{failed ? "Verification not completed" : "Verify your email"}</h1>
          <span role="status">{status}</span>
        </div>
        <Link className="auth-submit auth-link-button" to="/login">Continue to Login</Link>
        {failed && <p className="auth-switch">Need a fresh link? <Link to="/register">Return to registration</Link> and request a resend.</p>}
      </div>
    </main>
  );
}
