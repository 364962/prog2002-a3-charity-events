const express = require("express");
const path = require("node:path");
const pool = require("./event_db");
const { eventFilters, positiveId } = require("./validation");

const NOW = "(UTC_TIMESTAMP() + INTERVAL 10 HOUR)";
const SELECT_EVENT = `
  SELECT e.id, e.name, e.summary, e.purpose, e.description,
         e.starts_at, e.ends_at, e.venue, e.location, e.address,
         e.ticket_price, e.fundraising_goal, e.amount_raised,
         e.image_path, e.image_alt, e.accessibility,
         c.id AS category_id, c.name AS category,
         o.id AS organisation_id, o.name AS organisation,
         o.mission AS organisation_mission, o.email AS contact_email,
         o.phone AS contact_phone,
         CASE WHEN e.ends_at <= ${NOW} THEN 'past'
              WHEN e.starts_at <= ${NOW} THEN 'current'
              ELSE 'upcoming' END AS event_status
  FROM events e
  JOIN categories c ON c.id = e.category_id
  JOIN organisations o ON o.id = e.organisation_id`;

function createApp(db = pool) {
  const app = express();
  app.disable("x-powered-by");
  app.set("query parser", "simple");
  app.use((req, res, next) => {
    res.set({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Content-Security-Policy":
        "default-src 'self'; img-src 'self'; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    });
    next();
  });
  app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    if (!["GET", "HEAD"].includes(req.method)) {
      res.set("Allow", "GET, HEAD");
      return res
        .status(405)
        .json({ error: "Only read requests are available." });
    }
    next();
  });

  app.get("/api/health", async (req, res) => {
    await db.execute("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  });

  app.get("/api/categories", async (req, res) => {
    const [rows] = await db.execute(
      "SELECT id, name, description FROM categories ORDER BY name",
    );
    res.json({ data: rows });
  });

  app.get("/api/events", async (req, res) => {
    const filters = eventFilters(req.query);
    const conditions = [
      "e.publication_status = 'active'",
      `e.ends_at > ${NOW}`,
    ];
    const parameters = [];
    if (filters.date) {
      conditions.push(
        "e.starts_at >= ? AND e.starts_at < DATE_ADD(?, INTERVAL 1 DAY)",
      );
      parameters.push(filters.date, filters.date);
    }
    if (filters.location) {
      // Escape wildcard characters so the location is a literal substring.
      conditions.push("e.location LIKE ? ESCAPE '!'");
      parameters.push(`%${filters.location.replace(/[!%_]/g, "!$&")}%`);
    }
    if (filters.category) {
      conditions.push("e.category_id = ?");
      parameters.push(filters.category);
    }
    const [rows] = await db.execute(
      `${SELECT_EVENT} WHERE ${conditions.join(" AND ")} ORDER BY e.starts_at, e.id`,
      parameters,
    );
    res.json({
      data: rows,
      meta: { count: rows.length, timeZone: "Australia/Brisbane", filters },
    });
  });

  app.get("/api/events/:id", async (req, res) => {
    const id = positiveId(req.params.id);
    const [rows] = await db.execute(
      `${SELECT_EVENT} WHERE e.id = ? AND e.publication_status = 'active'`,
      [id],
    );
    if (!rows.length)
      return res.status(404).json({ error: "This event is not available." });
    // Past events remain readable from an existing link, but cannot be registered for.
    res.json({ data: rows[0], meta: { timeZone: "Australia/Brisbane" } });
  });

  app.use("/api", (req, res) =>
    res.status(404).json({ error: "API endpoint not found." }),
  );
  app.use(
    express.static(path.join(__dirname, "..", "clientside"), {
      dotfiles: "deny",
    }),
  );
  app.use((req, res) =>
    res
      .status(404)
      .sendFile(path.join(__dirname, "..", "clientside", "404.html")),
  );

  // Express 5 forwards rejected async handlers here; SQL details stay on the server.
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error.status === 400)
      return res.status(400).json({ error: error.message });
    console.error(
      "Request failed:",
      error.code || error.name || "Unknown error",
    );
    res
      .status(503)
      .json({
        error: "Events are temporarily unavailable. Please try again shortly.",
      });
  });
  return app;
}

module.exports = { createApp };
