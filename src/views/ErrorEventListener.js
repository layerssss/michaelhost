import React, { useEffect } from "react";
import { useSnackbar } from "notistack";

import getApolloErrors from "../services/getApolloErrors";

export default React.memo(ErrorEventListener);

function ErrorEventListener() {
  const { enqueueSnackbar } = useSnackbar();
  useEffect(() => {
    const handleError = event => {
      var error = event.error || event.reason;
      if (!error) return;
      if (error.isAbortError) event.preventDefault();
      let errors = getApolloErrors(error);
      if (!errors.length) errors = [error];
      for (const error of errors)
        enqueueSnackbar(error.message, {
          variant: "error",
          ContentProps: {
            style: {
              whiteSpace: "pre-line",
            },
          },
        });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleError);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleError);
    };
  }, []);

  return null;
}
