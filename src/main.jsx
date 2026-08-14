import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <div style={{ display: "flex", justifyContent: "center", padding: "24px 12px" }}>
      <App />
    </div>
  </React.StrictMode>
);
