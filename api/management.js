const { positiveId } = require("./validation");
const {
  registrationBody,
  eventBody,
  categoryBody,
} = require("./write-validation");
const { createWeatherService } = require("./weather");

function failure(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}
async function transaction(db, action) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const result = await action(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
async function registrations(db, id, staff = false) {
  const columns = staff
    ? "id,full_name,email,phone,ticket_quantity,unit_price,registered_at"
    : "id,full_name,ticket_quantity,registered_at";
  const [rows] = await db.execute(
    `SELECT ${columns} FROM registrations WHERE event_id=? ORDER BY registered_at DESC,id DESC`,
    [id],
  );
  return rows;
}
function installManagement(app, db, selectEvent, now, options = {}) {
  const weather = options.weather || createWeatherService();
  app.post("/api/events/:id/registrations", async (req, res) => {
    const id = positiveId(req.params.id),
      input = registrationBody(req.body);
    const result = await transaction(db, async (connection) => {
      // The event lock serialises registration with deletion, suspension and price changes.
      const [[event]] = await connection.execute(
        `SELECT id,ticket_price,publication_status,ends_at > ${now} AS registration_open FROM events WHERE id=? FOR UPDATE`,
        [id],
      );
      if (!event || event.publication_status !== "active")
        throw failure(404, "This event is not available.");
      if (!event.registration_open)
        throw failure(409, "This event has ended and registration is closed.");
      const [result] = await connection.execute(
        `INSERT INTO registrations (event_id,full_name,email,phone,ticket_quantity,unit_price,registered_at) VALUES (?,?,?,?,?,?,${now})`,
        [
          id,
          input.full_name,
          input.email,
          input.phone,
          input.ticket_quantity,
          event.ticket_price,
        ],
      );
      const [[record]] = await connection.execute(
        "SELECT id,event_id,full_name,ticket_quantity,unit_price,registered_at FROM registrations WHERE id=?",
        [result.insertId],
      );
      return {
        ...record,
        total: Number(
          (Number(record.unit_price) * record.ticket_quantity).toFixed(2),
        ),
      };
    });
    res.status(201).json({
      data: result,
      message:
        "Your registration is confirmed. No online payment has been taken.",
    });
  });
  app.get("/api/events/:id/weather", async (req, res) => {
    const id = positiveId(req.params.id);
    const [[event]] = await db.execute(
      "SELECT starts_at,latitude,longitude FROM events WHERE id=? AND publication_status='active'",
      [id],
    );
    if (!event) throw failure(404, "This event is not available.");
    res.json({ data: await weather(event) });
  });
  app.get("/api/admin/organisations", async (req, res) => {
    const [rows] = await db.execute(
      "SELECT id,name FROM organisations ORDER BY name",
    );
    res.json({ data: rows });
  });
  app.get("/api/admin/events", async (req, res) => {
    const [rows] = await db.execute(
      `${selectEvent} ORDER BY e.starts_at DESC,e.id DESC`,
    );
    res.json({
      data: rows,
      meta: { count: rows.length, timeZone: "Australia/Brisbane" },
    });
  });
  app.get("/api/admin/events/:id", async (req, res) => {
    const id = positiveId(req.params.id);
    const [[row]] = await db.execute(`${selectEvent} WHERE e.id=?`, [id]);
    if (!row) throw failure(404, "Event not found.");
    row.registrations = await registrations(db, id, true);
    res.json({ data: row, meta: { timeZone: "Australia/Brisbane" } });
  });
  app.post("/api/admin/events", async (req, res) => {
    const input = eventBody(req.body),
      keys = Object.keys(input);
    const [result] = await db.execute(
      `INSERT INTO events (${keys.join(",")}) VALUES (${keys.map(() => "?").join(",")})`,
      Object.values(input),
    );
    const [[row]] = await db.execute(`${selectEvent} WHERE e.id=?`, [
      result.insertId,
    ]);
    res
      .location(`/api/admin/events/${result.insertId}`)
      .status(201)
      .json({ data: row });
  });
  app.put("/api/admin/events/:id", async (req, res) => {
    const id = positiveId(req.params.id),
      input = eventBody(req.body);
    const row = await transaction(db, async (connection) => {
      const [[existing]] = await connection.execute(
        "SELECT id FROM events WHERE id=? FOR UPDATE",
        [id],
      );
      if (!existing) throw failure(404, "Event not found.");
      await connection.execute(
        `UPDATE events SET ${Object.keys(input)
          .map((key) => `${key}=?`)
          .join(",")} WHERE id=?`,
        [...Object.values(input), id],
      );
      const [[event]] = await connection.execute(
        `${selectEvent} WHERE e.id=?`,
        [id],
      );
      return event;
    });
    res.json({ data: row });
  });
  app.delete("/api/admin/events/:id", async (req, res) => {
    const id = positiveId(req.params.id);
    await transaction(db, async (connection) => {
      const [[event]] = await connection.execute(
        "SELECT id FROM events WHERE id=? FOR UPDATE",
        [id],
      );
      if (!event) throw failure(404, "Event not found.");
      const [[record]] = await connection.execute(
        "SELECT id FROM registrations WHERE event_id=? LIMIT 1",
        [id],
      );
      if (record)
        throw failure(
          409,
          "This event has registrations and cannot be deleted. You can suspend it instead.",
        );
      await connection.execute("DELETE FROM events WHERE id=?", [id]);
    });
    res.status(204).end();
  });
  app.get("/api/admin/categories", async (req, res) => {
    const [rows] = await db.execute(
      "SELECT c.id,c.name,c.description,COUNT(e.id) AS event_count FROM categories c LEFT JOIN events e ON e.category_id=c.id GROUP BY c.id,c.name,c.description ORDER BY c.name",
    );
    res.json({ data: rows });
  });
  app.post("/api/admin/categories", async (req, res) => {
    const input = categoryBody(req.body);
    const [result] = await db.execute(
      "INSERT INTO categories (name,description) VALUES (?,?)",
      [input.name, input.description],
    );
    res
      .location(`/api/admin/categories/${result.insertId}`)
      .status(201)
      .json({ data: { id: result.insertId, ...input } });
  });
  app.put("/api/admin/categories/:id", async (req, res) => {
    const id = positiveId(req.params.id, "Category ID"),
      input = categoryBody(req.body);
    const [result] = await db.execute(
      "UPDATE categories SET name=?,description=? WHERE id=?",
      [input.name, input.description, id],
    );
    if (!result.affectedRows) throw failure(404, "Category not found.");
    res.json({ data: { id, ...input } });
  });
  app.delete("/api/admin/categories/:id", async (req, res) => {
    const id = positiveId(req.params.id, "Category ID");
    const [result] = await db.execute("DELETE FROM categories WHERE id=?", [
      id,
    ]);
    if (!result.affectedRows) throw failure(404, "Category not found.");
    res.status(204).end();
  });
  for (const [route, methods] of [
    ["/api/events/:id/registrations", "POST"],
    ["/api/events/:id/weather", "GET, HEAD"],
    ["/api/admin/events", "GET, HEAD, POST"],
    ["/api/admin/events/:id", "GET, HEAD, PUT, DELETE"],
    ["/api/admin/categories", "GET, HEAD, POST"],
    ["/api/admin/categories/:id", "PUT, DELETE"],
    ["/api/admin/organisations", "GET, HEAD"],
  ])
    app.all(route, (req, res) =>
      res
        .set("Allow", methods)
        .status(405)
        .json({ error: "This method is not available for this resource." }),
    );
}
module.exports = { installManagement, registrations };
