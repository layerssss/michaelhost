import React, { useEffect, useRef } from "react";
import { Terminal as XTerm } from "xterm";
import { useComponentSize } from "react-use-size";
import { FileDocument } from "mdi-material-ui";

import useWebSocket from "../hooks/useWebSocket";
import Widget from "../controls/Widget";

export default React.memo(LogsView);
function LogsView({ useTitle }) {
  const title = "logs";
  useTitle(title);
  const terminalSize = useComponentSize();
  const containerRef = useRef();
  const xtermRef = useRef();
  useWebSocket(
    `/api/log`,
    data => {
      if (data.output && xtermRef.current) xtermRef.current.write(data.output);
    },
    () => {
      if (xtermRef.current) xtermRef.current.clear();
    },
  );
  useEffect(() => {
    const xterm = new XTerm({
      cursorBlink: true,
    });
    xtermRef.current = xterm;
    xterm.open(containerRef.current);
    return () => {
      xterm.destroy();
      xtermRef.current = null;
    };
  }, []);
  useEffect(() => {
    if (xtermRef.current) xtermRef.current.fit();
  }, [terminalSize.width, terminalSize.height]);

  return (
    <>
      <Widget title={title} icon={<FileDocument />}>
        <div style={{ height: "calc(100vh - 150px)" }}>
          <div
            style={{ height: "100%", position: "relative" }}
            ref={terminalSize.ref}
          >
            <div style={{ height: "100%" }} ref={containerRef}></div>
          </div>
        </div>
      </Widget>
    </>
  );
}
