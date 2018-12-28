import React from "react";
import { Route, Switch, Redirect } from "react-router";
import { compose } from "recompose";

import paths from "../helpers/paths.js";
import Terminal from "./Terminal.js";
import NewTerminal from "./NewTerminal.js";
import withRouter from "../helpers/withRouter.js";

export default compose(withRouter)(
  class Terminals extends React.Component {
    render() {
      const { terminalsPath } = this.props;

      return (
        <Switch>
          <Route
            path={paths.terminalsPath.matcher}
            exact
            component={NewTerminal}
          />
          <Route path={paths.terminalPath.matcher} component={Terminal} />
          <Redirect to={terminalsPath()} />
        </Switch>
      );
    }
  },
);
