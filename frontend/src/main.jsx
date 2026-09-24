import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "./components/game-animation/gameAnimation.css";
import "./components/game-animation/gameSpecificAnimation.css";
import "./components/game-animation/responsiveGamePolish.css";
import "./components/game-animation/finalGamePolish.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);