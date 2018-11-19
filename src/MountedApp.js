import React from "react";
import gql from "graphql-tag";
import { graphql } from "react-apollo";
import { compose, branch, renderNothing } from "recompose";
import { Helmet } from "react-helmet";

import withRouter from "./withRouter.js";
import ViewportPanel from "./ViewportPanel.js";

export default compose(
  withRouter,
  graphql(
    gql`
      query($mountedAppName: String!) {
        mountedApp(name: $mountedAppName) {
          id
          name
        }
      }
    `,
    {
      options: ({ params }) => ({
        variables: {
          mountedAppName: params.mountedAppName,
        },
      }),
    },
  ),
  branch(({ data }) => data.loading || data.error, renderNothing),
)(
  class MountedApp extends React.Component {
    render() {
      const { data, mountedAppProxyPath } = this.props;

      return (
        <>
          <Helmet title={data.mountedApp.name} />
          <ViewportPanel title={data.mountedApp.name}>
            <iframe
              title={data.mountedApp.name}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                border: "solid 1px #ccc",
              }}
              src={mountedAppProxyPath({ mountedAppId: data.mountedApp.id })}
            />
          </ViewportPanel>
        </>
      );
    }
  },
);
