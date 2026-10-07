import {
  getJSON,
  sendJSON,
  showError,
  renderRegistrations,
} from "/js/common.js";
const $ = (s) => document.querySelector(s),
  form = $("#event-editor");
const params = new URLSearchParams(location.search);
let id = params.get("id"),
  dirty = false,
  saving = false;
function options(select, rows) {
  select.replaceChildren();
  for (const row of rows) {
    const option = document.createElement("option");
    option.value = row.id;
    option.textContent = row.name;
    select.append(option);
  }
}
async function loadEvent() {
  const { data } = await getJSON(`/api/admin/events/${id}`);
  for (const field of form.elements) {
    if (!field.name) continue;
    field.value = data[field.name] ?? "";
    if (field.type === "datetime-local")
      field.value = (data[field.name] || "").replace(" ", "T");
  }
  $("#editor-title").textContent = "Edit an event.";
  document.title = `${data.name} | Good Together staff`;
  $("#preview-event").href = `/event.html?id=${id}`;
  $("#preview-event").hidden = data.publication_status === "suspended";
  $("#staff-registrations").hidden = false;
  renderRegistrations(data.registrations, $("#staff-registration-table"), true);
  $("#staff-registrations-empty").hidden = data.registrations.length > 0;
  $("#staff-registration-count").textContent =
    `${data.registration_count} registrations · ${data.tickets_reserved} tickets reserved`;
}
async function init() {
  try {
    if (
      id !== null &&
      (params.getAll("id").length !== 1 || !/^[1-9]\d{0,9}$/.test(id))
    )
      throw new Error("Choose a valid event from the events desk.");
    const [categories, organisations] = await Promise.all([
      getJSON("/api/admin/categories"),
      getJSON("/api/admin/organisations"),
    ]);
    options($("#category_id"), categories.data);
    options($("#organisation_id"), organisations.data);
    options($("#publication_status"), [
      { id: "active", name: "Active · public" },
      { id: "suspended", name: "Suspended · hidden" },
    ]);
    options(
      $("#image_path"),
      ["coast", "run", "table", "garden", "concert", "auction", "gala"].map(
        (name) => ({
          id: `/assets/${name}.jpg`,
          name: name[0].toUpperCase() + name.slice(1),
        }),
      ),
    );
    if (id) {
      await loadEvent();
      document
        .querySelector("nav a[aria-current]")
        ?.removeAttribute("aria-current");
      document
        .querySelector('nav a[href="/admin/"]')
        .setAttribute("aria-current", "page");
    }
    $("#editor-section").hidden = false;
  } catch (e) {
    showError($("#admin-error"), e.message);
  } finally {
    $("#editor-loading").hidden = true;
  }
}
form.addEventListener("input", (e) => {
  dirty = true;
  e.target.setCustomValidity?.("");
});
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  showError($("#admin-error"), "");
  showError($("#admin-notice"), "");
  for (const field of form.elements)
    if (field.required && typeof field.value === "string")
      field.setCustomValidity(
        field.value.trim() ? "" : "Please complete this field.",
      );
  const end = $("#ends_at");
  end.setCustomValidity(
    end.value && end.value <= $("#starts_at").value
      ? "End time must be after start time."
      : "",
  );
  const lat = $("#latitude"),
    lon = $("#longitude");
  lon.setCustomValidity(
    Boolean(lat.value) !== Boolean(lon.value)
      ? "Enter both coordinates or leave both empty."
      : "",
  );
  if (!form.reportValidity()) {
    showError(
      $("#admin-error"),
      "Please check the highlighted field before saving.",
    );
    return;
  }
  const input = Object.fromEntries(new FormData(form));
  input.category_id = Number(input.category_id);
  input.organisation_id = Number(input.organisation_id);
  saving = true;
  $("#save-event").disabled = true;
  $("#save-event").textContent = "Saving…";
  try {
    const created = !id,
      { data } = await sendJSON(
        id ? `/api/admin/events/${id}` : "/api/admin/events",
        id ? "PUT" : "POST",
        input,
      );
    id = String(data.id);
    history.replaceState(null, "", `/admin/event.html?id=${id}`);
    dirty = false;
    showError(
      $("#admin-notice"),
      created
        ? "Event created. You can now view it in the events desk."
        : "Your event changes have been saved.",
    );
    await loadEvent();
    $("#admin-notice").scrollIntoView({ block: "center" });
  } catch (e) {
    showError($("#admin-error"), e.message);
    $("#admin-error").scrollIntoView({ block: "center" });
  } finally {
    saving = false;
    $("#save-event").disabled = false;
    $("#save-event").textContent = "Save event ↗";
  }
});
window.addEventListener("beforeunload", (e) => {
  if (dirty && !saving) {
    e.preventDefault();
    e.returnValue = "";
  }
});
init();
