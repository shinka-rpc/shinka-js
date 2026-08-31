import type { TransportServer } from "@shinka-rpc/core";
import type { WebSocketServer, WebSocket } from "ws";

export const webSocketServer = (wss: WebSocketServer) =>
  ((shinkaOn, connect, eventListeners) => {
    const wsEventHandler = (ws: WebSocket) => {
      // const port = (connectEvent as any as MessageEvent)
      //   .source as any as MessagePort;
      const close = async () => ws.close();
      const send = ws.send.bind(ws);
      connect((thisArg, onRawData, onClosed, opts) => {
        if (opts.mode === "not-serialized") throw new Error("invalid mode");
        ws.on("message", onRawData);
        ws.on("close", onClosed);
        return { send, close, instruction: {}, context: ws };
      });
    };
    eventListeners.add("started", () => wss.on("connection", wsEventHandler));
    eventListeners.add("stopping", () => wss.off("connection", wsEventHandler));
  }) satisfies TransportServer<any, any, any, WebSocket>;
