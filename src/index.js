import React from "react";
import ReactDOM from "react-dom";
import "roboto-fontface";
import { ApolloProvider } from "react-apollo";
import { BrowserRouter } from "react-router-dom";

import "typeface-roboto";
import "bootswatch/cerulean/bootstrap.css";
import "./index.css";
import App from "./App.js";
import apolloClient from "./apolloClient.js";

ReactDOM.render(
  <BrowserRouter>
    <ApolloProvider client={apolloClient}>
      <App />
    </ApolloProvider>
  </BrowserRouter>,
  document.getElementById("root"),
);
