
const API_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=53.55&longitude=9.99&current=temperature_2m,is_day,precipitation,wind_speed_10m&hourly=uv_index&forecast_days=1&timezone=Europe%2FBerlin";

const $ = (selector) => document.querySelector(selector);

function setStatus(message, state = "loading") {
  const status = $("#weather-status");
  if (!status) return;
  status.textContent = message;
  status.dataset.state = state;
}

function getUvForCurrentHour(data) {
  const currentTime = data.current?.time;
  const times = data.hourly?.time || [];
  const values = data.hourly?.uv_index || [];
  if (!currentTime || !times.length) return null;

  // Find the hourly value matching the current API time.
  let index = times.indexOf(currentTime);
  if (index === -1) {
    const currentHour = currentTime.slice(0, 13);
    index = times.findIndex((time) => time.slice(0, 13) === currentHour);
  }
  return index >= 0 && Number.isFinite(values[index]) ? values[index] : null;
}

function chooseMood(current, uv) {
  const rain = Number(current.precipitation || 0);
  const isDay = Number(current.is_day) === 1;

  if (!isDay) {
    return {
      name: "NIGHT MODE",
      title: "THE CITY IS YOUR RUNWAY.",
      copy: "Night-out energy. Discover statement accessories and bold looks.",
      className: "mood-night"
    };
  }
  if (rain > 0.2) {
    return {
      name: "RAIN MODE",
      title: "A LITTLE RAIN. A LOT OF STYLE.",
      copy: "Cloudy-day mood: explore layers, bags and accessories.",
      className: "mood-rain"
    };
  }
  if (uv !== null && uv >= 6) {
    return {
      name: "SUN MODE",
      title: "SUN'S OUT. STYLE'S ON.",
      copy: "High UV right now. Find your look and remember sun protection.",
      className: "mood-sun"
    };
  }
  return {
    name: "DAY MODE",
    title: "MAKE TODAY YOUR SUMMER.",
    copy: "A good day to add a little colour to your everyday look.",
    className: "mood-day"
  };
}

function renderWeather(data) {
  const current = data.current;
  if (!current || !Number.isFinite(current.temperature_2m)) {
    throw new Error("The weather response did not contain the expected current values.");
  }

  const uv = getUvForCurrentHour(data);
  $("#temperature").textContent = `${Math.round(current.temperature_2m)}°C`;
  $("#uv-index").textContent = uv === null ? "—" : `${Math.round(uv * 10) / 10}`;
  $("#wind").textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  $("#precipitation").textContent = `${Math.round(current.precipitation * 10) / 10} mm`;
  $("#weather-time").textContent = `Updated: ${current.time.replace("T", " ")} (local time)`;

  const mood = chooseMood(current, uv);
  document.body.classList.remove("mood-sun", "mood-rain", "mood-night", "mood-day");
  document.body.classList.add(mood.className);
  $("#mood-label").textContent = mood.name;
  $("#mood-title").textContent = mood.title;
  $("#mood-copy").textContent = mood.copy;
  setStatus("Live weather loaded successfully.", "success");
}

async function loadWeather() {
  setStatus("Loading fresh weather data…", "loading");
  try {
    const response = await fetch(API_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Weather service responded with status ${response.status}.`);
    }
    const data = await response.json();
    renderWeather(data);
  } catch (error) {
    console.error("SUNCLUB weather error:", error);
    setStatus("Weather data is temporarily unavailable. Please try again later.", "error");
    $("#mood-label").textContent = "WEATHER UPDATE";
    $("#mood-title").textContent = "YOUR STYLE, WHATEVER THE WEATHER.";
    $("#mood-copy").textContent = "We couldn't load the live forecast just now. The collection is still here for you.";
    $("#temperature").textContent = "—";
    $("#uv-index").textContent = "—";
    $("#wind").textContent = "—";
    $("#precipitation").textContent = "—";
  }
}

$("#refresh-weather")?.addEventListener("click", loadWeather);
loadWeather();
