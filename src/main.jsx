import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100dvh", padding: "12px 8px", boxSizing: "border-box" }}>
      <App />
    </div>
  </React.StrictMode>
);
