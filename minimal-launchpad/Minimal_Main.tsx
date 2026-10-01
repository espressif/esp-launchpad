import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MinimalApp } from "./MinimalApp";
import "xterm/css/xterm.css";
import "../src/styles/globals.css";
import "../src/styles/app.css";
import "./minimal_ui_styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MinimalApp />
  </StrictMode>,
);
