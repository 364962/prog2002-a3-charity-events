import {
  getJSON,
  renderEvents,
  showError,
  populateCategories,
} from "./common.js";
const form = document.querySelector("#search-form");
const grid = document.querySelector("#events-grid");
const status = document.querySelector("#events-status");
const error = document.querySelector("#events-error");
const empty = document.querySelector("#empty-state");
const retry = document.querySelector("#retry-events");
const category = form.elements.category;
let activeRequest;
let lastParams = new URLSearchParams(location.search);

function applyURLToForm() {
  const params = new URLSearchParams(location.search);
  for (const field of ["date", "location", "category"])
    form.elements[field].value = params.get(field) || "";
  return params;
}
function renderFilters(params) {
  const list = document.querySelector("#active-filters");
  list.replaceChildren();
  for (const [name, value] of params) {
    if (!value) continue;
    const chip = document.createElement("span");
    const categoryName = category.selectedOptions[0]?.textContent;
    chip.textContent =
      name === "category" && category.value
        ? `Category: ${categoryName}`
        : `${name}: ${value}`;
    list.append(chip);
  }
}
async function search(params, updateURL = false) {
  activeRequest?.abort();
  const controller = new AbortController();
  activeRequest = controller;
  lastParams = new URLSearchParams(params);
  if (updateURL)
    history.pushState({}, "", `/search.html${params.size ? "?" + params : ""}`);
  renderFilters(params);
  showError(error, "");
  empty.hidden = true;
  retry.hidden = true;
  grid.replaceChildren();
  grid.setAttribute("aria-busy", "true");
  status.textContent = "Finding matching events…";
  try {
    const { data } = await getJSON(`/api/events?${params}`, controller.signal);
    if (controller.signal.aborted) return;
    renderEvents(data, grid);
    status.textContent = `${data.length} ${data.length === 1 ? "event" : "events"} found`;
    empty.hidden = data.length !== 0;
  } catch (e) {
    if (controller.signal.aborted) return;
    status.textContent = "Search could not be completed.";
    showError(error, e.message);
    retry.hidden = false;
  } finally {
    if (!controller.signal.aborted) grid.setAttribute("aria-busy", "false");
  }
}
form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!form.checkValidity()) {
    // Do not leave an earlier request able to overwrite a validation message.
    activeRequest?.abort();
    grid.setAttribute("aria-busy", "false");
    showError(
      error,
      "Please check the date and enter a location of no more than 100 characters.",
    );
    form.reportValidity();
    return;
  }
  const params = new URLSearchParams();
  for (const [key, value] of new FormData(form))
    if (value.trim()) params.set(key, value.trim());
  search(params, true);
});
function clearFilters() {
  form.reset();
  // URL-initialised values are properties, so reset restores the original empty controls.
  for (const field of ["date", "location", "category"])
    form.elements[field].value = "";
  search(new URLSearchParams(), true);
}
document
  .querySelector("#clear-filters")
  .addEventListener("click", clearFilters);
document.querySelector("#empty-clear").addEventListener("click", clearFilters);
retry.addEventListener("click", async () => {
  if (category.options.length === 1) await loadCategories();
  search(lastParams);
});
window.addEventListener("popstate", () => search(applyURLToForm()));
async function loadCategories() {
  try {
    await populateCategories(category);
    showError(document.querySelector("#category-error"), "");
  } catch (e) {
    showError(
      document.querySelector("#category-error"),
      "Categories could not be loaded. You can still search by date or location. Reload this page to try again.",
    );
  }
}
await loadCategories();
search(applyURLToForm());
