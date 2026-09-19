import { getJSON, renderEvents, showError } from "./common.js";
const grid = document.querySelector("#events-grid");
const status = document.querySelector("#events-status");
const error = document.querySelector("#events-error");
const retry = document.querySelector("#retry-events");

async function loadEvents() {
  showError(error, "");
  retry.hidden = true;
  grid.setAttribute("aria-busy", "true");
  status.textContent = "Finding your next good thing…";
  try {
    const { data } = await getJSON("/api/events");
    renderEvents(data, grid);
    status.textContent = data.length
      ? `${data.length} ways to come together · Current and upcoming events`
      : "No upcoming events just yet. Please check back soon.";
  } catch (e) {
    status.textContent = "Events could not be loaded.";
    showError(error, e.message);
    retry.hidden = false;
  } finally {
    grid.setAttribute("aria-busy", "false");
  }
}
async function loadCategories() {
  try {
    const { data } = await getJSON("/api/categories");
    for (const category of data) {
      const link = document.createElement("a");
      link.className = "category-chip";
      link.href = `/search.html?category=${category.id}`;
      link.textContent = category.name;
      document.querySelector("#category-links").append(link);
    }
  } catch {
    // The main search link remains usable if category shortcuts are unavailable.
  }
}
retry.addEventListener("click", loadEvents);
loadEvents();
loadCategories();
