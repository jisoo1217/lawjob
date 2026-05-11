const http = require("http");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = __dirname;
const statePath = path.join(root, "server-state.json");
const port = Number(process.env.PORT || 8080);
const allowedStages = new Set(["hidden", "interview", "done"]);

function readBasePostings() {
  const code = fs.readFileSync(path.join(root, "data.js"), "utf8");
  return vm.runInNewContext(`${code}\nPOSTINGS;`);
}

function readState() {
  if (!fs.existsSync(statePath)) {
    return { customPostings: [], stageOverrides: {} };
  }

  try {
    return JSON.parse(fs.readFileSync(statePath, "utf8"));
  } catch {
    return { customPostings: [], stageOverrides: {} };
  }
}

function writeState(state) {
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), "utf8");
}

function normalizeStage(stage) {
  if (stage === "hidden") return "hidden";
  return stage === "done" ? "done" : "interview";
}

function mergedPostings() {
  const state = readState();
  const postings = [...readBasePostings(), ...state.customPostings].map((posting) => {
    const override = state.stageOverrides[String(posting.id)];
    return {
      ...posting,
      stage: normalizeStage(override?.stage || posting.stage),
      stageCheckedAt: override?.stageCheckedAt || posting.stageCheckedAt || ""
    };
  });

  return postings;
}

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
      sendJson(res, 200, { postings: mergedPostings() });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/stages") {
      const body = await readBody(req);
      const id = Number(body.id);
      const stage = normalizeStage(body.stage);
      const stageCheckedAt = String(body.stageCheckedAt || "");

      if (!id || !allowedStages.has(stage)) {
        sendJson(res, 400, { error: "Invalid stage update" });
        return;
      }

      const state = readState();
      state.stageOverrides[String(id)] = { stage, stageCheckedAt };
      writeState(state);
      sendJson(res, 200, { postings: mergedPostings() });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/postings") {
      const body = await readBody(req);
      const state = readState();
      const existingIds = [...readBasePostings(), ...state.customPostings].map((posting) => Number(posting.id));
      const nextId = Math.max(0, ...existingIds) + 1;
      const posting = {
        ...body,
        id: nextId,
        stage: normalizeStage(body.stage),
        stageCheckedAt: String(body.stageCheckedAt || "")
      };

      state.customPostings.push(posting);
      writeState(state);
      sendJson(res, 201, { postings: mergedPostings() });
      return;
    }

    if (req.method === "GET") {
      serveStatic(req, res);
      return;
    }

    sendJson(res, 405, { error: "Method not allowed" });
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`lawjob preview server: http://127.0.0.1:${port}/index.html`);
});
