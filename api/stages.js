const { updateStage } = require("../lib/postings-store");

function send(res, status, body) {
  res.status(status).json(body);
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      send(res, 405, { error: "Method not allowed" });
      return;
    }

    send(res, 200, {
      postings: await updateStage(req.body?.id, req.body?.stage, req.body?.stageCheckedAt)
    });
  } catch (error) {
    send(res, error.status || 500, { error: error.message });
  }
};
