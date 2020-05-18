import React from "react";
import { hot } from "react-hot-loader/root";
import { ApolloProvider } from "@apollo/react-common";
import { BrowserRouter } from "react-router-dom";
import {
  useMediaQuery,
  createMuiTheme,
  MuiThemeProvider,
  CssBaseline,
} from "@material-ui/core";

import apolloClient from "../services/apolloClient";
import ViewPort from "./Viewport";
import RouteEventListener from "./RouteEventListener";

export default hot(React.memo(App));
function App() {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const theme = React.useMemo(
    () =>
      createMuiTheme({
        palette: {
          type: prefersDarkMode ? "dark" : "light",
          primary: { main: "#1976D2" },
          secondary: { main: "#00838F" },
        },
        typography: {
          useNextVariants: true,
          button: {
            textTransform: "none",
          },
        },
      }),
    [prefersDarkMode],
  );

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <ApolloProvider client={apolloClient}>
        <BrowserRouter>
          <RouteEventListener />
          <ViewPort />
        </BrowserRouter>
      </ApolloProvider>
    </MuiThemeProvider>
  );
}
