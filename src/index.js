import "react-app-polyfill/ie9";
import "react-app-polyfill/stable";
// This must be loaded before react
import "react-hot-loader";
import React from "react";
import ReactDOM from "react-dom";
import { Terminal as XTerm } from "xterm";
import * as fit from "xterm/lib/addons/fit/fit";

import "./index.css";
import "xterm/lib/xterm.css";

// import getApolloErrors from "./services/getApolloErrors";
import App from "./views/App";

// function handleError(event) {
//   var error = event.error || event.reason;
//   if (!error) return;
//   if (error.isAbortError) event.preventDefault();
//   let errors = getApolloErrors(error);
//   if (!errors.length) errors = [error];
//   for (const error of errors) alert(error.message);
// }
//
// window.addEventListener("error", handleError);
// window.addEventListener("unhandledrejection", handleError);
XTerm.applyAddon(fit);

ReactDOM.render(<App />, document.getElementById("root"));
