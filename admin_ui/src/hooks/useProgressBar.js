import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { LinearProgress } from "@mui/material";

export default function useProgressBar() {
  const [loading, loadingSet] = useState(false);
  const progressRootRef = useRef(null);

  useEffect(() => {
    const element = document.createElement("div");
    document.body.appendChild(element);
    const root = createRoot(element);
    progressRootRef.current = root;

    return () => {
      progressRootRef.current = null;
      setTimeout(() => {
        root.unmount();
        document.body.removeChild(element);
      }, 0);
    };
  }, []);

  useEffect(() => {
    const root = progressRootRef.current;
    if (!root) return;
    root.render(
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
    );
  }, [loading]);

  const progressBarSet = (progress) => loadingSet(!!progress);
  const progressBar = async (func) => {
    loadingSet(true);
    try {
      return await func();
    } finally {
      loadingSet(false);
    }
  };

  return [progressBar, progressBarSet];
}
