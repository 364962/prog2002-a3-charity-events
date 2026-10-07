function weatherLabel(code) {
  if (code === 0) return "Clear sky";
  if ([1, 2, 3].includes(code))
    return ["Mainly clear", "Partly cloudy", "Overcast"][code - 1];
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([80, 81, 82].includes(code)) return "Rain showers";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Forecast conditions unavailable";
}
function createWeatherService(fetcher = fetch) {
  const cache = new Map();
  return async function forecast(event) {
    if (event.latitude === null || event.longitude === null)
      return {
        available: false,
        message: "No location coordinates have been added for this event.",
      };
    const day = event.starts_at.slice(0, 10);
    const today = new Date(Date.now() + 10 * 3600000)
      .toISOString()
      .slice(0, 10);
    const offset = (Date.parse(day) - Date.parse(today)) / 86400000;
    if (offset < 0)
      return { available: false, message: "This event date has passed." };
    if (offset > 15)
      return {
        available: false,
        message:
          "The event is outside the 16-day forecast window. Check back closer to the date.",
      };
    const key = `${event.latitude},${event.longitude},${day}`;
    const cached = cache.get(key);
    if (cached && cached.until > Date.now()) return cached.value;
    try {
      const url = new URL("https://api.open-meteo.com/v1/forecast");
      url.search = new URLSearchParams({
        latitude: String(event.latitude),
        longitude: String(event.longitude),
        daily: "weather_code,temperature_2m_max,temperature_2m_min",
        timezone: "Australia/Brisbane",
        forecast_days: "16",
      }).toString();
      const response = await fetcher(url, {
        signal: AbortSignal.timeout(6000),
      });
      if (!response.ok) throw new Error("Weather service unavailable");
      const { daily } = await response.json();
      const index = daily?.time?.indexOf(day);
      const min = daily?.temperature_2m_min?.[index],
        max = daily?.temperature_2m_max?.[index],
        code = daily?.weather_code?.[index];
      if (
        !Number.isInteger(index) ||
        index < 0 ||
        !Number.isFinite(min) ||
        !Number.isFinite(max) ||
        !Number.isFinite(code)
      )
        throw new Error("Forecast incomplete");
      const value = {
        available: true,
        date: day,
        description: weatherLabel(code),
        code,
        min,
        max,
        unit: "°C",
        source: "Open-Meteo",
        source_url: "https://open-meteo.com/",
        retrieved_at: new Date().toISOString(),
      };
      if (cache.size >= 200) cache.delete(cache.keys().next().value);
      cache.set(key, { until: Date.now() + 30 * 60000, value });
      return value;
    } catch {
      return {
        available: false,
        message:
          "Weather is temporarily unavailable. You can still register for this event.",
      };
    }
  };
}
module.exports = { createWeatherService, weatherLabel };
