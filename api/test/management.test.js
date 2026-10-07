const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { disposableDatabase } = require("./helpers/database");
const { createApp } = require("../app");
const { createWeatherService, weatherLabel } = require("../weather");
let fixture, db, server, base;
before(async () => {
  fixture = await disposableDatabase("management");
  db = fixture.db;
  server = createApp(db, {
    weather: async () => ({
      available: false,
      message: "Test forecast offline",
    }),
  }).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (fixture) await fixture.close();
});
async function request(url, method = "GET", body) {
  const response = await fetch(base + url, {
    method,
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return {
    status: response.status,
    body: response.status === 204 ? null : await response.json(),
    headers: response.headers,
  };
}
function attendee(email = "test.attendee@example.com") {
  return {
    full_name: "Test Attendee",
    email,
    phone: "0400000000",
    ticket_quantity: 3,
  };
}
async function eventInput() {
  const {
    body: { data },
  } = await request("/api/admin/events/1");
  const keys = [
    "name",
    "summary",
    "purpose",
    "description",
    "starts_at",
    "ends_at",
    "venue",
    "location",
    "address",
    "ticket_price",
    "fundraising_goal",
    "amount_raised",
    "image_path",
    "image_alt",
    "accessibility",
    "publication_status",
    "category_id",
    "organisation_id",
    "latitude",
    "longitude",
  ];
  return Object.fromEntries(keys.map((key) => [key, data[key]]));
}
test("staff sees every event, including past and suspended, while public queries remain filtered", async () => {
  const result = await request("/api/admin/events");
  assert.equal(result.status, 200);
  assert.equal(result.body.data.length, 12);
  assert.ok(result.body.data.some((e) => e.publication_status === "suspended"));
  assert.ok(result.body.data.some((e) => e.event_status === "past"));
  assert.equal((await request("/api/events/12")).status, 404);
  assert.equal(
    (await request("/api/admin/events/12")).body.data.registrations.length,
    1,
  );
});
test("public detail lists all registrations newest first without contact details", async () => {
  const {
    body: { data },
  } = await request("/api/events/1");
  assert.equal(data.registrations.length, 3);
  assert.deepEqual(
    data.registrations.map((r) => r.id),
    [3, 2, 1],
  );
  for (const row of data.registrations) {
    assert.equal(row.email, undefined);
    assert.equal(row.phone, undefined);
  }
  const staff = await request("/api/admin/events/1");
  assert.equal(staff.body.data.registrations[0].email, "sam.patel@example.com");
});
test("new registration persists quantity, server price and server timestamp", async () => {
  const response = await request(
    "/api/events/1/registrations",
    "POST",
    attendee(),
  );
  assert.equal(response.status, 201);
  assert.equal(response.body.data.total, 75);
  assert.equal(response.body.data.unit_price, 25);
  const [[row]] = await db.execute("SELECT * FROM registrations WHERE id=?", [
    response.body.data.id,
  ]);
  assert.equal(row.email, "test.attendee@example.com");
  assert.equal(row.ticket_quantity, 3);
  assert.equal(
    (await request("/api/events/1")).body.data.registrations[0].id,
    row.id,
  );
  await db.execute("DELETE FROM registrations WHERE id=?", [row.id]);
});
test("duplicate registration is rejected, including simultaneous requests", async () => {
  const email = "race@example.com";
  const responses = await Promise.all([
    request("/api/events/1/registrations", "POST", attendee(email)),
    request(
      "/api/events/1/registrations",
      "POST",
      attendee(email.toUpperCase()),
    ),
  ]);
  assert.deepEqual(responses.map((r) => r.status).sort(), [201, 409]);
  const [[row]] = await db.execute(
    "SELECT COUNT(*) AS count FROM registrations WHERE email=?",
    [email],
  );
  assert.equal(row.count, 1);
  await db.execute("DELETE FROM registrations WHERE email=?", [email]);
});
test("one attendee can book multiple events and a free event keeps a zero total", async () => {
  for (const id of [1, 2]) {
    const r = await request(
      `/api/events/${id}/registrations`,
      "POST",
      attendee("multi@example.com"),
    );
    assert.equal(r.status, 201);
    assert.equal(r.body.data.total, id === 2 ? 0 : 75);
  }
  await db.execute("DELETE FROM registrations WHERE email='multi@example.com'");
});
test("past, suspended and missing events cannot receive registrations", async () => {
  for (const [id, status] of [
    [11, 409],
    [12, 404],
    [99999, 404],
  ])
    assert.equal(
      (await request(`/api/events/${id}/registrations`, "POST", attendee()))
        .status,
      status,
    );
});
for (const [field, value] of [
  ["full_name", ""],
  ["email", "bad-email"],
  ["phone", "abc"],
  ["ticket_quantity", 0],
  ["ticket_quantity", 11],
  ["ticket_quantity", 1.5],
  ["ticket_quantity", "2"],
  ["unit_price", 0],
  ["registered_at", "2000-01-01"],
]) {
  test(`registration rejects invalid or client-controlled ${field}=${value}`, async () =>
    assert.equal(
      (
        await request("/api/events/1/registrations", "POST", {
          ...attendee(),
          [field]: value,
        })
      ).status,
      400,
    ));
}
test("mutation endpoints require valid, bounded JSON", async () => {
  const url = base + "/api/events/1/registrations";
  assert.equal(
    (await fetch(url, { method: "POST", body: "name=test" })).status,
    415,
  );
  assert.equal(
    (
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "x".repeat(40000) }),
      })
    ).status,
    413,
  );
});
test("event CRUD creates, updates, suspends and deletes an unregistered event", async () => {
  const input = { ...(await eventInput()), name: "A3 CRUD test" };
  const created = await request("/api/admin/events", "POST", input);
  assert.equal(created.status, 201);
  const id = created.body.data.id;
  const updated = await request(`/api/admin/events/${id}`, "PUT", {
    ...input,
    name: "Updated event",
    publication_status: "suspended",
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.name, "Updated event");
  assert.equal((await request(`/api/events/${id}`)).status, 404);
  assert.equal(
    (await request(`/api/admin/events/${id}`, "DELETE")).status,
    204,
  );
  assert.equal((await request(`/api/admin/events/${id}`)).status, 404);
});
test("deletion protection remains enforced when called directly through the API", async () => {
  const result = await request("/api/admin/events/1", "DELETE");
  assert.equal(result.status, 409);
  assert.match(result.body.error, /registrations/);
  assert.equal(
    (await request("/api/events/1")).body.data.registrations.length,
    3,
  );
});
test("concurrent registration and deletion cannot create an orphan", async () => {
  const created = await request("/api/admin/events", "POST", {
    ...(await eventInput()),
    name: "Race-safe event",
  });
  const id = created.body.data.id;
  const [booking, deletion] = await Promise.all([
    request(
      `/api/events/${id}/registrations`,
      "POST",
      attendee("delete-race@example.com"),
    ),
    request(`/api/admin/events/${id}`, "DELETE"),
  ]);
  assert.ok(
    (booking.status === 201 && deletion.status === 409) ||
      (booking.status === 404 && deletion.status === 204),
    JSON.stringify([booking, deletion]),
  );
  const [[row]] = await db.query(
    "SELECT COUNT(*) AS count FROM registrations r LEFT JOIN events e ON e.id=r.event_id WHERE e.id IS NULL",
  );
  assert.equal(row.count, 0);
  await db.execute("DELETE FROM registrations WHERE event_id=?", [id]);
  await db.execute("DELETE FROM events WHERE id=?", [id]);
});
for (const [field, value] of [
  ["name", ""],
  ["ticket_price", -1],
  ["ticket_price", 2.345],
  ["fundraising_goal", 0],
  ["category_id", 99999],
  ["starts_at", "2026-02-30T09:00"],
  ["ends_at", "2000-01-01T09:00"],
  ["publication_status", "past"],
  ["latitude", 91],
  ["image_path", "https://example.com/image.jpg"],
  ["image_path", "/assets/missing.jpg"],
]) {
  test(`event validation rejects ${field}=${value}`, async () =>
    assert.equal(
      (
        await request("/api/admin/events", "POST", {
          ...(await eventInput()),
          [field]: value,
        })
      ).status,
      400,
    ));
}
test("category CRUD and foreign-key deletion protection", async () => {
  const input = { name: "New category", description: "Category test" };
  const result = await request("/api/admin/categories", "POST", input);
  assert.equal(result.status, 201);
  const id = result.body.data.id;
  assert.equal(
    (await request("/api/admin/categories", "POST", input)).status,
    409,
  );
  assert.equal(
    (
      await request(`/api/admin/categories/${id}`, "PUT", {
        ...input,
        name: "Updated category",
      })
    ).status,
    200,
  );
  assert.equal(
    (await request(`/api/admin/categories/${id}`, "DELETE")).status,
    204,
  );
  assert.equal(
    (await request("/api/admin/categories/1", "DELETE")).status,
    409,
  );
  assert.equal(
    (await request("/api/admin/categories/99999", "DELETE")).status,
    404,
  );
});
test("weather service maps codes, caches results and does not invent distant forecasts", async () => {
  let calls = 0;
  const today = new Date(Date.now() + 10 * 3600000).toISOString().slice(0, 10);
  const service = createWeatherService(async () => {
    calls++;
    return {
      ok: true,
      json: async () => ({
        daily: {
          time: [today],
          weather_code: [3],
          temperature_2m_min: [17],
          temperature_2m_max: [25],
        },
      }),
    };
  });
  const event = {
    latitude: -28,
    longitude: 153,
    starts_at: today + " 09:00:00",
  };
  assert.equal((await service(event)).description, "Overcast");
  await service(event);
  assert.equal(calls, 1);
  assert.equal(
    (await service({ ...event, starts_at: "2099-01-01 09:00:00" })).available,
    false,
  );
  assert.equal(calls, 1);
  assert.equal((await service({ ...event, latitude: null })).available, false);
  assert.equal(weatherLabel(95), "Thunderstorm");
});
test("weather failure is non-blocking and suspended events do not expose weather", async () => {
  const today = new Date(Date.now() + 10 * 3600000).toISOString().slice(0, 10);
  const service = createWeatherService(async () => {
    throw new Error("offline");
  });
  assert.equal(
    (await service({ latitude: -28, longitude: 153, starts_at: today }))
      .available,
    false,
  );
  assert.equal((await request("/api/events/1/weather")).status, 200);
  assert.equal((await request("/api/events/12/weather")).status, 404);
});
