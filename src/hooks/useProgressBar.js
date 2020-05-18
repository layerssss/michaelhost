import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { LinearProgress } from "@material-ui/core";

export default function useProgressBar() {
  const [loading, loadingSet] = useState(false);

  useEffect(() => {
    const element = document.createElement("div");
    document.body.appendChild(element);
    ReactDOM.render(
      <div
        style={{
          position: "fixed",
          zIndex: 10000,
          top: 0,
          left: 0,
          right: 0,
          transition: "opacity ease .3s",
          opacity: loading ? 1 : 0,
        }}
      >
        <LinearProgress />
      </div>,
      element,
    );
    return () => {
      ReactDOM.unmountComponentAtNode(element);
      document.body.removeChild(element);
    };
  }, [loading]);

  const progressBarSet = progress => loadingSet(!!progress);
  const progressBar = async func => {
    loadingSet(true);
    try {
      return await func();
    } finally {
      loadingSet(false);
    }
  };

  return [progressBar, progressBarSet];
}
