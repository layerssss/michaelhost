import React from "react";
import gql from "graphql-tag";

import useData from "../hooks/useData";
import Widget from "../controls/Widget";
import Table from "../controls/Table";
import { ServicesIcon } from "../controls/icons";

export default React.memo(ServicesView);
function ServicesView({ useTitle }) {
  const title = "services";
  useTitle(title);
  const [data] = useData(gql`
    query ServicesView {
      services {
        id
        name
        image
        replicas
      }
    }
  `);

  return (
    <>
      <Widget title={title} icon={<ServicesIcon />}>
        <Table
          columns={["name", "image", "relicas"]}
          rows={data?.services.map((service) => ({
            values: [service.name, service.image, service.replicas],
            actions: [{ title: "view", href: `/services/${service.id}` }],
          }))}
        />
      </Widget>
    </>
  );
}
