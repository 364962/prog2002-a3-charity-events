export const money = (amount) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: amount % 1 ? 2 : 0,
  }).format(amount);

export function eventDate(value) {
  return new Date(value.replace(" ", "T") + "+10:00");
}
export function formatDate(
  value,
  options = { weekday: "long", day: "numeric", month: "long", year: "numeric" },
) {
  return new Intl.DateTimeFormat("en-AU", {
    ...options,
    timeZone: "Australia/Brisbane",
  }).format(eventDate(value));
}
export async function getJSON(path, signal) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) controller.abort();
  const timer = setTimeout(() => controller.abort("timeout"), 12000);
  try {
    const response = await fetch(path, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(
        result.error || "Events could not be loaded. Please try again.",
      );
    return result;
  } catch (error) {
    if (signal?.aborted)
      throw new DOMException("Request cancelled", "AbortError");
    if (error instanceof TypeError || controller.signal.aborted) {
      throw new Error(
        "We could not reach the events service. Check your connection and try again.",
      );
    }
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}
export function showError(element, message) {
  element.textContent = message || "";
  element.hidden = !message;
}
export function renderEvents(events, grid) {
  const template = document.querySelector("#event-card-template");
  const fragment = document.createDocumentFragment();
  for (const event of events) {
    const card = template.content.cloneNode(true);
    const href = `/event.html?id=${encodeURIComponent(event.id)}`;
    card.querySelectorAll("a").forEach((link) => {
      link.href = href;
    });
    const image = card.querySelector(".card-image");
    // Only local assets are accepted; all database text is assigned via textContent.
    image.src = /^\/assets\/[a-z-]+\.(jpg|png|webp)$/.test(event.image_path)
      ? event.image_path
      : "/assets/coast.jpg";
    image.alt = event.image_alt;
    card
      .querySelector(".card-image-link")
      .setAttribute("aria-label", `View ${event.name}`);
    card.querySelector(".card-date strong").textContent = formatDate(
      event.starts_at,
      { day: "numeric" },
    );
    card.querySelector(".card-date > span").textContent = formatDate(
      event.starts_at,
      { month: "short" },
    ).toUpperCase();
    const status = card.querySelector(".status-pill");
    status.textContent =
      event.event_status === "current" ? "Happening now" : "Upcoming";
    status.classList.toggle("current", event.event_status === "current");
    card.querySelector(".card-category").textContent = event.category;
    card.querySelector(".card-price").textContent =
      event.ticket_price === 0
        ? "Free entry"
        : `${money(event.ticket_price)} / person`;
    card.querySelector(".card-title").textContent = event.name;
    card.querySelector(".card-summary").textContent = event.summary;
    card.querySelector(".card-location").textContent = event.location;
    card
      .querySelector(".card-arrow")
      .setAttribute("aria-label", `Details for ${event.name}`);
    fragment.append(card);
  }
  grid.replaceChildren(fragment);
}
export async function populateCategories(select) {
  const { data } = await getJSON("/api/categories");
  for (const category of data) {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    select.append(option);
  }
  return data;
}
