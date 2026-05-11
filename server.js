const http = require("http");
const fs = require("fs");
const path = require("path");
const {
  createPosting,
  deletePosting,
  listPostings,
  updatePosting,
  updateStage
} = require("./lib/postings-store");

const root = __dirname;
const port = Number(process.env.PORT || 8080);

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload)
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("Request body too large"));
      }
    });
    req.on("end", () => resolve(body ? JSON.parse(body) : {}));
    req.on("error", reject);
  });
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".js") return "text/javascript; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".png") return "image/png";
  return "application/octet-stream";
}

function serveStatic(req, res) {
  const requested = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  const safePath = requested === "/" ? "/index.html" : requested;
  let filePath = path.normalize(path.join(root, safePath));

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const body = fs.readFileSync(filePath);
  res.writeHead(200, { "Content-Type": contentType(filePath) });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (req.method === "GET" && url.pathname === "/api/postings") {
      sendJson(res, 200, { postings: await listPostings() });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/stages") {
      const body = await readBody(req);
      const postings = await updateStage(Number(body.id), body.stage, body.stageCheckedAt);
      sendJson(res, 200, { postings });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/postings") {
      const body = await readBody(req);
      sendJson(res, 201, { postings: await createPosting(body) });
      return;
    }

    const postingMatch = url.pathname.match(/^\/api\/postings\/(\d+)$/);
    if (postingMatch && req.method === "PUT") {
      const id = Number(postingMatch[1]);
      const body = await readBody(req);
      sendJson(res, 200, { postings: await updatePosting(id, body) });
      return;
    }

    if (postingMatch && req.method === "DELETE") {
      const id = Number(postingMatch[1]);
      sendJson(res, 200, { postings: await deletePosting(id) });
      return;
    }

    if (req.method === "GET") {
      serveStatic(req, res);
      return;
    }

    sendJson(res, 405, { error: "Method not allowed" });
  } catch (error) {
    sendJson(res, error.status || 500, { error: error.message });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`lawjob preview server: http://127.0.0.1:${port}/index.html`);
});
