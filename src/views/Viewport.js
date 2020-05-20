import React, { useState, useEffect, useMemo } from "react";
import _ from "lodash";
import { useSnackbar } from "notistack";
import gql from "graphql-tag";
import { Route, useHistory, useLocation, matchPath } from "react-router";
import { Console } from "mdi-material-ui";
import {
  Toolbar,
  IconButton,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  Tooltip,
  AppBar,
} from "@material-ui/core";
import { useApolloClient } from "@apollo/react-common";
import { ChevronRight } from "mdi-material-ui";

import useBreadcrumb from "../hooks/useBreadcrumb";
import useWebSocket from "../hooks/useWebSocket";
import useData from "../hooks/useData";
import routes from "../services/routes";
import navItems from "../services/navItems";

export default React.memo(ViewPort);
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
  const history = useHistory();
  const [breadcrumbs, breadcrumbsSet] = useState([]);
  const currentPath = useMemo(
    () =>
      routes
        .map(([path]) => path)
        .find(path => matchPath(location.pathname, { exact: true, path })),
    [location.pathname],
  );

  useEffect(() => {
    if (!currentPath) history.replace("/dashboard");
  }, [!!currentPath]);
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
        const { message, name, ...errorInfo } = error;
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
      <Drawer variant="permanent" PaperProps={{ style: { width: 54 } }}>
        <List disablePadding>
          {navItems.map(([title, href, icon]) => (
            <ListItem
              key={title}
              button
              component="a"
              href={href}
              selected={!!matchPath(location.pathname, { path: href })}
            >
              <Tooltip title={title}>
                <ListItemIcon>{icon}</ListItemIcon>
              </Tooltip>
            </ListItem>
          ))}
        </List>
      </Drawer>
      <main style={{ marginLeft: 54 }}>
        <AppBar position="sticky">
          <Toolbar style={{ flexFlow: "row wrap" }}>
            <Button href="/" color="inherit">
              {data?.hostname || "-"}
            </Button>
            {breadcrumbs.map(({ id, title, href }) => (
              <React.Fragment key={id}>
                <ChevronRight />
                <Button href={href} color="inherit">
                  {title}
                </Button>
              </React.Fragment>
            ))}
            <div style={{ flex: "1 0 auto" }} />
            {data?.terminals.map(terminal => (
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
        {routes.map(([path, Component]) => (
          <Route
            key={path}
            path={path}
            render={({ match }) => (
              <div
                style={
                  match.isExact
                    ? {
                        display: "flex",
                        flexFlow: "row wrap",
                        justifyContent: "stretch",
                      }
                    : {
                        display: "none",
                      }
                }
              >
                <Component
                  {...match.params}
                  useTitle={title => {
                    // eslint-disable-next-line react-hooks/rules-of-hooks
                    useBreadcrumb({
                      title,
                      href: match.url,
                    });
                  }}
                />
              </div>
            )}
          />
        ))}
      </main>
    </viewportContext.Provider>
  );
}
