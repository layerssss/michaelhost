import { useRef, useEffect, useMemo } from "react";

export default function useWebSocket(webSocketPath, onMessage, onConnect) {
  const buffer = useMemo(() => [], []);
  const webSocketRef = useRef();
  const webSocketInit = () => {
    if (webSocketRef.current) return;
    const wsOrigin = window.location.origin.replace(/^http/, "ws");
    const webSocket = new WebSocket(`${wsOrigin}${webSocketPath}`);
    webSocketRef.current = webSocket;
    webSocket.addEventListener("close", (event) => {
      webSocketRef.current = null;
      if (!webSocket.__destroyed) webSocketInit();
    });
    webSocket.addEventListener("message", (event) =>
      onMessage(JSON.parse(event.data)),
    );
    webSocket.addEventListener("open", () => {
      if (onConnect) onConnect();
      let data;
      while ((data = buffer.shift())) webSocket.send(JSON.stringify(data));
    });
  };

  const webSocketDestroy = () => {
    if (!webSocketRef.current) return;
    webSocketRef.current.close();
    webSocketRef.current.__destroyed = true;
  };

  useEffect(() => {
    webSocketInit();

    return () => {
      if (webSocketRef.current) webSocketDestroy();
    };
  }, [webSocketPath]);

  return (data) => {
    if (webSocketRef.current?.readyState === WebSocket.OPEN)
      webSocketRef.current.send(JSON.stringify(data));
    else buffer.push(data);
  };
}
