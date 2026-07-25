import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { StoreProvider } from "./store";
import { App } from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div className="proto-strip">
      <b>PROTOTYPE</b> — worked example, stored in a SQLite database in this browser only
    </div>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
);
