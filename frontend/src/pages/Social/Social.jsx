import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import { useAuth } from "../../context/AuthContext";
import { games } from "../../data/games";
import "./Social.css";
import { API_BASE_URL } from "../../services/apiBase";

const API_BASE = API_BASE_URL;

async function socialRequest(path, token, options = {}) {
  const response = await fetch(`${API_BASE}/api/social${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed. Please try again.");
  return data;
}

function Social() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [overview, setOverview] = useState({ friends: [], incomingRequests: [], outgoingRequests: [], incomingChallenges: [], outgoingChallenges: [] });
  const [username, setUsername] = useState("");
  const [selectedGame, setSelectedGame] = useState(games[0]?.id || "kachuful");
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadOverview = useCallback(async () => {
    const token = localStorage.getItem("shuffleup_token");
    if (!token) return;
    const data = await socialRequest("/overview", token);
    setOverview({
      friends: data.friends || [],
      incomingRequests: data.incomingRequests || [],
      outgoingRequests: data.outgoingRequests || [],
      incomingChallenges: data.incomingChallenges || [],
      outgoingChallenges: data.outgoingChallenges || [],
    });
  }, []);

  useEffect(() => {
    if (!loading && !user) navigate(`/login?redirect=${encodeURIComponent("/social")}`, { replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return undefined;
    let active = true;
    const refresh = () => loadOverview().catch((loadError) => { if (active) setError(loadError.message); });
    refresh();
    const timer = window.setInterval(refresh, 10000);
    return () => { active = false; window.clearInterval(timer); };
  }, [user, loadOverview]);

  async function runAction(key, action, successMessage = "Updated.") {
    setBusyKey(key); setError(""); setMessage("");
    try {
      const result = await action();
      setMessage(result?.message || successMessage);
      await loadOverview();
      return result;
    } catch (actionError) {
      setError(actionError.message);
      return null;
    } finally {
      setBusyKey("");
    }
  }

  async function sendRequest(event) {
    event.preventDefault();
    const value = username.trim();
    if (!value) { setError("Enter a player's username."); return; }
    const result = await runAction("add-friend", () => socialRequest("/friend-requests", localStorage.getItem("shuffleup_token"), {
      method: "POST", body: JSON.stringify({ username: value }),
    }));
    if (result) setUsername("");
  }

  async function respondToChallenge(challenge, action) {
    const result = await runAction(`challenge-${challenge.id}`, () => socialRequest(`/challenges/${challenge.id}`, localStorage.getItem("shuffleup_token"), {
      method: "PATCH", body: JSON.stringify({ action }),
    }), action === "accept" ? "Challenge accepted." : "Challenge declined.");
    if (result?.roomCode) navigate(`/room/${result.roomCode}`);
  }

  if (loading || !user) return null;

  return (
    <div className="social-page">
      <Navbar />
      <main className="social-container">
        <header className="social-heading">
          <p className="eyebrow">PLAY TOGETHER</p>
          <h1>Friends & Challenges</h1>
          <p>Add registered players, manage requests, and challenge friends in a real ShuffleUp room.</p>
        </header>

        {(error || message) && <div className={`social-alert ${error ? "is-error" : "is-success"}`} role="status">{error || message}</div>}

        <section className="social-panel">
          <h2>Add a friend</h2>
          <form className="social-add-form" onSubmit={sendRequest}>
            <input value={username} onChange={(event) => setUsername(event.target.value)} maxLength={30} placeholder="Registered username" aria-label="Registered username" />
            <button type="submit" disabled={busyKey === "add-friend"}>{busyKey === "add-friend" ? "Sending…" : "Send request"}</button>
          </form>
        </section>

        <div className="social-columns">
          <section className="social-panel">
            <div className="social-panel-heading"><h2>Friends</h2><span>{overview.friends.length}</span></div>
            <label className="social-game-select">Challenge game
              <select value={selectedGame} onChange={(event) => setSelectedGame(event.target.value)}>
                {games.map((game) => <option key={game.id} value={game.id}>{game.name}</option>)}
              </select>
            </label>
            {overview.friends.length === 0 ? <p className="social-empty">Your friends will appear here after they accept your request.</p> : overview.friends.map((friend) => (
              <div className="social-row" key={friend.id}>
                <div className="social-avatar">{friend.username?.charAt(0)?.toUpperCase() || "P"}</div>
                <div className="social-row-main"><strong>{friend.username}</strong><small>Registered player</small></div>
                <div className="social-row-actions">
                  <button type="button" onClick={() => runAction(`send-challenge-${friend.id}`, () => socialRequest("/challenges", localStorage.getItem("shuffleup_token"), { method: "POST", body: JSON.stringify({ friendId: friend.id, gameId: selectedGame }) }), "Challenge sent.")} disabled={Boolean(busyKey)}>Challenge</button>
                  <button className="social-quiet-button" type="button" onClick={() => runAction(`remove-${friend.id}`, () => socialRequest(`/friends/${friend.id}`, localStorage.getItem("shuffleup_token"), { method: "DELETE" }), "Friend removed.")} disabled={Boolean(busyKey)}>Remove</button>
                </div>
              </div>
            ))}
          </section>

          <section className="social-panel">
            <div className="social-panel-heading"><h2>Friend requests</h2><span>{overview.incomingRequests.length}</span></div>
            {overview.incomingRequests.length === 0 && overview.outgoingRequests.length === 0 ? <p className="social-empty">No pending friend requests.</p> : null}
            {overview.incomingRequests.map((request) => <div className="social-row" key={request.id}>
              <div className="social-avatar">{request.username?.charAt(0)?.toUpperCase() || "P"}</div>
              <div className="social-row-main"><strong>{request.username}</strong><small>Wants to be friends</small></div>
              <div className="social-row-actions">
                <button type="button" disabled={Boolean(busyKey)} onClick={() => runAction(`friend-${request.id}`, () => socialRequest(`/friend-requests/${request.id}`, localStorage.getItem("shuffleup_token"), { method: "PATCH", body: JSON.stringify({ action: "accept" }) }), "Friend request accepted.")}>Accept</button>
                <button className="social-quiet-button" type="button" disabled={Boolean(busyKey)} onClick={() => runAction(`friend-${request.id}`, () => socialRequest(`/friend-requests/${request.id}`, localStorage.getItem("shuffleup_token"), { method: "PATCH", body: JSON.stringify({ action: "reject" }) }), "Friend request declined.")}>Decline</button>
              </div>
            </div>)}
            {overview.outgoingRequests.map((request) => <div className="social-row" key={request.id}>
              <div className="social-avatar is-muted">{request.username?.charAt(0)?.toUpperCase() || "P"}</div>
              <div className="social-row-main"><strong>{request.username}</strong><small>Request pending</small></div>
            </div>)}
          </section>
        </div>

        <div className="social-columns">
          <section className="social-panel">
            <div className="social-panel-heading"><h2>Incoming challenges</h2><span>{overview.incomingChallenges.filter((item) => item.status === "pending").length}</span></div>
            {overview.incomingChallenges.length === 0 ? <p className="social-empty">No challenges waiting for you.</p> : overview.incomingChallenges.map((challenge) => <div className="social-row" key={challenge.id}>
              <div className="social-avatar">{challenge.username?.charAt(0)?.toUpperCase() || "P"}</div>
              <div className="social-row-main"><strong>{challenge.username}</strong><small>{games.find((game) => game.id === challenge.game_id)?.name || challenge.game_id} · {challenge.status}</small></div>
              <div className="social-row-actions">
                {challenge.status === "pending" ? <>
                  <button type="button" disabled={Boolean(busyKey)} onClick={() => respondToChallenge(challenge, "accept")}>Accept</button>
                  <button type="button" className="social-quiet-button" disabled={Boolean(busyKey)} onClick={() => respondToChallenge(challenge, "reject")}>Decline</button>
                </> : null}
              </div>
            </div>)}
          </section>

          <section className="social-panel">
            <div className="social-panel-heading"><h2>Sent challenges</h2><span>{overview.outgoingChallenges.length}</span></div>
            {overview.outgoingChallenges.length === 0 ? <p className="social-empty">Challenges you send will show up here.</p> : overview.outgoingChallenges.map((challenge) => <div className="social-row" key={challenge.id}>
              <div className="social-avatar is-muted">{challenge.username?.charAt(0)?.toUpperCase() || "P"}</div>
              <div className="social-row-main"><strong>{challenge.username}</strong><small>{games.find((game) => game.id === challenge.game_id)?.name || challenge.game_id} · {challenge.status}</small></div>
              {challenge.status === "accepted" && challenge.room_code ? <button type="button" onClick={() => navigate(`/room/${challenge.room_code}`)}>Open room</button> : null}
            </div>)}
          </section>
        </div>
      </main>
    </div>
  );
}

export default Social;
