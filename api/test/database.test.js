const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { disposableDatabase } = require("./helpers/database");
let fixture, db;
before(async () => { fixture = await disposableDatabase("schema"); db = fixture.db; });
after(async () => { if (fixture) await fixture.close(); });

test("A3 seed includes at least ten registrations connected to existing events", async () => {
  const [[row]] = await db.query("SELECT COUNT(*) AS count FROM registrations r JOIN events e ON e.id=r.event_id");
  assert.equal(row.count, 12);
});
test("duplicate email at one event is rejected after normalising case and whitespace", async () => {
  await assert.rejects(db.execute("INSERT INTO registrations (event_id,full_name,email,phone,ticket_quantity,unit_price,registered_at) VALUES (1,'Duplicate',' ALEX.MORGAN@EXAMPLE.COM ','0400000000',1,25,NOW())"), { code: "ER_DUP_ENTRY" });
});
test("the same attendee can have separate registrations at different events", async () => {
  const [rows] = await db.execute("SELECT event_id FROM registrations WHERE email=?", ["alex.morgan@example.com"]);
  assert.deepEqual(rows.map(r => r.event_id).sort(), [1, 2]);
});
test("event deletion is restricted when registrations reference it", async () => {
  await assert.rejects(db.execute("DELETE FROM events WHERE id=1"), { code: "ER_ROW_IS_REFERENCED_2" });
});
test("registrations cannot reference an event that does not exist", async () => {
  await assert.rejects(db.execute("INSERT INTO registrations (event_id,full_name,email,phone,ticket_quantity,unit_price,registered_at) VALUES (99999,'Test','test@example.com','0400000000',1,0,NOW())"), { code: "ER_NO_REFERENCED_ROW_2" });
});
test("registration constraints validate updates without damaging existing records", async () => {
  for (const clause of ["ticket_quantity=0", "ticket_quantity=11", "unit_price=-1", "email=''", "full_name=''", "phone=''"]) {
    await assert.rejects(db.query(`UPDATE registrations SET ${clause} WHERE id=1`));
  }
  const [[row]] = await db.query("SELECT ticket_quantity,unit_price FROM registrations WHERE id=1");
  assert.equal(row.ticket_quantity, 2); assert.equal(row.unit_price, 25);
});
