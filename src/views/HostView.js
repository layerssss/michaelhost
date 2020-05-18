import React from "react";
import gql from "graphql-tag";
import { Pencil, Web } from "mdi-material-ui";

import useData from "../hooks/useData";
import Widget from "../controls/Widget";
import Actions from "../controls/Actions";
import StaticForm from "../controls/StaticForm";

export default React.memo(HostView);
function HostView({ useTitle, hostId }) {
  const [data] = useData(
    gql`
      query HostView($hostId: ID!) {
        host(id: $hostId) {
          id
          enabled
          hostname
          upstream
          redirect
          ssl
          changeOrigin
          oidcConfig {
            id
            discoveryUrl
            clientId
            allowEmails
          }
        }
      }
    `,
    { hostId },
  );
  const title = `host: ${data?.host.hostname}`;
  useTitle(title);
  return (
    <>
      <Actions
        actions={[
          {
            icon: <Pencil />,
            title: "edit",
            href: `/hosts/${hostId}/edit`,
          },
        ]}
      />
      <Widget title={title} icon={<Web />}>
        <StaticForm
          fields={[
            ["enabled", data?.host.enabled],
            ["hostname", data?.host.hostname],
            ["upstream", data?.host.upstream],
            ["redirect", data?.host.redirect],
            ["ssl", data?.host.ssl],
            ["change origin", data?.host.changeOrigin],
          ]}
        />
      </Widget>
      {data?.host.oidcConfig && (
        <Widget title="oidc config">
          <StaticForm
            fields={[
              ["discovery url", data?.host.oidcConfig.discoveryUrl],
              ["client id", data?.host.oidcConfig.clientId],
              ["allow emails", data?.host.oidcConfig.allowEmails.join(", ")],
            ]}
          />
        </Widget>
      )}
    </>
  );
}
