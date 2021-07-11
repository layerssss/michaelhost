import React from "react";
import { ApolloProvider } from "@apollo/react-common";
import { BrowserRouter } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import {
  useMediaQuery,
  createTheme,
  MuiThemeProvider,
  CssBaseline,
} from "@material-ui/core";

import FormDialogsProvider from "../providers/FormDialogsProvider";
import apolloClient from "../services/apolloClient";
import ViewPort from "./Viewport";
import RouteEventListener from "./RouteEventListener";
import ErrorEventListener from "./ErrorEventListener";

export default React.memo(App);
function App() {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const theme = React.useMemo(
    () =>
      createTheme({
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
      <SnackbarProvider>
        <ApolloProvider client={apolloClient}>
          <BrowserRouter>
            <FormDialogsProvider>
              <ErrorEventListener />
              <RouteEventListener />
              <ViewPort />
            </FormDialogsProvider>
          </BrowserRouter>
        </ApolloProvider>
      </SnackbarProvider>
    </MuiThemeProvider>
  );
}
