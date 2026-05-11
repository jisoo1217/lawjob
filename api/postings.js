const {
  createPosting,
  listPostings
} = require("../lib/postings-store");

function send(res, status, body) {
  res.status(status).json(body);
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      send(res, 200, { postings: await listPostings() });
      return;
    }

    if (req.method === "POST") {
      send(res, 201, { postings: await createPosting(req.body || {}) });
      return;
    }

    send(res, 405, { error: "Method not allowed" });
  } catch (error) {
    send(res, error.status || 500, { error: error.message });
  }
};
