import { useMutation } from "@apollo/react-hooks";

// import { useProgressBar } from "hooks";

export default function useAction(mutation, defaultOptions) {
  const [mutate, { loading, error }] = useMutation(mutation);
  // const progressBar = useProgressBar();
  const action = async (variables, actionOptions) => {
    const {
      // progressBarOptions = {},
      ...options
    } = {
      ...(defaultOptions?.constructor === Function
        ? defaultOptions(variables)
        : defaultOptions),
      ...actionOptions,
    };

    // return await progressBar(progressBarOptions, async () => {
    const result = await mutate({
      variables,
      ...options,
    });

    return result.data;
    // });
  };

  action.loading = loading;
  action.error = error;
  return action;
}
