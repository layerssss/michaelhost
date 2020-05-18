import React, { useEffect, useState, useRef } from "react";
import { Fab } from "@material-ui/core";
import { Terminal as XTerm } from "xterm";
import { useComponentSize } from "react-use-size";
import { Stop } from "mdi-material-ui";

import useWebSocket from "../hooks/useWebSocket";

export default React.memo(Terminal);
function Terminal({ terminalId }) {
  const terminalSize = useComponentSize();
  const [alive, aliveSet] = useState(false);
  const containerRef = useRef();
  const xtermRef = useRef();
  const webSocket = useWebSocket(
    `/api/terminals/${terminalId}`,
    data => {
      aliveSet(data.alive);
      if (data.output && xtermRef.current) xtermRef.current.write(data.output);
    },
    () => {
      if (xtermRef.current) xtermRef.current.clear();
    },
  );
  useEffect(() => {
    if (xtermRef.current) xtermRef.current.setOption("cursorBlink", alive);
  }, [alive]);
  useEffect(() => {
    const xterm = new XTerm({
      cursorBlink: true,
    });
    xtermRef.current = xterm;
    xterm.open(containerRef.current);
    xterm.on("data", input => webSocket({ input }));
    xterm.on("resize", size => webSocket({ size }));
    return () => {
      xterm.destroy();
      xtermRef.current = null;
    };
  }, []);
  useEffect(() => {
    if (xtermRef.current) xtermRef.current.fit();
  }, [terminalSize.width, terminalSize.height]);

  return (
    <div
      style={{ height: "100%", position: "relative" }}
      ref={terminalSize.ref}
    >
      <div style={{ height: "100%" }} ref={containerRef}></div>
      {alive && (
        <Fab
          size="small"
          style={{
            position: "absolute",
            zIndex: 1000,
            top: 10,
            right: 10,
          }}
          color="secondary"
          onClick={() => webSocket({ kill: "yes" })}
          title="kill"
        >
          <Stop />
        </Fab>
      )}
    </div>
  );
}
