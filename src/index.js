import "react-app-polyfill/ie9";
import "react-app-polyfill/stable";
// This must be loaded before react
import "react-hot-loader";
import React from "react";
import ReactDOM from "react-dom";
import { Terminal as XTerm } from "xterm";
import * as fit from "xterm/lib/addons/fit/fit";
import "typeface-roboto";
import "xterm/lib/xterm.css";

import "./index.css";
import App from "./views/App";

XTerm.applyAddon(fit);

ReactDOM.render(<App />, document.getElementById("root"));
