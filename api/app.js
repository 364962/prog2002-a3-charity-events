const express = require("express");
const path = require("node:path");
const pool = require("./event_db");
const { eventFilters, positiveId } = require("./validation");
const { installManagement, registrations } = require("./management");

const NOW = "(UTC_TIMESTAMP() + INTERVAL 10 HOUR)";
const SELECT_EVENT = `
  SELECT e.id, e.name, e.summary, e.purpose, e.description,
         e.starts_at, e.ends_at, e.venue, e.location, e.address,
         e.ticket_price, e.fundraising_goal, e.amount_raised,
         e.image_path, e.image_alt, e.accessibility,
         e.publication_status, e.latitude, e.longitude,
         (SELECT COUNT(*) FROM registrations r WHERE r.event_id=e.id) AS registration_count,
         (SELECT COALESCE(SUM(r.ticket_quantity),0) FROM registrations r WHERE r.event_id=e.id) AS tickets_reserved,
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

function createApp(db = pool, options = {}) {
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
    if (
      !["GET", "HEAD"].includes(req.method) &&
      /^\/(events(\/[^/]+)?|categories|health)$/.test(req.path)
    )
      return res
        .set("Allow", "GET, HEAD")
        .status(405)
        .json({ error: "Only read requests are available for this resource." });
    next();
  });
  app.use(express.json({ limit: "32kb" }));
  app.use("/api", (req, res, next) => {
    if (["POST", "PUT"].includes(req.method) && !req.is("application/json"))
      return res
        .status(415)
        .json({ error: "Send the request as application/json." });
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
    rows[0].registrations = await registrations(db, id);
    // Past events remain readable from an existing link, but cannot be registered for.
    res.json({ data: rows[0], meta: { timeZone: "Australia/Brisbane" } });
  });

  installManagement(app, db, SELECT_EVENT, NOW, options);
  app.all(
    ["/api/events", "/api/events/:id", "/api/categories", "/api/health"],
    (req, res) =>
      res
        .set("Allow", "GET, HEAD")
        .status(405)
        .json({ error: "Only read requests are available for this resource." }),
  );

  app.use("/api", (req, res) =>
    res.status(404).json({ error: "API endpoint not found." }),
  );
  app.use(
    "/admin",
    express.static(path.join(__dirname, "..", "adminside"), {
      dotfiles: "deny",
    }),
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
    if ([400, 404, 409, 413, 415].includes(error.status))
      return res.status(error.status).json({
        error:
          error.type === "entity.parse.failed"
            ? "Send valid JSON."
            : error.status === 413
              ? "The request is too large."
              : error.message,
      });
    if (error.code === "ER_DUP_ENTRY")
      return res.status(409).json({
        error: req.path.includes("registrations")
          ? "This email is already registered for this event."
          : "A category with that name already exists.",
      });
    if (error.code === "ER_ROW_IS_REFERENCED_2")
      return res
        .status(409)
        .json({ error: "This record is in use and cannot be deleted." });
    if (error.code === "ER_NO_REFERENCED_ROW_2")
      return res
        .status(400)
        .json({ error: "Choose an existing category and organisation." });
    if (error.code === "ER_SIGNAL_EXCEPTION")
      return res
        .status(400)
        .json({ error: "Check the event dates, ticket quantity and amounts." });
    console.error(
      "Request failed:",
      error.code || error.name || "Unknown error",
    );
    res.status(503).json({
      error: "Events are temporarily unavailable. Please try again shortly.",
    });
  });
  return app;
}

module.exports = { createApp };
