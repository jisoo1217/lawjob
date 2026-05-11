const {
  deletePosting,
  updatePosting
} = require("../../lib/postings-store");

function send(res, status, body) {
  res.status(status).json(body);
}

module.exports = async function handler(req, res) {
  const id = Number(req.query.id);

  try {
    if (!id) {
      send(res, 400, { error: "Invalid posting id" });
      return;
    }

    if (req.method === "PUT") {
      send(res, 200, { postings: await updatePosting(id, req.body || {}) });
      return;
    }

    if (req.method === "DELETE") {
      send(res, 200, { postings: await deletePosting(id) });
      return;
    }

    send(res, 405, { error: "Method not allowed" });
  } catch (error) {
    send(res, error.status || 500, { error: error.message });
  }
};
