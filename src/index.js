import "react-app-polyfill/ie9";
import "react-app-polyfill/stable";
// This must be loaded before react
import "react-hot-loader";
import React from "react";
import ReactDOM from "react-dom";
import "typeface-roboto";
import "xterm/css/xterm.css";

import "./index.css";
import App from "./views/App";

ReactDOM.render(<App />, document.getElementById("root"));
