async function fetchWeather(latitude, longitude) {
  const url = new URL(
    "https://api.open-meteo.com/v1/forecast"
  );

  url.searchParams.set("latitude", latitude);
  url.searchParams.set("longitude", longitude);
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code"
  );
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min"
  );
  url.searchParams.set("forecast_days", "5");
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Gagal mengambil data cuaca.");
  }

  return response.json();
}

async function searchLocation(city) {
  const url = new URL(
    "https://geocoding-api.open-meteo.com/v1/search"
  );

  url.searchParams.set("name", city);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "id");
  url.searchParams.set("format", "json");

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Gagal mencari kota.");
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error("Kota tidak ditemukan.");
  }

  return data.results[0];
}