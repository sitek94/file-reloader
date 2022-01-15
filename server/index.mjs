import fs from "fs";
import { WebSocketServer } from "ws";

const __dirname = new URL(".", import.meta.url).pathname;

const server = new WebSocketServer({ port: 8080 });

server.on("connection", (ws) => {
  fs.watch(__dirname + "../app", (eventType, filename) => {
    if (eventType === "change") {
      console.log(`${filename} changed`);

      ws.send("refresh");
    }
  });
});
