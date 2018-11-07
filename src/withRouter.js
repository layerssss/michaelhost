import { compose, withProps } from "recompose";
import { withRouter as rrWithRouter } from "react-router";
import { matchPath } from "react-router-dom";

import paths from "./paths.js";

const withRouter = compose(
  rrWithRouter,
  withProps(({ location, history }) => {
    const newProps = {};
    newProps.params = {};

    for (const [pathName, { matcher, generate }] of Object.entries(paths)) {
      newProps[pathName] = generate;
      const match = matchPath(location.pathname, matcher);
      if (match)
        newProps.params = {
          ...newProps.params,
          ...match.params
        };
    }

    return newProps;
  })
);

export default withRouter;
