import React from "react";
import gql from "graphql-tag";
import { useNavigate } from "react-router";

import useAction from "../hooks/useAction";
import Widget from "../controls/Widget";
import Form from "../controls/Form";

export default PullImageView;
function PullImageView({ useTitle }) {
  const title = "run command";
  useTitle(title);
  const navigate = useNavigate();

  const imagePull = useAction(gql`
    mutation ($tag: String!) {
      imagePull(tag: $tag) {
        id
      }
    }
  `);

  return (
    <>
      <Widget title={title}>
        <Form
          onSubmit={async ({ ...formData }) => {
            const result = await imagePull({
              ...formData,
            });
            navigate(`/images/${result.imagePull.id}`);
          }}
          fields={[
            //
            ["String", "tag", "", { required: true }],
          ]}
        />
      </Widget>
    </>
  );
}
