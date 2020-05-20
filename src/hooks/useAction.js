import { useMutation } from "@apollo/react-hooks";

import useProgressBar from "./useProgressBar";

export default function useAction(mutation, defaultOptions) {
  const [mutate, { loading, error }] = useMutation(mutation);
  const [progressBar] = useProgressBar();
  const action = async (variables, actionOptions) => {
    const options = {
      ...(defaultOptions?.constructor === Function
        ? defaultOptions(variables)
        : defaultOptions),
      ...actionOptions,
    };

    return await progressBar(async () => {
      const result = await mutate({
        variables,
        ...options,
      });

      return result.data;
    });
  };

  action.loading = loading;
  action.error = error;
  return action;
}
