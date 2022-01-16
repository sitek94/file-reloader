const fs = require("fs");
const path = require("path");
const http = require("http");
const { WebSocketServer } = require("ws");

const appDir = path.join(__dirname, "../app");

// Create HTTP server, it's a simple server with the only difference that
// it's going to inject WebSocket script to index.html
const server = http.createServer((req, res) => {
  // Send index.html with appended WebSocketScript
  const filePath = path.join(appDir, req.url);

  switch (req.url) {
    case "/":
      const indexHtml = fs.readFileSync(filePath + "index.html", "utf8");
      const indexWithClientWebSocket = injectClientWebSocketScript(indexHtml);

      return res.end(indexWithClientWebSocket);

    default:
      if (fs.existsSync(filePath)) {
        return res.end(fs.readFileSync(filePath));
      } else {
        res.statusCode = 404;
        return res.end("Not found");
      }
  }
});

const port = 3000;
const host = "localhost";

server.listen(port, host, () => {
  const url = `http://${host}:${port}`;
  console.log(`Server is running on ${url}`);

  // If MacOS, open browser
  // If you're using different operating system, and want to open browser automatically,
  // you can use for example "open" package.
  if (process.platform === "darwin") {
    require("child_process").exec(`open ${url}`);
  }
});

// Start WebSocket server
const wsServer = new WebSocketServer({ port: 8080 });

wsServer.on("connection", (ws) => {
  // Start watching for file changes in app directory, whenever a file changes,
  // send a message to the client.
  fs.watch(appDir, (eventType, filename) => {
    if (eventType === "change") {
      console.log(`${filename} changed`);

      ws.send("refresh");
    }
  });
});

// When client receives a message from the server via WebSocket it's
// going to trigger reload of the page.
const clientWebSocketScript = `
  <script>
    const ws = new WebSocket('ws://localhost:8080');
    ws.onmessage = (event) => {
      if (event.data === 'refresh') {
        window.location.reload();
      }
      
    };
  </script>
`;

// Inject WebSocket script at the end of the head. Why not to add directly
// in index.html?
// Because we want to inject it only during development, we don't need this
// script in production.
function injectClientWebSocketScript(html) {
  return html.replace("</head>", clientWebSocketScript + "</head>");
}
