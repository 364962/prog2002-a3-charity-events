const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const mysql = require("mysql2/promise");
require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
  quiet: true,
});

let admin, db, server, base, createApp;
const testName = `charityevents_test_${process.pid}_${Date.now()}`;
const connection = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  multipleStatements: true,
};
async function get(url) {
  const response = await fetch(base + url);
  return { status: response.status, body: await response.json() };
}

before(async () => {
  // A separate disposable database keeps all constraint tests away from demo data.
  admin = await mysql.createConnection(connection);
  const sql = fs
    .readFileSync(
      path.join(__dirname, "../database/charityevents_db.sql"),
      "utf8",
    )
    .replaceAll("charityevents_db", testName)
    .replace(/^DELIMITER.*$/gm, "")
    .replaceAll("END$$", "END;");
  await admin.query(sql);
  process.env.DB_NAME = testName;
  db = require("../event_db");
  ({ createApp } = require("../app"));
  server = createApp().listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (db) await db.end();
  if (admin) {
    await admin.query(`DROP DATABASE IF EXISTS \`${testName}\``);
    await admin.end();
  }
});

test("SQL creates the required sample records and relational keys", async () => {
  const [[counts]] = await db.query("SELECT COUNT(*) AS count FROM events");
  assert.equal(counts.count, 12);
  const result = await get("/api/categories");
  assert.equal(result.status, 200);
  assert.equal(result.body.data.length, 6);
  assert.equal(new Set(result.body.data.map((c) => c.name)).size, 6);
});
test("home lists all ten active current/upcoming events in date order", async () => {
  const { status, body } = await get("/api/events");
  assert.equal(status, 200);
  assert.equal(body.meta.count, 10);
  assert.deepEqual(
    new Set(body.data.map((e) => e.id)),
    new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
  );
  assert.equal(body.data.find((e) => e.id === 2).event_status, "current");
  assert.ok(body.data.every((e) => e.category && e.organisation));
  const dates = body.data.map((e) => e.starts_at);
  assert.deepEqual(dates, [...dates].sort());
});
test("one filter and three combined filters return only matching events", async () => {
  const {
    body: { data: event },
  } = await get("/api/events/1");
  const date = event.starts_at.slice(0, 10);
  for (const query of [
    `category=1`,
    `date=${date}`,
    "location=southPORT",
    `date=${date}&location=Southport&category=1`,
  ]) {
    const { status, body } = await get(`/api/events?${query}`);
    assert.equal(status, 200);
    assert.ok(body.data.some((e) => e.id === 1));
    assert.ok(
      body.data.every(
        (e) =>
          (!query.includes("date=") || e.starts_at.startsWith(date)) &&
          (!query.includes("category=") || e.category_id === 1) &&
          (!query.includes("location=") ||
            e.location.toLowerCase().includes("southport")),
      ),
    );
  }
});
test("no matches returns a successful empty collection", async () => {
  const { status, body } = await get("/api/events?location=NoSuchSuburb");
  assert.equal(status, 200);
  assert.deepEqual(body.data, []);
  assert.equal(body.meta.count, 0);
});
test("empty filters are optional and surrounding whitespace is trimmed", async () => {
  assert.equal(
    (await get("/api/events?date=&category=&location=")).body.data.length,
    10,
  );
  assert.ok(
    (await get("/api/events?location=%20Southport%20")).body.data.every(
      (e) => e.location === "Southport",
    ),
  );
});
for (const query of [
  "date=2026-02-30",
  "date=2025-02-29",
  "date=not-a-date",
  "date=0000-01-01",
  "date=2026-13-01",
  "date=2026-09-17&date=2026-09-18",
  "category=1.5",
  "category=0",
  "category=-1",
  "category=4294967296",
  "category=1&category=2",
  "location=" + "a".repeat(101),
  "location=%00",
  "unknown=1",
]) {
  test(`invalid filter rejected: ${query.slice(0, 65)}`, async () => {
    const result = await get(`/api/events?${query}`);
    assert.equal(result.status, 400);
    assert.equal(typeof result.body.error, "string");
  });
}
test("valid leap day and unknown category are valid empty searches", async () => {
  assert.equal((await get("/api/events?date=2028-02-29")).status, 200);
  assert.deepEqual((await get("/api/events?category=999")).body.data, []);
});
test("location SQL injection and LIKE wildcards are treated as literal text", async () => {
  for (const location of [
    "' OR 1=1 --",
    "%",
    "_",
    "!",
    "<script>alert(1)</script>",
  ]) {
    const result = await get(
      "/api/events?location=" + encodeURIComponent(location),
    );
    assert.equal(result.status, 200);
    assert.deepEqual(result.body.data, []);
  }
  assert.equal((await get("/api/events")).body.data.length, 10);
});
test("detail fields, prices and fundraising figures preserve their types", async () => {
  const {
    body: { data },
  } = await get("/api/events/1");
  assert.equal(data.id, 1);
  assert.equal(data.ticket_price, 25);
  assert.equal(data.amount_raised, 9750);
  for (const key of [
    "description",
    "purpose",
    "venue",
    "address",
    "accessibility",
    "contact_email",
    "starts_at",
    "ends_at",
  ])
    assert.ok(data[key]);
  assert.equal((await get("/api/events/2")).body.data.ticket_price, 0);
});
test("suspended and nonexistent details return 404; past details are marked past", async () => {
  assert.equal((await get("/api/events/12")).status, 404);
  assert.equal((await get("/api/events/999")).status, 404);
  assert.equal((await get("/api/events/11")).body.data.event_status, "past");
});
for (const id of ["0", "-1", "1.2", "abc", "4294967296"]) {
  test(`invalid event ID rejected: ${id}`, async () =>
    assert.equal((await get(`/api/events/${id}`)).status, 400));
}
test("GET-only routes reject mutations and unknown endpoints return JSON", async () => {
  for (const method of ["POST", "PUT", "DELETE"]) {
    const response = await fetch(base + "/api/events", { method });
    assert.equal(response.status, 405);
    assert.equal(response.headers.get("allow"), "GET, HEAD");
  }
  assert.equal((await get("/api/missing")).status, 404);
});
test("database foreign keys and both validation triggers reject invalid writes", async () => {
  for (const clause of [
    "ends_at = starts_at",
    "ticket_price = -1",
    "fundraising_goal = 0",
    "amount_raised = -1",
    "category_id = 999",
  ]) {
    await assert.rejects(db.query(`UPDATE events SET ${clause} WHERE id = 1`));
  }
  const [rows] = await db.query("SELECT * FROM events WHERE id = 1");
  const fixture = { ...rows[0], id: 90, ends_at: rows[0].starts_at };
  await assert.rejects(db.query("INSERT INTO events SET ?", fixture), {
    code: "ER_SIGNAL_EXCEPTION",
  });
  await assert.rejects(db.query("DELETE FROM categories WHERE id=1"), {
    code: "ER_ROW_IS_REFERENCED_2",
  });
});
test("date boundaries include current and exclude ended events", async () => {
  try {
    await db.execute(
      "UPDATE events SET starts_at=UTC_TIMESTAMP()+INTERVAL 10 HOUR-INTERVAL 1 HOUR, ends_at=UTC_TIMESTAMP()+INTERVAL 10 HOUR WHERE id=10",
    );
    assert.ok(!(await get("/api/events")).body.data.some((e) => e.id === 10));
    assert.equal((await get("/api/events/10")).body.data.event_status, "past");
    await db.execute(
      "UPDATE events SET ends_at=UTC_TIMESTAMP()+INTERVAL 10 HOUR+INTERVAL 1 HOUR WHERE id=10",
    );
    assert.equal(
      (await get("/api/events/10")).body.data.event_status,
      "current",
    );
  } finally {
    await db.execute(
      "UPDATE events SET starts_at=UTC_TIMESTAMP()+INTERVAL 61 DAY, ends_at=UTC_TIMESTAMP()+INTERVAL 62 DAY WHERE id=10",
    );
  }
});
test("database failure becomes a helpful 503 without SQL or credentials", async () => {
  const broken = createApp({
    execute: async () => {
      const e = new Error("SELECT password FROM secret");
      e.code = "TEST_UNAVAILABLE";
      throw e;
    },
  }).listen(0, "127.0.0.1");
  await new Promise((resolve) => broken.once("listening", resolve));
  try {
    const response = await fetch(
      `http://127.0.0.1:${broken.address().port}/api/events`,
    );
    assert.equal(response.status, 503);
    const text = await response.text();
    assert.match(text, /temporarily unavailable/);
    assert.doesNotMatch(text, /SELECT|secret|password/);
  } finally {
    await new Promise((resolve) => broken.close(resolve));
  }
});
