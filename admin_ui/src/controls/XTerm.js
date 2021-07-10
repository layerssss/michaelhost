import React, { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { useComponentSize } from "react-use-size";
import { FitAddon } from "xterm-addon-fit";
import { WebLinksAddon } from "xterm-addon-web-links";

export default React.memo(XTerm);
function XTerm({
  cursorBlink = false,
  onData = () => {},
  onResize = () => {},
  xtermRef = {},
}) {
  const terminalSize = useComponentSize();
  const containerRef = useRef();
  const xtermVariablesRef = useRef();

  useEffect(() => {
    if (xtermVariablesRef.current) {
      const { terminal } = xtermVariablesRef.current;
      terminal.setOption("cursorBlink", cursorBlink);
    }
  }, [cursorBlink]);

  useEffect(() => {
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    const terminal = new Terminal({
      cursorBlink,
    });

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);
    terminal.open(containerRef.current);
    terminal.onData(onData);
    terminal.onResize(onResize);

    xtermVariablesRef.current = {
      terminal,
      webLinksAddon,
      fitAddon,
    };
    xtermRef.current = terminal;
    return () => {
      terminal.dispose();
      xtermVariablesRef.current = null;
      xtermRef.current = null;
    };
  }, []);
  useEffect(() => {
    if (xtermVariablesRef.current) {
      const { fitAddon } = xtermVariablesRef.current;
      fitAddon.fit();
    }
  }, [terminalSize.width, terminalSize.height]);

  return (
    <div
      style={{ height: "100%", position: "relative" }}
      ref={terminalSize.ref}
    >
      <div style={{ height: "100%" }} ref={containerRef}></div>
    </div>
  );
}
