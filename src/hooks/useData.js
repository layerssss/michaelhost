import { useEffect } from "react";
import { useQuery } from "@apollo/react-hooks";

// import useProgressBar from "./useProgressBar";

export default function useData(query, variables, { ...options } = {}) {
  const { data, loading, error, refetch } = useQuery(query, {
    variables,
    errorPolicy: "none",
    partialRefetch: true,
    fetchPolicy: "cache-and-network",
    ...options,
  });

  const dataInvalid = !data || !Object.keys(data).length || !!error;
  // useProgressBar(loading, { unobstrusive: true });

  useEffect(() => {
    if (error) console.error(error);
  }, [error]);

  const dataObject = dataInvalid ? null : data;

  return [dataObject, { refetch, loading }];
}
