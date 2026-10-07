import { getJSON, sendJSON, showError } from "/js/common.js";
const $ = (s) => document.querySelector(s);
let editing = null,
  pending = null,
  opener;
function reset() {
  editing = null;
  $("#category-form").reset();
  $("#category-form-title").textContent = "Add a category.";
}
async function load() {
  try {
    const { data } = await getJSON("/api/admin/categories");
    const body = $("#category-table tbody");
    body.replaceChildren();
    for (const category of data) {
      const row = document.createElement("tr"),
        name = document.createElement("td"),
        description = document.createElement("small"),
        title = document.createElement("strong"),
        count = document.createElement("td"),
        actions = document.createElement("td");
      title.textContent = category.name;
      description.textContent = category.description;
      name.append(title, description);
      count.textContent = category.event_count;
      actions.className = "table-actions";
      for (const action of ["Edit", "Delete"]) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "text-button";
        button.textContent = action;
        button.setAttribute("aria-label", `${action} ${category.name}`);
        button.addEventListener("click", () => {
          if (action === "Edit") {
            editing = category.id;
            $("#category-name").value = category.name;
            $("#category-description").value = category.description;
            $("#category-form-title").textContent = "Edit category.";
            $("#category-name").focus();
          } else {
            pending = category;
            opener = button;
            $("#category-delete-name").textContent = category.name;
            $("#category-delete-dialog").returnValue = "";
            $("#category-delete-dialog").showModal();
          }
        });
        actions.append(button);
      }
      row.append(name, count, actions);
      body.append(row);
    }
  } catch (e) {
    showError($("#admin-error"), e.message);
  }
}
$("#category-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  showError($("#admin-error"), "");
  showError($("#admin-notice"), "");
  for (const field of [$("#category-name"), $("#category-description")])
    field.setCustomValidity(
      field.value.trim() ? "" : "Please complete this field.",
    );
  if (!e.target.reportValidity()) {
    showError($("#admin-error"), "Enter a category name and description.");
    return;
  }
  $("#save-category").disabled = true;
  try {
    await sendJSON(
      editing ? `/api/admin/categories/${editing}` : "/api/admin/categories",
      editing ? "PUT" : "POST",
      {
        name: $("#category-name").value.trim(),
        description: $("#category-description").value.trim(),
      },
    );
    showError(
      $("#admin-notice"),
      editing ? "Category updated." : "Category created.",
    );
    reset();
    await load();
  } catch (error) {
    showError($("#admin-error"), error.message);
  } finally {
    $("#save-category").disabled = false;
  }
});
$("#category-form").addEventListener("input", (e) =>
  e.target.setCustomValidity?.(""),
);
$("#reset-category").addEventListener("click", reset);
$("#category-delete-dialog").addEventListener("close", async () => {
  opener?.focus();
  if ($("#category-delete-dialog").returnValue !== "delete") return;
  try {
    await sendJSON(`/api/admin/categories/${pending.id}`, "DELETE");
    if (editing === pending.id) reset();
    showError($("#admin-notice"), "Category deleted.");
    await load();
  } catch (e) {
    showError($("#admin-error"), e.message);
  }
});
load();
