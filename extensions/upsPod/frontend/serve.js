// serve.js — 零依赖静态服务（走查用，端口 3000）
const http = require("http"), fs = require("fs"), path = require("path");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json" };
http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split("?")[0]);
  if (u === "/") u = "/index.html";
  const p = path.join(__dirname, u);
  fs.readFile(p, (e, d) => {
    if (e) { res.writeHead(404); res.end("404 " + u); return; }
    res.writeHead(200, { "Content-Type": MIME[path.extname(p)] || "application/octet-stream" });
    res.end(d);
  });
}).listen(3000, () => console.log("serving on http://localhost:3000"));
