import React, { useRef } from "react";
import { FileDocument } from "mdi-material-ui";

import XTerm from "../controls/XTerm";
import useWebSocket from "../hooks/useWebSocket";
import Widget from "../controls/Widget";

export default React.memo(LogsView);
function LogsView({ useTitle }) {
  const title = "logs";
  useTitle(title);
  const xtermRef = useRef();
  useWebSocket(
    `/api/log`,
    (data) => {
      if (data.output && xtermRef.current) xtermRef.current.write(data.output);
    },
    () => {
      if (xtermRef.current) xtermRef.current.clear();
    },
  );

  return (
    <>
      <Widget title={title} icon={<FileDocument />}>
        <div style={{ height: "calc(100vh - 150px)" }}>
          <XTerm xtermRef={xtermRef} />
        </div>
      </Widget>
    </>
  );
}
