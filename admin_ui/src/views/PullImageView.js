import React from "react";
import gql from "graphql-tag";
import { useHistory } from "react-router";

import useAction from "../hooks/useAction";
import Widget from "../controls/Widget";
import Form from "../controls/Form";

export default React.memo(PullImageView);
function PullImageView({ useTitle }) {
  const title = "run command";
  useTitle(title);
  const history = useHistory();

  const imagePull = useAction(
    gql`
      mutation($tag: String!) {
        imagePull(tag: $tag) {
          id
        }
      }
    `,
  );

  return (
    <>
      <Widget title={title}>
        <Form
          onSubmit={async ({ ...formData }) => {
            const result = await imagePull({
              ...formData,
            });
            history.push(`/images/${result.imagePull.id}`);
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
