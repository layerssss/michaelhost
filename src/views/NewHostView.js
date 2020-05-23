import React from "react";
import uuid from "uuid";
import gql from "graphql-tag";
import { useHistory } from "react-router";

import useAction from "../hooks/useAction";
import Widget from "../controls/Widget";
import Form from "../controls/Form";

export default React.memo(NewHostView);
function NewHostView({ useTitle }) {
  useTitle("new host");
  const history = useHistory();

  const updateHost = useAction(
    gql`
      mutation(
        $id: ID!
        $hostname: String!
        $ssl: Boolean!
        $upstream: String!
        $enabled: Boolean!
        $redirect: Boolean!
        $changeOrigin: Boolean!
        $oidcConfig: OidcConfigInput
      ) {
        updateHost(
          id: $id
          hostname: $hostname
          ssl: $ssl
          upstream: $upstream
          enabled: $enabled
          redirect: $redirect
          changeOrigin: $changeOrigin
          oidcConfig: $oidcConfig
        ) {
          id
          hostname
          upstream
          ssl
          enabled
          redirect
          changeOrigin
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
    {
      refetchQueries: [
        {
          query: gql`
            {
              hosts {
                id
              }
            }
          `,
        },
      ],
    },
  );

  return (
    <>
      <Widget title="new host">
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
              id: uuid.v4().slice(0, 8),
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
            history.push("/hosts");
          }}
          fields={[
            ["Boolean", "enabled", false],
            ["String", "hostname", "", { required: true }],
            ["String", "upstream", "", { required: true, type: "url" }],
            ["Boolean", "redirect", false],
            ["Boolean", "ssl", false],
            ["Boolean", "changeOrigin", false],
            ["Boolean", "oidcEnabled", false],
            ["String", "discoveryUrl", "", { type: "url" }],
            ["String", "clientId", ""],
            ["String", "clientSecret", ""],
            ["String", "allowEmailsString", "", { label: "allow emails" }],
          ]}
        />
      </Widget>
    </>
  );
}
