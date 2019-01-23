import {
  compose,
  lifecycle,
  withState,
  renderNothing,
  withProps,
  branch,
} from "recompose";

const withWebSocket = compose(
  withProps(({ webSocketPath }) => ({ key: webSocketPath })),
  withState("webSocket", "setWebsocket", null),
  lifecycle({
    componentDidMount() {
      const { webSocketPath, setWebsocket } = this.props;
      const initWebSocket = () => {
        const wsOrigin = window.location.origin.replace(/^http/, "ws");
        this.webSocket = new WebSocket(`${wsOrigin}${webSocketPath}`);
        this.webSocket.addEventListener("open", () =>
          setWebsocket(this.webSocket),
        );
        this.webSocket.addEventListener("close", () => {
          if (this.dismounting) return;
          setWebsocket(null);
          initWebSocket();
        });
      };
      initWebSocket();
    },
    componentWillUnmount() {
      this.dismounting = true;
      this.webSocket.close();
    },
  }),
  branch(({ webSocket }) => !webSocket, renderNothing),
);

export default withWebSocket;