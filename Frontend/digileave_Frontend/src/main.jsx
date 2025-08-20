// main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";


const savedTheme = localStorage.getItem("theme") 
  || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

document.documentElement.setAttribute("data-theme", savedTheme);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App initialTheme={savedTheme} />
  </React.StrictMode>
);
