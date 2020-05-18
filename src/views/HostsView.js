import React from "react";
import gql from "graphql-tag";
import { Plus } from "mdi-material-ui";

import useData from "../hooks/useData";
import useAction from "../hooks/useAction";
import Widget from "../controls/Widget";
import Table from "../controls/Table";
import Actions from "../controls/Actions";
import { HostsIcon } from "../controls/icons";

export default React.memo(HostsView);
function HostsView({ useTitle }) {
  useTitle("hosts");
  const [data] = useData(gql`
    query HostsView {
      hosts {
        id
        hostname
        enabled
        ssl
        upstream
      }
    }
  `);

  const deleteHost = useAction(
    gql`
      mutation HostsView($hostId: ID!) {
        deleteHost(id: $hostId) {
          id
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
      <Widget title="hosts" icon={<HostsIcon />}>
        <Table
          columns={["enabled", "ssl", "hostname", "upstream"]}
          rows={data?.hosts.map(host => ({
            values: [host.enabled, host.ssl, host.hostname, host.upstream],
            actions: [
              { title: "view", href: `/hosts/${host.id}` },
              {
                title: "delete",
                onClick: () => {
                  if (!window.confirm("Are you sure?")) return;
                  deleteHost({
                    hostId: host.id,
                  });
                },
              },
            ],
          }))}
        />
      </Widget>
      <Actions
        actions={[
          {
            icon: <Plus />,
            title: "new host",
            href: "/hosts/new",
          },
        ]}
      />
    </>
  );
}
