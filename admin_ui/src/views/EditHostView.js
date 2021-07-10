import React from "react";
import gql from "graphql-tag";
import { useHistory } from "react-router";

import useData from "../hooks/useData";
import useAction from "../hooks/useAction";
import Widget from "../controls/Widget";
import Form from "../controls/Form";

export default React.memo(EditHostView);
function EditHostView({ hostId, useTitle }) {
  const [data] = useData(
    gql`
      query EditHostView($hostId: ID!) {
        host(id: $hostId) {
          id
          hostname
          enabled
          upstream
          redirect
          ssl
          plain
          changeOrigin
          whitelistIps
          oidcConfig {
            id
            discoveryUrl
            clientId
            clientSecret
            allowEmails
          }
        }
      }
    `,
    { hostId },
  );
  const title = `edit host: ${data?.host.hostname}`;
  useTitle(title);
  const history = useHistory();

  const updateHost = useAction(
    gql`
      mutation(
        $id: ID!
        $hostname: String!
        $ssl: Boolean!
        $plain: Boolean!
        $upstream: String!
        $enabled: Boolean!
        $redirect: Boolean!
        $changeOrigin: Boolean!
        $oidcConfig: OidcConfigInput
        $whitelistIps: String!
      ) {
        updateHost(
          id: $id
          hostname: $hostname
          ssl: $ssl
          plain: $plain
          upstream: $upstream
          enabled: $enabled
          redirect: $redirect
          changeOrigin: $changeOrigin
          whitelistIps: $whitelistIps
          oidcConfig: $oidcConfig
        ) {
          id
          hostname
          upstream
          ssl
          plain
          enabled
          redirect
          changeOrigin
          whitelistIps
          oidcConfig {
            id
            discoveryUrl
            clientId
            clientSecret
            allowEmails
          }
        }
      }
    `,
  );

  return (
    <Widget title={title}>
      {data && (
        <Form
          onSubmit={async ({
            oidcEnabled,
            discoveryUrl,
            clientId,
            clientSecret,
            allowEmailsString,
            ...formData
          }) => {
            await updateHost({
              id: hostId,
              ...formData,
              oidcConfig: !oidcEnabled
                ? null
                : {
                    discoveryUrl,
                    clientId,
                    clientSecret,
                    allowEmails: allowEmailsString
                      .split(",")
                      .map((s) => s.trim())
                      .filter((s) => s),
                  },
            });
            history.push(`/hosts/${hostId}`);
          }}
          fields={[
            ["Boolean", "enabled", data.host.enabled],
            ["String", "hostname", data.host.hostname, { required: true }],
            [
              "String",
              "upstream",
              data.host.upstream,
              { required: true, type: "url" },
            ],
            ["Boolean", "redirect", data.host.redirect],
            ["Boolean", "ssl", data.host.ssl],
            ["Boolean", "plain", data.host.plain],
            ["Boolean", "changeOrigin", data.host.changeOrigin],
            ["String", "whitelistIps", data.host.whitelistIps],
            ["Boolean", "oidcEnabled", !!data.host.oidcConfig],
            [
              "String",
              "discoveryUrl",
              data.host.oidcConfig?.discoveryUrl || "",
              { type: "url" },
            ],
            ["String", "clientId", data.host.oidcConfig?.clientId || ""],
            [
              "String",
              "clientSecret",
              data.host.oidcConfig?.clientSecret || "",
            ],
            [
              "String",
              "allowEmailsString",
              data.host.oidcConfig?.allowEmails.join(", ") || "",
              { label: "allow emails" },
            ],
          ]}
        />
      )}
    </Widget>
  );
}
