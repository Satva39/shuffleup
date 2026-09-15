import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Lobby from "./pages/Lobby/Lobby";
import Room from "./pages/Room/Room";
import Profile from "./pages/Profile/Profile";


// Games
import { KachufulGame } from "./games/kachuful";
import { TeenPattiGame } from "./games/teen-patti";
import { IndianRummyGame } from "./games/indian-rummy";
import { MangooseGame } from "./games/mangoose";
import { UnoGame } from "./games/uno";
import { JackThiefGame } from "./games/jack-thief";
import { NapoleonGame } from "./games/napoleon";
import { BridgeGame } from "./games/bridge";
import { SpadesGame } from "./games/spades";
import { TwentyNineGame } from "./games/twenty-nine";
import { MindiCoatGame } from "./games/mindi-coat";
import { BluffGame } from "./games/bluff";
import { SattePeSattaGame } from "./games/satte-pe-satta";
import { WarGame } from "./games/war";
import { SolitaireGame } from "./games/solitaire";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          <Route
            path="/lobby"
            element={<Lobby />}
          />

          <Route
            path="/room/:roomCode"
            element={<Room />}
          />

          <Route
            path="/profile"
            element={<Profile />}
          />

          <Route
            path="/games/kachuful/:roomCode"
            element={<KachufulGame />}
          />

          <Route
            path="/games/teen-patti/:roomCode"
            element={<TeenPattiGame />}
          />

          <Route
            path="/games/indian-rummy/:roomCode"
            element={<IndianRummyGame />}
          />

          <Route
            path="/games/mangoose/:roomCode"
            element={<MangooseGame />}
          />

          <Route
            path="/games/uno/:roomCode"
            element={<UnoGame />}
          />

          <Route
            path="/games/jack-thief/:roomCode"
            element={<JackThiefGame />}
          />

          <Route
            path="/games/napoleon/:roomCode"
            element={<NapoleonGame />}
          />

          <Route
            path="/games/bridge/:roomCode"
            element={<BridgeGame />}
          />

          <Route
            path="/games/spades/:roomCode"
            element={<SpadesGame />}
          />

          <Route
            path="/games/twenty-nine/:roomCode"
            element={<TwentyNineGame />}
          />

          <Route
            path="/games/mindi-coat/:roomCode"
            element={<MindiCoatGame />}
          />

          <Route
            path="/games/bluff/:roomCode"
            element={<BluffGame />}
          />

          <Route
            path="/games/satte-pe-satta/:roomCode"
            element={<SattePeSattaGame />}
          />

          <Route
            path="/games/war/:roomCode"
            element={<WarGame />}
          />

          <Route
            path="/games/solitaire/:roomCode"
            element={<SolitaireGame />}
          />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;