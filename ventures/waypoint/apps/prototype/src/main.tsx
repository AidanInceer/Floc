import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { Store } from "./store";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Store>
      <App />
    </Store>
  </StrictMode>,
);
