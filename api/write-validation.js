const { ValidationError, positiveId } = require("./validation");

function objectBody(body, allowed) {
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw new ValidationError("Send a JSON object.");
  for (const key of Object.keys(body))
    if (!allowed.includes(key))
      throw new ValidationError(`Unknown field: ${key}.`);
}
function text(value, field, max, optional = false) {
  if (optional && (value === undefined || value === null)) return "";
  if (
    typeof value !== "string" ||
    (!optional && !value.trim()) ||
    value.trim().length > max ||
    /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(value)
  ) {
    throw new ValidationError(
      `${field} must contain ${optional ? "0" : "1"}–${max} characters.`,
    );
  }
  return value.trim();
}
function id(value, field) {
  if (typeof value === "number" && Number.isSafeInteger(value))
    value = String(value);
  return positiveId(value, field);
}
function amount(value, field, max = 9999999999.99) {
  if (
    !["string", "number"].includes(typeof value) ||
    !/^\d{1,10}(\.\d{1,2})?$/.test(String(value)) ||
    !Number.isFinite(Number(value)) ||
    Number(value) > max
  )
    throw new ValidationError(
      `${field} must be a non-negative amount with up to two decimal places.`,
    );
  return Number(value).toFixed(2);
}
function dateTime(value, field) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?$/.test(value)
  )
    throw new ValidationError(`${field} must be a valid local date and time.`);
  const full = value.replace(" ", "T") + (value.length === 16 ? ":00" : "");
  const parsed = new Date(full + "Z");
  if (
    full < "1000" ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 19) !== full
  )
    throw new ValidationError(`${field} must be a valid local date and time.`);
  return full.replace("T", " ");
}
function registrationBody(body) {
  objectBody(body, ["full_name", "email", "phone", "ticket_quantity"]);
  const email = text(body.email, "Email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new ValidationError("Enter a valid email address.");
  const phone = text(body.phone, "Phone", 40);
  if (!/^[+\d() .-]{6,40}$/.test(phone) || phone.replace(/\D/g, "").length < 6)
    throw new ValidationError("Enter a valid contact phone number.");
  if (
    !Number.isInteger(body.ticket_quantity) ||
    body.ticket_quantity < 1 ||
    body.ticket_quantity > 10
  )
    throw new ValidationError("Choose between 1 and 10 tickets.");
  return {
    full_name: text(body.full_name, "Name", 100),
    email,
    phone,
    ticket_quantity: body.ticket_quantity,
  };
}
function eventBody(body) {
  const fields = [
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
  objectBody(body, fields);
  const value = {};
  for (const [key, max] of Object.entries({
    name: 150,
    summary: 255,
    purpose: 500,
    description: 12000,
    venue: 150,
    location: 100,
    address: 255,
    image_alt: 255,
    accessibility: 500,
  }))
    value[key] = text(body[key], key.replaceAll("_", " "), max);
  for (const key of ["category_id", "organisation_id"])
    value[key] = id(body[key], key.replaceAll("_", " "));
  for (const key of ["starts_at", "ends_at"])
    value[key] = dateTime(body[key], key.replaceAll("_", " "));
  if (value.ends_at <= value.starts_at)
    throw new ValidationError("The end time must be after the start time.");
  value.ticket_price = amount(body.ticket_price, "Ticket price", 99999999.99);
  value.fundraising_goal = amount(body.fundraising_goal, "Fundraising goal");
  value.amount_raised = amount(body.amount_raised, "Amount raised");
  if (Number(value.fundraising_goal) <= 0)
    throw new ValidationError("Fundraising goal must be greater than zero.");
  if (!["active", "suspended"].includes(body.publication_status))
    throw new ValidationError("Choose Active or Suspended publication status.");
  value.publication_status = body.publication_status;
  if (
    typeof body.image_path !== "string" ||
    !/^\/assets\/(coast|run|table|garden|concert|auction|gala)\.jpg$/.test(
      body.image_path,
    )
  )
    throw new ValidationError("Choose one of the supplied event images.");
  value.image_path = body.image_path;
  for (const [key, limit] of [
    ["latitude", 90],
    ["longitude", 180],
  ]) {
    const raw = body[key];
    if (raw === undefined || raw === null || raw === "") value[key] = null;
    else if (
      !["string", "number"].includes(typeof raw) ||
      !/^-?\d+(\.\d{1,6})?$/.test(String(raw)) ||
      !Number.isFinite(Number(raw)) ||
      Math.abs(Number(raw)) > limit
    )
      throw new ValidationError(`Enter a valid ${key}.`);
    else value[key] = Number(raw);
  }
  if ((value.latitude === null) !== (value.longitude === null))
    throw new ValidationError(
      "Provide both latitude and longitude, or leave both empty.",
    );
  return value;
}
function categoryBody(body) {
  objectBody(body, ["name", "description"]);
  return {
    name: text(body.name, "Category name", 60),
    description: text(body.description, "Category description", 255),
  };
}
module.exports = { registrationBody, eventBody, categoryBody };
