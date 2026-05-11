const http = require("http");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = __dirname;
const statePath = path.join(root, "server-state.json");
const port = Number(process.env.PORT || 8080);
const allowedStages = new Set(["hidden", "interview", "done"]);
const detailFields = [
  "address",
  "representative",
  "homepage",
  "contact",
  "sizeAndEtc",
  "hiringCount",
  "employmentType",
  "duties",
  "workStartDate",
  "dailyWorkHours",
  "wage",
  "overtimePay",
  "workPlace",
  "workDays",
  "holidays",
  "annualLeave",
  "fourInsurances",
  "maternityLeave",
  "menstrualLeave",
  "parentalLeave",
  "bonus",
  "mealSupport",
  "otherBenefits",
  "career",
  "certifications",
  "otherRequirements",
  "preferences",
  "documents",
  "process",
  "resumeItems",
  "coverLetterItems",
  "applicationDeadline",
  "notifyMethod",
  "applicationMethod",
  "manager",
  "description",
  "externalUrl"
];

function readBasePostings() {
  const code = fs.readFileSync(path.join(root, "data.js"), "utf8");
  return vm.runInNewContext(`${code}\nPOSTINGS;`);
}

function readState() {
  if (!fs.existsSync(statePath)) {
    return { customPostings: [], stageOverrides: {}, postingOverrides: {}, deletedIds: [] };
  }

  try {
    const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
    return {
      customPostings: state.customPostings || [],
      stageOverrides: state.stageOverrides || {},
      postingOverrides: state.postingOverrides || {},
      deletedIds: state.deletedIds || []
    };
  } catch {
    return { customPostings: [], stageOverrides: {}, postingOverrides: {}, deletedIds: [] };
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
  const deletedIds = new Set(state.deletedIds.map((id) => String(id)));
  const postings = [...readBasePostings(), ...state.customPostings]
    .filter((posting) => !deletedIds.has(String(posting.id)))
    .map((posting) => {
    const id = String(posting.id);
    const postingOverride = state.postingOverrides[id] || {};
    const override = state.stageOverrides[id];
    const merged = { ...posting, ...postingOverride };
    return {
      ...merged,
      stage: normalizeStage(override?.stage || merged.stage),
      stageCheckedAt: override?.stageCheckedAt || merged.stageCheckedAt || ""
    };
  });

  return postings;
}

function sanitizePosting(input, id) {
  const posting = {
    id,
    source: input.source === "jobcenter" ? "jobcenter" : "seoulbar",
    firm: String(input.firm || "").trim(),
    title: String(input.title || "").trim(),
    postedAt: String(input.postedAt || ""),
    deadline: String(input.deadline || ""),
    stage: normalizeStage(input.stage),
    stageCheckedAt: String(input.stageCheckedAt || "")
  };

  detailFields.forEach((field) => {
    posting[field] = String(input[field] || "").trim();
  });

  return posting;
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
      const posting = sanitizePosting(body, nextId);

      state.customPostings.push(posting);
      writeState(state);
      sendJson(res, 201, { postings: mergedPostings() });
      return;
    }

    const postingMatch = url.pathname.match(/^\/api\/postings\/(\d+)$/);
    if (postingMatch && req.method === "PUT") {
      const id = Number(postingMatch[1]);
      const body = await readBody(req);
      const state = readState();
      const posting = sanitizePosting(body, id);
      const customIndex = state.customPostings.findIndex((item) => Number(item.id) === id);

      if (customIndex >= 0) {
        state.customPostings[customIndex] = posting;
      } else {
        state.postingOverrides[String(id)] = posting;
      }

      state.stageOverrides[String(id)] = {
        stage: posting.stage,
        stageCheckedAt: posting.stageCheckedAt
      };
      state.deletedIds = state.deletedIds.filter((deletedId) => Number(deletedId) !== id);
      writeState(state);
      sendJson(res, 200, { postings: mergedPostings() });
      return;
    }

    if (postingMatch && req.method === "DELETE") {
      const id = Number(postingMatch[1]);
      const state = readState();
      state.customPostings = state.customPostings.filter((item) => Number(item.id) !== id);
      delete state.postingOverrides[String(id)];
      delete state.stageOverrides[String(id)];

      if (!state.deletedIds.some((deletedId) => Number(deletedId) === id)) {
        state.deletedIds.push(id);
      }

      writeState(state);
      sendJson(res, 200, { postings: mergedPostings() });
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
