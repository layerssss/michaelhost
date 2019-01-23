import React from "react";
import gql from "graphql-tag";
import { compose } from "recompose";
import { Helmet } from "react-helmet";

import withRouter from "../helpers/withRouter.js";
import withData from "../helpers/withData.js";

import ViewportPanel from "../components/ViewportPanel.js";

export default compose(
  withRouter,
  withData(
    gql`
      query($mountedAppId: ID!) {
        mountedApp(id: $mountedAppId) {
          id
          name
        }
      }
    `,
    ({ params }) => ({
      mountedAppId: params.mountedAppId,
    }),
  ),
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