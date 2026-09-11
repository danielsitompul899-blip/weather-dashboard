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
const feelsLike = document.getElementById("feelsLike");
const forecastGrid = document.getElementById("forecastGrid");

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

function setStatus(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatDay(value) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short"
  }).format(new Date(value));
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
    throw new Error("Tidak dapat mencari kota.");
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
  url.searchParams.set("timezone", timezone || "auto");

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Tidak dapat mengambil data cuaca.");
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

  weatherIcon.textContent = currentInfo[1];

  temperature.textContent =
    `${Math.round(current.temperature_2m)}${units.temperature_2m}`;

  weatherDescription.textContent = currentInfo[0];

  humidity.textContent =
    `${current.relative_humidity_2m}${units.relative_humidity_2m}`;

  windSpeed.textContent =
    `${Math.round(current.wind_speed_10m)} ${units.wind_speed_10m}`;

  rainfall.textContent =
    `${current.precipitation} ${units.precipitation}`;

  feelsLike.textContent =
    `${Math.round(current.apparent_temperature)}${units.apparent_temperature}`;

  forecastGrid.innerHTML = daily.time
    .map((date, index) => {
      const dayInfo = getWeatherInfo(daily.weather_code[index]);

      return `
        <article class="forecast-card">
          <h3>${formatDay(date)}</h3>

          <div class="forecast-icon">
            ${dayInfo[1]}
          </div>

          <strong>
            ${Math.round(daily.temperature_2m_max[index])}° /
            ${Math.round(daily.temperature_2m_min[index])}°
          </strong>

          <small>${dayInfo[0]}</small>

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
    setStatus("Sedang mengambil data cuaca...");
    weatherDashboard.classList.add("hidden");

    const location = await searchLocation(city);

    const weatherData = await getWeather(
      location.latitude,
      location.longitude,
      location.timezone
    );

    renderWeather(location, weatherData);
  } catch (error) {
    console.error(error);

    weatherDashboard.classList.add("hidden");
    setStatus(error.message, "error");
  }
}

async function loadWeatherByCoordinates(latitude, longitude) {
  try {
    setStatus("Sedang mengambil data cuaca...");
    weatherDashboard.classList.add("hidden");

    const weatherData = await getWeather(
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
    console.error(error);

    weatherDashboard.classList.add("hidden");
    setStatus(
      "Data cuaca berdasarkan lokasi gagal diambil.",
      "error"
    );
  }
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const city = cityInput.value.trim();

  if (!city) {
    setStatus("Masukkan nama kota terlebih dahulu.", "error");
    return;
  }

  loadWeatherByCity(city);
});

locationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    setStatus(
      "Browser tidak mendukung fitur lokasi.",
      "error"
    );
    return;
  }

  setStatus("Meminta izin lokasi...");
  weatherDashboard.classList.add("hidden");

  navigator.geolocation.getCurrentPosition(
    (position) => {
      loadWeatherByCoordinates(
        position.coords.latitude,
        position.coords.longitude
      );
    },
    () => {
      setStatus(
        "Izin lokasi ditolak atau lokasi tidak tersedia.",
        "error"
      );
    }
  );
});