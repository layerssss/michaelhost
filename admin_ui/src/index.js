import React from "react";
import { createRoot } from "react-dom/client";
import "typeface-roboto";
import "@xterm/xterm/css/xterm.css";

import "./index.css";
import App from "./views/App";

const root = createRoot(document.getElementById("root"));
root.render(<App />);
