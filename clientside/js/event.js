import { getJSON, money, formatDate, showError } from "./common.js";
const article = document.querySelector("#event-detail");
const status = document.querySelector("#detail-status");
const error = document.querySelector("#detail-error");
const retry = document.querySelector("#retry-detail");
const dialog = document.querySelector("#registration-dialog");
// WebKit does not always focus a clicked button before opening a dialog.
dialog.addEventListener("close", () => {
  document.querySelector("#register-button").focus();
});
const quantity = document.querySelector("#ticket-quantity");
const put = (id, value) => {
  document.getElementById(id).textContent = value;
};
let currentEvent;
function updateTotal() {
  put(
    "ticket-total",
    currentEvent.ticket_price === 0
      ? "Free"
      : money(currentEvent.ticket_price * Number(quantity.value)),
  );
}
quantity.addEventListener("change", updateTotal);
document.querySelector("#registration-form").addEventListener("submit", (e) => {
  e.preventDefault();
  if (currentEvent?.event_status !== "past") dialog.showModal();
});
dialog.addEventListener("click", (e) => {
  if (e.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    )
      dialog.close();
  }
});
async function loadEvent() {
  showError(error, "");
  retry.hidden = true;
  status.hidden = false;
  status.textContent = "Finding the details…";
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  if (!id || params.getAll("id").length !== 1 || !/^[1-9]\d{0,9}$/.test(id)) {
    status.hidden = true;
    showError(
      error,
      "Choose an event from the Home or Find an event page to view its details.",
    );
    return;
  }
  try {
    const { data: event } = await getJSON(
      `/api/events/${encodeURIComponent(id)}`,
    );
    currentEvent = event;
    document.title = `${event.name} | Good Together`;
    const statusLabel = {
      upcoming: "Upcoming",
      current: "Happening now",
      past: "Past event",
    }[event.event_status];
    for (const [id, value] of Object.entries({
      "detail-category": event.category,
      "detail-status-label": statusLabel,
      "detail-title": event.name,
      "detail-summary": event.summary,
      "detail-organisation": event.organisation,
      "detail-venue": event.venue,
      "detail-address": event.address,
      "detail-purpose": event.purpose,
      "detail-accessibility": event.accessibility,
      "detail-phone": event.contact_phone,
      "detail-price":
        event.ticket_price === 0 ? "Free entry" : money(event.ticket_price),
      "ticket-description":
        event.ticket_price === 0
          ? "Everyone is welcome. Optional donations support the cause."
          : "AUD per person · Your ticket supports this local cause.",
      "detail-raised": money(event.amount_raised),
      "detail-goal": `of ${money(event.fundraising_goal)} goal`,
    }))
      put(id, value);
    put("detail-date", formatDate(event.starts_at));
    const timeOptions = { hour: "numeric", minute: "2-digit" };
    const differentDay =
      event.starts_at.slice(0, 10) !== event.ends_at.slice(0, 10);
    put(
      "detail-time",
      `${formatDate(event.starts_at, timeOptions)} – ${differentDay ? formatDate(event.ends_at) + ", " : ""}${formatDate(event.ends_at, timeOptions)}`,
    );
    const image = document.querySelector("#detail-image");
    image.src = /^\/assets\/[a-z-]+\.(jpg|png|webp)$/.test(event.image_path)
      ? event.image_path
      : "/assets/coast.jpg";
    image.alt = event.image_alt;
    const description = document.querySelector("#detail-description");
    description.replaceChildren();
    for (const paragraph of event.description.split("\n\n")) {
      const p = document.createElement("p");
      p.textContent = paragraph;
      description.append(p);
    }
    const contact = document.querySelector("#detail-contact");
    contact.textContent = event.contact_email;
    contact.href = `mailto:${event.contact_email}`;
    const percent = Math.round(
      (event.amount_raised / event.fundraising_goal) * 100,
    );
    document.querySelector("#detail-progress").value = Math.min(percent, 100);
    document
      .querySelector("#detail-progress")
      .setAttribute(
        "aria-label",
        `${money(event.amount_raised)} raised toward ${money(event.fundraising_goal)} goal`,
      );
    put("detail-percent", `${percent}%`);
    document.querySelector("#registration-form").hidden =
      event.event_status === "past";
    document.querySelector("#past-note").hidden = event.event_status !== "past";
    updateTotal();
    article.hidden = false;
    status.hidden = true;
  } catch (e) {
    status.hidden = true;
    showError(error, e.message);
    retry.hidden = false;
  }
}
retry.addEventListener("click", loadEvent);
loadEvent();
