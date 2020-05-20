import { useEffect } from "react";
import _ from "lodash";
import { useQuery } from "@apollo/react-hooks";

import useProgressBar from "./useProgressBar";

export default function useData(query, variables, { ...options } = {}) {
  const { data, loading, error, refetch } = useQuery(query, {
    variables,
    errorPolicy: "none",
    partialRefetch: true,
    ...options,
  });

  const dataInvalid = !data || !Object.keys(data).length || !!error;
  const [, progressBarSet] = useProgressBar();

  useEffect(() => {
    progressBarSet(loading);
  }, [loading]);
  useEffect(() => {
    if (error)
      _.defer(() => {
        throw error;
      });
  }, [!error]);

  const dataObject = dataInvalid ? null : data;

  return [dataObject, { refetch, loading }];
}
