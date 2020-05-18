import _ from "lodash";
import { print as printGraphQL } from "graphql/language/printer";

import ExtendedError from "./ExtendedError";

function getApolloErrors(apolloError) {
  const operation = apolloError.operation && {
    query: printGraphQL(apolloError.operation.query),
    variables: apolloError.operation.variables,
  };

  const errors = [];
  for (const graphQLError of apolloError.graphQLErrors || []) {
    const code = _.get(graphQLError, "extensions.code", "unknown");
    const path = _.get(graphQLError, "path") || [];

    errors.push(
      new ExtendedError(graphQLError.message, {
        type: "GraphQLError",
        operation,
        code,
        path: path.join(" -> "),
      }),
    );
  }

  if (apolloError.networkError) {
    const { statusCode, bodyText, name, message } = apolloError.networkError;
    if (name === "ServerParseError")
      errors.push(
        new ExtendedError("无法加载操作结果，请刷新重试", {
          type: "NetworkError",
          operation,
          statusCode,
          bodyText,
          syntaxErrorMessag: message,
        }),
      );
    else
      errors.push(
        new ExtendedError(
          `网络错误(${
            statusCode && statusCode !== 200 ? statusCode : message || name
          })`,
          {
            type: "NetworkError",
            statusCode,
            bodyText,
          },
        ),
      );
  }

  return errors;
}

export default getApolloErrors;
