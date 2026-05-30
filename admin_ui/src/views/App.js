import React from "react";
import { ApolloProvider } from "@apollo/client/react";
import { BrowserRouter } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import { useMediaQuery, CssBaseline } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";

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
          mode: prefersDarkMode ? "dark" : "light",
          primary: { main: "#1976D2" },
          secondary: { main: "#00838F" },
        },
        typography: {
          button: {
            textTransform: "none",
          },
        },
      }),
    [prefersDarkMode],
  );

  return (
    <ThemeProvider theme={theme}>
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
    </ThemeProvider>
  );
}
