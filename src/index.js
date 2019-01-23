import React from "react";
import ReactDOM from "react-dom";
import "roboto-fontface";
import { ApolloProvider } from "react-apollo";
import { BrowserRouter } from "react-router-dom";
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faArchive,
  faTerminal,
  faGlobeAsia,
  faPlus,
  faCogs,
  faSave,
  faTrash,
  faExternalLinkAlt,
  faPen,
  faPowerOff,
  faExpand,
} from "@fortawesome/free-solid-svg-icons";
import { faDocker } from "@fortawesome/free-brands-svg-icons";

import "typeface-roboto";
import "bootstrap/dist/css/bootstrap.css";
import "./index.css";
import App from "./parts/App.js";
import apolloClient from "./helpers/apolloClient.js";

library.add(
  faArchive,
  faTerminal,
  faGlobeAsia,
  faPlus,
  faCogs,
  faSave,
  faTrash,
  faExternalLinkAlt,
  faPen,
  faPowerOff,
  faExpand,
  { ...faDocker, prefix: "fas" },
);

ReactDOM.render(
  <BrowserRouter>
    <ApolloProvider client={apolloClient}>
      <App />
    </ApolloProvider>
  </BrowserRouter>,
  document.getElementById("root"),
);
