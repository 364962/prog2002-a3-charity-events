class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}

function positiveId(value, field = "Event ID") {
  if (
    typeof value !== "string" ||
    !/^[1-9]\d{0,9}$/.test(value) ||
    Number(value) > 4294967295
  ) {
    throw new ValidationError(`${field} must be a positive whole number.`);
  }
  return Number(value);
}

function eventFilters(query) {
  const allowed = ["date", "location", "category"];
  const filters = {};
  for (const key of Object.keys(query)) {
    if (!allowed.includes(key))
      throw new ValidationError(`Unknown filter: ${key}.`);
    if (typeof query[key] !== "string")
      throw new ValidationError(`Provide only one ${key} filter.`);
    const value = query[key].trim();
    if (!value) continue;
    if (key === "date") {
      const date = new Date(`${value}T00:00:00Z`);
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        value < "1000-01-01" ||
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== value
      ) {
        throw new ValidationError("Choose a valid date in YYYY-MM-DD format.");
      }
    }
    if (
      key === "location" &&
      (value.length > 100 || /[\x00-\x1F\x7F]/.test(value))
    ) {
      throw new ValidationError(
        "Location must be at most 100 characters with no control characters.",
      );
    }
    filters[key] = key === "category" ? positiveId(value, "Category") : value;
  }
  return filters;
}

module.exports = { eventFilters, positiveId, ValidationError };
