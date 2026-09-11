const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");

const statusMessage = document.getElementById("statusMessage");
const weatherDashboard = document.getElementById("weatherDashboard");

const locationName = document.getElementById("locationName");
const locationDate = document.getElementById("locationDate");
const weatherIcon = document.getElementById("weatherIcon");
const temperature = document.getElementById("temperature");
const weatherDescription = document.getElementById("weatherDescription");
const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("windSpeed");
const rainfall = document.getElementById("rainfall");
const apparentTemperature = document.getElementById("apparentTemperature");
const forecastGrid = document.getElementById("forecastGrid");

if (!searchForm || !cityInput || !statusMessage) {
  console.error("Elemen HTML tidak ditemukan.");
} else {
  searchForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const city = cityInput.value.trim();

    if (!city) {
      showStatus("Masukkan nama kota terlebih dahulu.", "error");
      return;
    }

    await loadWeather(city);
  });
}

const weatherCodes = {
  0: ["Cerah", "☀️"],
  1: ["Cerah berawan", "🌤️"],
  2: ["Berawan sebagian", "⛅"],
  3: ["Mendung", "☁️"],
  45: ["Berkabut", "🌫️"],
  48: ["Kabut tebal", "🌫️"],
  51: ["Gerimis ringan", "🌦️"],
  53: ["Gerimis", "🌦️"],
  55: ["Gerimis lebat", "🌧️"],
  61: ["Hujan ringan", "🌦️"],
  63: ["Hujan", "🌧️"],
  65: ["Hujan lebat", "🌧️"],
  80: ["Hujan singkat", "🌦️"],
  81: ["Hujan", "🌧️"],
  82: ["Hujan lebat", "⛈️"],
  95: ["Badai petir", "⛈️"],
  96: ["Badai petir dan hujan es", "⛈️"],
  99: ["Badai petir kuat", "⛈️"]
};

function getWeatherInfo(code) {
  return weatherCodes[code] || [
    "Kondisi tidak diketahui",
    "🌍"
  ];
}

function showStatus(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
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
    throw new Error("API pencarian kota gagal.");
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error(`Kota "${city}" tidak ditemukan.`);
  }

  return data.results[0];
}

async function getWeather(latitude, longitude, timezone) {
  const url = new URL(
    "https://api.open-meteo.com/v1/forecast"
  );

  url.searchParams.set("latitude", latitude);
  url.searchParams.set("longitude", longitude);

  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m"
  );

  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max"
  );

  url.searchParams.set("forecast_days", "5");
  url.searchParams.set("timezone", timezone || "auto");

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("API cuaca gagal diakses.");
  }

  return response.json();
}

async function loadWeather(city) {
  try {
    showStatus("Sedang mengambil data cuaca...");
    weatherDashboard.classList.add("hidden");

    const location = await searchLocation(city);

    const weather = await getWeather(
      location.latitude,
      location.longitude,
      location.timezone
    );

    renderWeather(location, weather);
  } catch (error) {
    console.error(error);

    weatherDashboard.classList.add("hidden");
    showStatus(error.message, "error");
  }
}

function renderWeather(location, weather) {
  const current = weather.current;
  const units = weather.current_units;
  const daily = weather.daily;

  const [description, icon] =
    getWeatherInfo(current.weather_code);

  locationName.textContent = [
    location.name,
    location.admin1,
    location.country
  ]
    .filter(Boolean)
    .join(", ");

  locationDate.textContent =
    `Diperbarui: ${current.time}`;

  weatherIcon.textContent = icon;

  temperature.textContent =
    `${Math.round(current.temperature_2m)}${units.temperature_2m}`;

  weatherDescription.textContent = description;

  humidity.textContent =
    `${current.relative_humidity_2m}${units.relative_humidity_2m}`;

  windSpeed.textContent =
    `${Math.round(current.wind_speed_10m)} ${units.wind_speed_10m}`;

  rainfall.textContent =
    `${current.precipitation} ${units.precipitation}`;

  apparentTemperature.textContent =
    `${Math.round(current.apparent_temperature)}${units.apparent_temperature}`;

  forecastGrid.innerHTML = daily.time
    .map((date, index) => {
      const [dailyDescription, dailyIcon] =
        getWeatherInfo(daily.weather_code[index]);

      return `
        <article class="forecast-card">
          <h3>${date}</h3>

          <div class="forecast-icon">
            ${dailyIcon}
          </div>

          <strong>
            ${Math.round(daily.temperature_2m_max[index])}° /
            ${Math.round(daily.temperature_2m_min[index])}°
          </strong>

          <small>${dailyDescription}</small>

          <small>
            Hujan:
            ${daily.precipitation_probability_max[index] ?? 0}%
          </small>
        </article>
      `;
    })
    .join("");

  statusMessage.classList.add("hidden");
  weatherDashboard.classList.remove("hidden");
}