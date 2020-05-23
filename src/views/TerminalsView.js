import React from "react";
import gql from "graphql-tag";
import { ConsoleLine } from "mdi-material-ui";

import useData from "../hooks/useData";
import Widget from "../controls/Widget";
import Table from "../controls/Table";
import Actions from "../controls/Actions";
import { TerminalsIcon } from "../controls/icons";

export default React.memo(Terminals);
function Terminals({ useTitle }) {
  const title = "terminals";
  useTitle(title);
  const [data] = useData(gql`
    query Terminals {
      terminals {
        id
        name
      }
    }
  `);

  return (
    <>
      <Widget title={title} icon={<TerminalsIcon />}>
        <Table
          columns={["name"]}
          rows={data?.terminals.map((terminal) => ({
            values: [terminal.name],
            actions: [
              {
                title: "View",
                href: `/terminals/${terminal.id}`,
              },
            ],
          }))}
        />
      </Widget>
      <Actions
        actions={[
          {
            icon: <ConsoleLine />,
            title: "run command",
            href: "/terminals/new",
          },
        ]}
      />
    </>
  );
}
