import { getJSON, sendJSON, money, formatDate, showError } from "./common.js";
const $ = (s) => document.querySelector(s);
const params = new URLSearchParams(location.search),
  id = params.get("id");
const form = $("#booking-form");
let event;
function total() {
  $("#booking-total").textContent = event.ticket_price
    ? money(event.ticket_price * Number($("#booking-quantity").value))
    : "Free";
}
async function load() {
  showError($("#registration-error"), "");
  $("#registration-retry").hidden = true;
  $("#registration-loading").hidden = false;
  try {
    if (!id || params.getAll("id").length !== 1 || !/^[1-9]\d{0,9}$/.test(id))
      throw new Error("Choose an event before registering.");
    ({ data: event } = await getJSON(`/api/events/${id}`));
    $("#back-event").href = `/event.html?id=${id}`;
    $("#back-event").textContent = "← Back to event";
    if (event.event_status === "past")
      throw new Error("This event has ended and registration is closed.");
    $("#booking-event-title").textContent = event.name;
    $("#booking-date").textContent =
      formatDate(event.starts_at, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }) + " · Brisbane time";
    $("#booking-location").textContent = `${event.venue} · ${event.address}`;
    $("#booking-price").textContent = event.ticket_price
      ? `${money(event.ticket_price)} per person`
      : "Free entry";
    $("#booking-organisation").textContent = `Hosted by ${event.organisation}`;
    $("#booking-image").src = /^\/assets\/[a-z-]+\.(jpg|png|webp)$/.test(
      event.image_path,
    )
      ? event.image_path
      : "/assets/coast.jpg";
    $("#booking-image").alt = event.image_alt;
    const qty = Number(params.get("quantity"));
    if (Number.isInteger(qty) && qty >= 1 && qty <= 10)
      $("#booking-quantity").value = String(qty);
    total();
    $("#booking-layout").hidden = false;
  } catch (error) {
    showError($("#registration-error"), error.message);
    $("#registration-retry").hidden = false;
  } finally {
    $("#registration-loading").hidden = true;
  }
}
$("#booking-quantity").addEventListener("change", total);
$("#registration-retry").addEventListener("click", load);
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  showError($("#registration-error"), "");
  const phone = $("#phone"),
    name = $("#full-name");
  name.setCustomValidity(name.value.trim() ? "" : "Enter your full name.");
  phone.setCustomValidity(
    /^[+\d() .-]{6,40}$/.test(phone.value.trim()) &&
      phone.value.replace(/\D/g, "").length >= 6
      ? ""
      : "Enter a valid contact phone number.",
  );
  if (!form.reportValidity()) {
    showError(
      $("#registration-error"),
      "Please check the highlighted field before continuing.",
    );
    return;
  }
  const button = $("#confirm-registration");
  button.disabled = true;
  button.textContent = "Saving your place…";
  try {
    const { data } = await sendJSON(`/api/events/${id}/registrations`, "POST", {
      full_name: name.value.trim(),
      email: $("#email").value.trim(),
      phone: phone.value.trim(),
      ticket_quantity: Number($("#booking-quantity").value),
    });
    form.hidden = true;
    $("#booking-success").hidden = false;
    $("#confirmation-details").textContent =
      `Thank you, ${data.full_name}. Registration #${data.id} confirms ${data.ticket_quantity} ticket${data.ticket_quantity === 1 ? "" : "s"} for ${event.name}. Total: ${money(data.total)}.`;
    $("#confirmation-time").textContent =
      "Registered " +
      formatDate(data.registered_at, {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }) +
      " · Brisbane time";
    $("#view-registration").href = `/event.html?id=${id}#registrations-title`;
    $("#booking-success").focus();
  } catch (error) {
    showError($("#registration-error"), error.message);
    $("#registration-error").scrollIntoView({ block: "center" });
  } finally {
    button.disabled = false;
    button.textContent = "Confirm registration ↗";
  }
});
form.addEventListener("input", (e) => e.target.setCustomValidity?.(""));
load();
