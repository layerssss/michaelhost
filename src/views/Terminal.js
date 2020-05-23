import React, { useState, useRef } from "react";
import { Fab } from "@material-ui/core";
import { Stop } from "mdi-material-ui";

import XTerm from "../controls/XTerm";
import useWebSocket from "../hooks/useWebSocket";

export default React.memo(Terminal);
function Terminal({ terminalId }) {
  const [alive, aliveSet] = useState(false);
  const containerRef = useRef();
  const xtermRef = useRef();
  const webSocket = useWebSocket(
    `/api/terminals/${terminalId}`,
    (data) => {
      aliveSet(data.alive);
      if (data.output && xtermRef.current) xtermRef.current.write(data.output);
    },
    () => {
      if (xtermRef.current) xtermRef.current.clear();
    },
  );

  return (
    <div style={{ height: "100%", position: "relative" }}>
      <XTerm
        xtermRef={xtermRef}
        onData={(input) => webSocket({ input })}
        onResize={(size) => webSocket({ size })}
      />
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
