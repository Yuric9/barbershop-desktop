import React from "react";
import ReactDOM from "react-dom/client";
import App from "./AppModern";
import "./styles.css";
import "./enhancements.css";
import "./ui-enhancements";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
