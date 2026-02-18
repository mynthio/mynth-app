import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

document.body.classList.add("theme");
const rootElement = document.getElementById("root");

if (!rootElement) {
	throw new Error("Root element #root was not found.");
}

rootElement.classList.add("theme");

createRoot(rootElement).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
