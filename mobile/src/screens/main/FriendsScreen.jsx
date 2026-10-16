import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from "react-native";
import Screen from "../../components/Screen";
import { API_URL } from "../../constants/config";
import { useAuth } from "../../context/AuthStore";
import { colors, radii } from "../../theme";
import { games } from "../../data/games";

const EMPTY = { friends: [], incomingRequests: [], outgoingRequests: [], incomingChallenges: [], outgoingChallenges: [] };

async function requestSocial(path, token, options = {}) {
  const response = await fetch(`${API_URL.replace(/\/$/, "")}/api/social${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed. Please try again.");
  return data;
}

function ActionButton({ title, onPress, disabled, quiet = false }) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={{ minHeight: 40, paddingHorizontal: 12, justifyContent: "center", alignItems: "center", borderRadius: 10, backgroundColor: quiet ? colors.surface2 : colors.primary, borderWidth: quiet ? 1 : 0, borderColor: colors.border, opacity: disabled ? 0.55 : 1 }}>
      <Text style={{ color: colors.text, fontSize: 12, fontWeight: "900" }}>{title}</Text>
    </Pressable>
  );
}

function PersonRow({ title, detail, actions }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
      <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: colors.surface2, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.cyan, fontWeight: "900", fontSize: 16 }}>{String(title || "P").charAt(0).toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: "900" }}>{title}</Text>
        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 3 }}>{detail}</Text>
      </View>
      <View style={{ gap: 6, alignItems: "flex-end" }}>{actions}</View>
    </View>
  );
}

function Section({ title, count, children }) {
  return (
    <View style={{ marginTop: 16, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, backgroundColor: colors.surface, padding: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <Text style={{ color: colors.text, fontSize: 17, fontWeight: "900" }}>{title}</Text>
        {count !== undefined ? <Text style={{ color: colors.cyan, fontSize: 12, fontWeight: "900" }}>{count}</Text> : null}
      </View>
      {children}
    </View>
  );
}

export default function FriendsScreen({ navigation }) {
  const { token, user } = useAuth();
  const [overview, setOverview] = useState(EMPTY);
  const [username, setUsername] = useState("");
  const [selectedGame, setSelectedGame] = useState(games[0]?.id || "kachuful");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadOverview = useCallback(async () => {
    if (!token) return;
    const data = await requestSocial("/overview", token);
    setOverview({ ...EMPTY, ...data });
  }, [token]);

  useEffect(() => {
    if (!token) { setLoading(false); return undefined; }
    let active = true;
    const refresh = async () => {
      try { await loadOverview(); if (active) setError(""); }
      catch (loadError) { if (active) setError(loadError.message); }
      finally { if (active) setLoading(false); }
    };
    refresh();
    const timer = setInterval(refresh, 10000);
    return () => { active = false; clearInterval(timer); };
  }, [token, loadOverview]);

  const act = async (key, path, options = {}, thenNavigate = false) => {
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await requestSocial(path, token, options);
      setMessage(result.message || "Updated.");
      await loadOverview();
      if (thenNavigate && result.roomCode) navigation.navigate("Room", { roomCode: result.roomCode });
    } catch (actionError) {
      setError(actionError.message);
    } finally { setBusy(false); }
  };

  return (
    <Screen>
      <Text style={{ color: colors.cyan, fontSize: 12, fontWeight: "900", letterSpacing: 1.4 }}>PLAY TOGETHER</Text>
      <Text style={{ color: colors.text, fontSize: 30, lineHeight: 36, fontWeight: "900", marginTop: 8 }}>Friends & Challenges</Text>
      <Text style={{ color: colors.muted, lineHeight: 21, marginTop: 8 }}>Find registered players, accept requests, and invite friends to a real ShuffleUp room.</Text>

      {error ? <Text accessibilityRole="alert" style={{ color: colors.danger || "#FCA5A5", marginTop: 12, lineHeight: 20 }}>{error}</Text> : null}
      {message ? <Text style={{ color: colors.cyan, marginTop: 12, lineHeight: 20 }}>{message}</Text> : null}
      {loading ? <ActivityIndicator color={colors.cyan} style={{ marginTop: 20 }} /> : null}

      <Section title="Add a friend">
        <TextInput value={username} onChangeText={setUsername} placeholder="Registered username" placeholderTextColor={colors.muted} autoCapitalize="none" maxLength={30} style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 12, color: colors.text, backgroundColor: colors.bg, fontSize: 15 }} />
        <ActionButton title="Send friend request" disabled={busy || username.trim().length < 2} onPress={() => act("friend-add", "/friend-requests", { method: "POST", body: JSON.stringify({ username: username.trim() }) }).then(() => setUsername(""))} />
      </Section>

      <Section title="Friends" count={overview.friends.length}>
        <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 10 }}>Choose which game you want to play with a friend.</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 9 }}>
          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "800" }}>Game</Text>
          <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {games.map((game) => <Pressable key={game.id} onPress={() => setSelectedGame(game.id)} style={{ borderWidth: 1, borderColor: selectedGame === game.id ? colors.cyan : colors.border, backgroundColor: selectedGame === game.id ? colors.surface2 : colors.bg, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6 }}><Text style={{ color: colors.text, fontSize: 11, fontWeight: "800" }}>{game.name}</Text></Pressable>)}
          </View>
        </View>
        {overview.friends.length ? overview.friends.map((friend) => <PersonRow key={friend.id} title={friend.username} detail="Registered friend" actions={[
          <ActionButton key="challenge" title="Challenge" disabled={busy} onPress={() => act(`challenge-${friend.id}`, "/challenges", { method: "POST", body: JSON.stringify({ friendId: friend.id, gameId: selectedGame }) })} />,
          <ActionButton key="remove" title="Remove" quiet disabled={busy} onPress={() => Alert.alert("Remove friend?", `Remove ${friend.username} from your friends list?`, [{ text: "Cancel", style: "cancel" }, { text: "Remove", style: "destructive", onPress: () => act(`remove-${friend.id}`, `/friends/${friend.id}`, { method: "DELETE" }) }])} />,
        ]} />) : <Text style={{ color: colors.muted, lineHeight: 20 }}>No friends yet. Send a request above.</Text>}
      </Section>

      <Section title="Friend requests" count={overview.incomingRequests.length}>
        {!overview.incomingRequests.length && !overview.outgoingRequests.length ? <Text style={{ color: colors.muted }}>No pending requests.</Text> : null}
        {overview.incomingRequests.map((item) => <PersonRow key={item.id} title={item.username} detail="Incoming request" actions={[
          <ActionButton key="accept" title="Accept" disabled={busy} onPress={() => act(`accept-${item.id}`, `/friend-requests/${item.id}`, { method: "PATCH", body: JSON.stringify({ action: "accept" }) })} />,
          <ActionButton key="reject" title="Decline" quiet disabled={busy} onPress={() => act(`reject-${item.id}`, `/friend-requests/${item.id}`, { method: "PATCH", body: JSON.stringify({ action: "reject" }) })} />,
        ]} />)}
        {overview.outgoingRequests.map((item) => <PersonRow key={item.id} title={item.username} detail="Waiting for response" />)}
      </Section>

      <Section title="Incoming challenges" count={overview.incomingChallenges.filter((item) => item.status === "pending").length}>
        {!overview.incomingChallenges.length ? <Text style={{ color: colors.muted }}>No current challenges.</Text> : null}
        {overview.incomingChallenges.map((item) => <PersonRow key={item.id} title={item.username} detail={`${games.find((game) => game.id === item.game_id)?.name || item.game_id} · ${item.status}`} actions={item.status === "pending" ? [
          <ActionButton key="accept" title="Accept" disabled={busy} onPress={() => act(`accept-challenge-${item.id}`, `/challenges/${item.id}`, { method: "PATCH", body: JSON.stringify({ action: "accept" }) }, true)} />,
          <ActionButton key="reject" title="Decline" quiet disabled={busy} onPress={() => act(`reject-challenge-${item.id}`, `/challenges/${item.id}`, { method: "PATCH", body: JSON.stringify({ action: "reject" }) })} />,
        ] : []} />)}
      </Section>

      <Section title="Sent challenges" count={overview.outgoingChallenges.length}>
        {!overview.outgoingChallenges.length ? <Text style={{ color: colors.muted }}>Your sent challenges will appear here.</Text> : null}
        {overview.outgoingChallenges.map((item) => <PersonRow key={item.id} title={item.username} detail={`${games.find((game) => game.id === item.game_id)?.name || item.game_id} · ${item.status}`} actions={item.status === "accepted" && item.room_code ? [<ActionButton key="open" title="Open room" onPress={() => navigation.navigate("Room", { roomCode: item.room_code })} />] : []} />)}
      </Section>
    </Screen>
  );
}
