const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const locationButton = document.getElementById("locationButton");

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

const weatherCodes = {
  0: { label: "Cerah", icon: "☀️" },
  1: { label: "Cerah berawan", icon: "🌤️" },
  2: { label: "Berawan sebagian", icon: "⛅" },
  3: { label: "Mendung", icon: "☁️" },
  45: { label: "Berkabut", icon: "🌫️" },
  48: { label: "Kabut tebal", icon: "🌫️" },
  51: { label: "Gerimis ringan", icon: "🌦️" },
  53: { label: "Gerimis", icon: "🌦️" },
  55: { label: "Gerimis lebat", icon: "🌧️" },
  61: { label: "Hujan ringan", icon: "🌦️" },
  63: { label: "Hujan", icon: "🌧️" },
  65: { label: "Hujan lebat", icon: "🌧️" },
  71: { label: "Salju ringan", icon: "🌨️" },
  73: { label: "Salju", icon: "❄️" },
  75: { label: "Salju lebat", icon: "❄️" },
  80: { label: "Hujan singkat", icon: "🌦️" },
  81: { label: "Hujan", icon: "🌧️" },
  82: { label: "Hujan lebat", icon: "⛈️" },
  95: { label: "Badai petir", icon: "⛈️" },
  96: { label: "Badai petir dan hujan es", icon: "⛈️" },
  99: { label: "Badai petir kuat", icon: "⛈️" }
};

function getWeatherInfo(code) {
  return weatherCodes[code] || {
    label: "Kondisi tidak diketahui",
    icon: "🌍"
  };
}

function showStatus(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
}

function setLoading() {
  showStatus("Sedang mengambil data cuaca...");
  weatherDashboard.classList.add("hidden");
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeStyle: "short"
  }).format(new Date(dateString));
}

function formatDay(dateString) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short"
  }).format(new Date(dateString));
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
    throw new Error(`Kota "${city}" tidak ditemukan.`);
  }

  return data.results[0];
}

async function fetchWeather(latitude, longitude, timezone = "auto") {
  const url = new URL(
    "https://api.open-meteo.com/v1/forecast"
  );

  url.searchParams.set("latitude", latitude);
  url.searchParams.set("longitude", longitude);

  url.searchParams.set(
    "current",
    [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "precipitation",
      "weather_code",
      "wind_speed_10m"
    ].join(",")
  );

  url.searchParams.set(
    "daily",
    [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max"
    ].join(",")
  );

  url.searchParams.set("forecast_days", "5");
  url.searchParams.set("timezone", timezone);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Gagal mengambil data cuaca.");
  }

  return response.json();
}

function renderWeather(location, data) {
  const current = data.current;
  const units = data.current_units;
  const daily = data.daily;
  const currentInfo = getWeatherInfo(current.weather_code);

  const fullLocation = [
    location.name,
    location.admin1,
    location.country
  ]
    .filter(Boolean)
    .join(", ");

  locationName.textContent = fullLocation;
  locationDate.textContent =
    `Diperbarui: ${formatDate(current.time)}`;

  weatherIcon.textContent = currentInfo.icon;

  temperature.textContent =
    `${Math.round(current.temperature_2m)}${units.temperature_2m}`;

  weatherDescription.textContent = currentInfo.label;

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
      const dayInfo = getWeatherInfo(daily.weather_code[index]);

      return `
        <article class="forecast-card">
          <h3>${formatDay(date)}</h3>

          <div class="forecast-icon">
            ${dayInfo.icon}
          </div>

          <strong>
            ${Math.round(daily.temperature_2m_max[index])}° /
            ${Math.round(daily.temperature_2m_min[index])}°
          </strong>

          <small>${dayInfo.label}</small>

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

async function loadWeatherByCity(city) {
  try {
    setLoading();

    const location = await searchLocation(city);

    const weatherData = await fetchWeather(
      location.latitude,
      location.longitude,
      location.timezone || "auto"
    );

    renderWeather(location, weatherData);
  } catch (error) {
    weatherDashboard.classList.add("hidden");
    showStatus(error.message, "error");
  }
}

async function loadWeatherByCoordinates(latitude, longitude) {
  try {
    setLoading();

    const weatherData = await fetchWeather(
      latitude,
      longitude,
      "auto"
    );

    const location = {
      name: "Lokasi Saya",
      admin1: "",
      country: ""
    };

    renderWeather(location, weatherData);
  } catch (error) {
    weatherDashboard.classList.add("hidden");
    showStatus(
      "Data cuaca berdasarkan lokasi gagal diambil.",
      "error"
    );
  }
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const city = cityInput.value.trim();

  if (!city) {
    showStatus(
      "Masukkan nama kota terlebih dahulu.",
      "error"
    );
    return;
  }

  loadWeatherByCity(city);
});

locationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    showStatus(
      "Browser tidak mendukung fitur lokasi.",
      "error"
    );
    return;
  }

  setLoading();

  navigator.geolocation.getCurrentPosition(
    (position) => {
      loadWeatherByCoordinates(
        position.coords.latitude,
        position.coords.longitude
      );
    },
    () => {
      showStatus(
        "Izin lokasi ditolak atau lokasi tidak tersedia.",
        "error"
      );
    }
  );
});