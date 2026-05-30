import React, { useState, useEffect, useMemo } from "react";
import _ from "lodash";
import { useSnackbar } from "notistack";
import gql from "graphql-tag";
import { useNavigate, useLocation, matchPath } from "react-router";
import { Home, Console, ChevronRight } from "mdi-material-ui";
import {
  Toolbar,
  IconButton,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Tooltip,
  AppBar,
} from "@mui/material";
import { useApolloClient } from "@apollo/client/react";

import useBreadcrumb from "../hooks/useBreadcrumb";
import useWebSocket from "../hooks/useWebSocket";
import useData from "../hooks/useData";
import routes from "../services/routes";
import navItems from "../services/navItems";

export default ViewPort;
export const viewportContext = React.createContext();

function ViewPort() {
  const [data] = useData(gql`
    query ViewPort {
      hostname
      terminals {
        id
        name
      }
    }
  `);
  const location = useLocation();
  const navigate = useNavigate();
  const [breadcrumbs, breadcrumbsSet] = useState([]);
  const currentMatch = useMemo(
    () =>
      routes
        .map(([path, Component]) => ({
          path,
          Component,
          match: matchPath({ path, end: true }, location.pathname),
        }))
        .find(({ match }) => match),
    [location.pathname],
  );

  useEffect(() => {
    if (!currentMatch) navigate("/dashboard", { replace: true });
  }, [!!currentMatch]);
  const { enqueueSnackbar } = useSnackbar();
  const apolloClient = useApolloClient();
  useWebSocket(`/api/state`, ({ terminals, error, message }) => {
    if (terminals)
      apolloClient.writeQuery({
        query: gql`
          query {
            terminals {
              id
              name
            }
          }
        `,
        data: {
          terminals,
        },
      });
    if (message) enqueueSnackbar(message);
    if (error)
      _.defer(() => {
        const { message: _message, name, ...errorInfo } = error;
        throw new Error(
          [
            `Error in ${name}`,
            ...Object.entries(errorInfo).map(
              ([k, v]) => `${k}: ${JSON.stringify(v)}`,
            ),
            error.message,
          ].join("\n"),
        );
      });
  });

  return (
    <viewportContext.Provider value={{ breadcrumbsSet }}>
      <Drawer
        variant="permanent"
        slotProps={{ paper: { style: { width: 54 } } }}
      >
        <List disablePadding>
          {navItems.map(([title, href, icon]) => (
            <ListItem key={title} disablePadding>
              <ListItemButton
                component="a"
                href={href}
                selected={
                  !!matchPath({ path: href, end: false }, location.pathname)
                }
              >
                <Tooltip title={title}>
                  <ListItemIcon>{icon}</ListItemIcon>
                </Tooltip>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
      <main style={{ marginLeft: 54 }}>
        <AppBar position="sticky">
          <Toolbar style={{ flexFlow: "row wrap" }}>
            <IconButton title={data?.hostname} href="/" color="inherit">
              <Home />
            </IconButton>
            {breadcrumbs.map(({ id, title, href }) => (
              <React.Fragment key={id}>
                <ChevronRight />
                <Button href={href} color="inherit">
                  {title}
                </Button>
              </React.Fragment>
            ))}
            <div style={{ flex: "1 0 auto" }} />
            {data?.terminals.map((terminal) => (
              <IconButton
                key={terminal.id}
                href={`/terminals/${terminal.id}`}
                color="inherit"
              >
                <Tooltip title={`terminal: ${terminal.name}`}>
                  <Console />
                </Tooltip>
              </IconButton>
            ))}
          </Toolbar>
        </AppBar>
        {currentMatch && (
          <div
            style={{
              display: "flex",
              flexFlow: "row wrap",
              justifyContent: "stretch",
            }}
          >
            <currentMatch.Component
              {...currentMatch.match.params}
              useTitle={(title) => {
                useBreadcrumb({
                  title,
                  href: currentMatch.match.pathname,
                });
              }}
            />
          </div>
        )}
      </main>
    </viewportContext.Provider>
  );
}
