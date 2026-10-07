import { getJSON, sendJSON, formatDate, showError } from "/js/common.js";
const $ = (s) => document.querySelector(s);
let events = [],
  pending,
  opener;
const status = (e) =>
  e.publication_status === "suspended"
    ? "suspended"
    : e.event_status === "past"
      ? "past"
      : "active";
const label = { active: "Active", past: "Past", suspended: "Suspended" };
function render() {
  const choice = $("#event-filter").value,
    rows = events.filter((e) => choice === "all" || status(e) === choice);
  $("#stat-total").textContent = events.length;
  for (const s of ["active", "past", "suspended"])
    $("#stat-" + s).textContent = events.filter((e) => status(e) === s).length;
  const body = $("#staff-events tbody");
  body.replaceChildren();
  $("#events-empty").hidden = rows.length > 0;
  for (const event of rows) {
    const row = document.createElement("tr");
    const name = document.createElement("td"),
      link = document.createElement("a"),
      location = document.createElement("small");
    link.href = `/admin/event.html?id=${event.id}`;
    link.textContent = event.name;
    link.className = "table-title";
    location.textContent = event.location;
    name.append(link, location);
    row.append(name);
    for (const text of [
      formatDate(event.starts_at, {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      label[status(event)],
      event.tickets_reserved,
    ]) {
      const cell = document.createElement("td");
      cell.textContent = text;
      row.append(cell);
    }
    const actions = document.createElement("td"),
      edit = document.createElement("a"),
      remove = document.createElement("button");
    actions.className = "table-actions";
    edit.className = "text-link";
    edit.href = link.href;
    edit.textContent = "Edit";
    edit.setAttribute("aria-label", `Edit ${event.name}`);
    remove.type = "button";
    remove.className = "text-button danger-text";
    remove.textContent = "Delete";
    remove.setAttribute("aria-label", `Delete ${event.name}`);
    remove.addEventListener("click", () => {
      pending = event;
      opener = remove;
      $("#delete-description").textContent = event.name;
      $("#delete-dialog").returnValue = "";
      $("#delete-dialog").showModal();
    });
    actions.append(edit, remove);
    row.append(actions);
    body.append(row);
  }
}
async function load() {
  showError($("#admin-error"), "");
  $("#events-loading").hidden = false;
  try {
    ({ data: events } = await getJSON("/api/admin/events"));
    render();
  } catch (e) {
    showError($("#admin-error"), e.message);
  } finally {
    $("#events-loading").hidden = true;
  }
}
$("#event-filter").addEventListener("change", render);
$("#refresh-events").addEventListener("click", load);
$("#delete-dialog").addEventListener("close", async () => {
  opener?.focus();
  if ($("#delete-dialog").returnValue !== "delete") return;
  try {
    await sendJSON(`/api/admin/events/${pending.id}`, "DELETE");
    showError($("#admin-notice"), `Deleted “${pending.name}”.`);
    await load();
  } catch (e) {
    showError($("#admin-error"), e.message);
    $("#admin-error").scrollIntoView({ block: "center" });
  }
});
load();
