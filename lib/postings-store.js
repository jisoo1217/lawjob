const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const statePath = path.join(root, "server-state.json");
const allowedStages = new Set(["hidden", "interview", "done"]);
const tableName = process.env.SUPABASE_POSTINGS_TABLE || "lawjob_postings";

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

function hasSupabase() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function normalizeStage(stage) {
  if (stage === "hidden") return "hidden";
  return stage === "done" ? "done" : "interview";
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

function mergedLocalPostings() {
  const state = readState();
  const deletedIds = new Set(state.deletedIds.map((id) => String(id)));
  return [...readBasePostings(), ...state.customPostings]
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
}

async function supabaseRequest(pathname, options = {}) {
  const baseUrl = process.env.SUPABASE_URL.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const response = await fetch(`${baseUrl}/rest/v1/${pathname}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(body?.message || body?.error || "Supabase request failed");
  }
  return body;
}

async function listDbPostings() {
  let rows = await supabaseRequest(`${tableName}?select=id,data,deleted&deleted=eq.false&order=id.asc`);
  if (!rows.length) {
    const existingRows = await supabaseRequest(`${tableName}?select=id&limit=1`);
    if (existingRows.length) return [];

    const seedRows = readBasePostings().map((posting) => ({
      id: Number(posting.id),
      data: posting,
      deleted: false,
      updated_at: new Date().toISOString()
    }));
    await supabaseRequest(tableName, {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(seedRows)
    });
    rows = await supabaseRequest(`${tableName}?select=id,data,deleted&deleted=eq.false&order=id.asc`);
  }
  return rows.map((row) => ({ ...row.data, id: Number(row.id) }));
}

async function upsertDbPosting(posting) {
  await supabaseRequest(tableName, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({
      id: Number(posting.id),
      data: posting,
      deleted: false,
      updated_at: new Date().toISOString()
    })
  });
}

async function nextDbId() {
  const rows = await supabaseRequest(`${tableName}?select=id&order=id.desc&limit=1`);
  return Math.max(0, Number(rows[0]?.id || 0)) + 1;
}

async function listPostings() {
  if (hasSupabase()) return listDbPostings();
  return mergedLocalPostings();
}

async function createPosting(input) {
  if (hasSupabase()) {
    const posting = sanitizePosting(input, await nextDbId());
    await upsertDbPosting(posting);
    return listDbPostings();
  }

  const state = readState();
  const existingIds = [...readBasePostings(), ...state.customPostings].map((posting) => Number(posting.id));
  const posting = sanitizePosting(input, Math.max(0, ...existingIds) + 1);
  state.customPostings.push(posting);
  writeState(state);
  return mergedLocalPostings();
}

async function updatePosting(id, input) {
  const posting = sanitizePosting(input, Number(id));

  if (hasSupabase()) {
    await upsertDbPosting(posting);
    return listDbPostings();
  }

  const state = readState();
  const customIndex = state.customPostings.findIndex((item) => Number(item.id) === Number(id));
  if (customIndex >= 0) {
    state.customPostings[customIndex] = posting;
  } else {
    state.postingOverrides[String(id)] = posting;
  }
  state.stageOverrides[String(id)] = {
    stage: posting.stage,
    stageCheckedAt: posting.stageCheckedAt
  };
  state.deletedIds = state.deletedIds.filter((deletedId) => Number(deletedId) !== Number(id));
  writeState(state);
  return mergedLocalPostings();
}

async function deletePosting(id) {
  if (hasSupabase()) {
    await supabaseRequest(`${tableName}?id=eq.${Number(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ deleted: true, updated_at: new Date().toISOString() })
    });
    return listDbPostings();
  }

  const state = readState();
  state.customPostings = state.customPostings.filter((item) => Number(item.id) !== Number(id));
  delete state.postingOverrides[String(id)];
  delete state.stageOverrides[String(id)];
  if (!state.deletedIds.some((deletedId) => Number(deletedId) === Number(id))) {
    state.deletedIds.push(Number(id));
  }
  writeState(state);
  return mergedLocalPostings();
}

async function updateStage(id, stage, stageCheckedAt) {
  const normalizedStage = normalizeStage(stage);
  if (!Number(id) || !allowedStages.has(normalizedStage)) {
    const error = new Error("Invalid stage update");
    error.status = 400;
    throw error;
  }

  const posting = (await listPostings()).find((item) => Number(item.id) === Number(id));
  if (!posting) {
    const error = new Error("Posting not found");
    error.status = 404;
    throw error;
  }

  return updatePosting(Number(id), {
    ...posting,
    stage: normalizedStage,
    stageCheckedAt: String(stageCheckedAt || "")
  });
}

module.exports = {
  allowedStages,
  createPosting,
  deletePosting,
  listPostings,
  normalizeStage,
  sanitizePosting,
  updatePosting,
  updateStage
};
