const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const tableName = process.env.SUPABASE_POSTINGS_TABLE || "lawjob_postings";

async function supabaseRequest(pathname, options = {}) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  const baseUrl = process.env.SUPABASE_URL.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const response = await fetch(`${baseUrl}/rest/v1/${pathname}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
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

async function main() {
  const code = fs.readFileSync(path.join(root, "data.js"), "utf8");
  const postings = vm.runInNewContext(`${code}\nPOSTINGS;`);
  const rows = postings.map((posting) => ({
    id: Number(posting.id),
    data: posting,
    deleted: false,
    updated_at: new Date().toISOString()
  }));

  await supabaseRequest(tableName, {
    method: "POST",
    body: JSON.stringify(rows)
  });

  console.log(`Seeded ${rows.length} postings into ${tableName}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
