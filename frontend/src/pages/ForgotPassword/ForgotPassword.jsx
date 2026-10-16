import { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../../services/auth";
import "../Login/Login.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const result = await requestPasswordReset(email);
      setMessage(result.message || "If an account is eligible, reset instructions will be sent.");
    } catch (requestError) {
      setError(requestError.message || "Could not request a password reset.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo">Shuffle<span>Up</span></Link>
        <div className="auth-heading">
          <p>ACCOUNT RECOVERY</p>
          <h1>Forgot password?</h1>
          <span>We&apos;ll send a one-time reset link if the account is eligible.</span>
        </div>
        {error && <div className="auth-error" role="alert">{error}</div>}
        {message && <div className="auth-message" role="status">{message}</div>}
        <form onSubmit={submit}>
          <label>
            Email
            <input type="email" autoComplete="email" maxLength={255} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
          </label>
          <button type="submit" className="auth-submit" disabled={loading}>{loading ? "Requesting..." : "Send reset link"}</button>
        </form>
        <p className="auth-switch"><Link to="/login">Back to Login</Link></p>
      </div>
    </main>
  );
}
