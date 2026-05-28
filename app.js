const destinations = [
  {
    name: "Old Town",
    lat: 44.431,
    lon: 26.101,
    cues: ["Head north-east", "Keep right at next street", "Arrive near Old Town"],
  },
  {
    name: "Park Gate",
    lat: 44.466,
    lon: 26.081,
    cues: ["Go straight", "Bear left toward park", "Destination on right"],
  },
  {
    name: "Home Pin",
    lat: 44.4268,
    lon: 26.1025,
    cues: ["Turn toward saved pin", "Continue ahead", "Arrive at Home Pin"],
  },
  {
    name: "Arena",
    lat: 44.437,
    lon: 26.152,
    cues: ["Head east", "Stay on main road", "Arrive at Arena"],
  },
];

const state = {
  activeScreen: "hud",
  destinationIndex: 0,
  position: null,
  heading: 0,
  demo: true,
  metric: true,
  glowHigh: false,
  focusIndex: 0,
  demoTick: 0,
};

const els = {
  gpsState: document.querySelector("#gpsState"),
  headingLabel: document.querySelector("#headingLabel"),
  bearingNeedle: document.querySelector("#bearingNeedle"),
  turnArrow: document.querySelector("#turnArrow"),
  cueText: document.querySelector("#cueText"),
  distanceValue: document.querySelector("#distanceValue"),
  distanceUnit: document.querySelector("#distanceUnit"),
  speedValue: document.querySelector("#speedValue"),
  speedUnit: document.querySelector("#speedUnit"),
  etaValue: document.querySelector("#etaValue"),
  routeName: document.querySelector("#routeName"),
  waypoints: document.querySelector("#waypoints"),
  destinationGrid: document.querySelector("#destinationGrid"),
  unitsLabel: document.querySelector("#unitsLabel"),
  brightnessLabel: document.querySelector("#brightnessLabel"),
};

function toRad(value) {
  return (value * Math.PI) / 180;
}

function toDeg(value) {
  return (value * 180) / Math.PI;
}

function distanceMeters(a, b) {
  const earthRadius = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadius * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function bearingDegrees(a, b) {
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLon = toRad(b.lon - a.lon);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function headingName(deg) {
  const names = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return names[Math.round(deg / 45) % names.length];
}

function formatDistance(meters) {
  if (state.metric) {
    if (meters >= 1000) {
      return { value: (meters / 1000).toFixed(1), unit: "km" };
    }
    return { value: Math.round(meters).toString(), unit: "m" };
  }

  const feet = meters * 3.28084;
  if (feet >= 5280) {
    return { value: (feet / 5280).toFixed(1), unit: "mi" };
  }
  return { value: Math.round(feet).toString(), unit: "ft" };
}

function formatSpeed(metersPerSecond) {
  const speed = state.metric ? metersPerSecond * 3.6 : metersPerSecond * 2.23694;
  return Math.max(0, Math.round(speed));
}

function currentDestination() {
  return destinations[state.destinationIndex];
}

function demoPosition() {
  const destination = currentDestination();
  const radius = 0.018 - Math.min(state.demoTick, 160) * 0.00008;
  const angle = state.demoTick * 0.035;
  return {
    lat: destination.lat - radius * Math.cos(angle),
    lon: destination.lon - radius * Math.sin(angle),
    speed: 4.2 + Math.sin(angle) * 1.1,
    accuracy: 8,
  };
}

function cueFor(distance) {
  const destination = currentDestination();
  if (distance < 35) return destination.cues[2];
  if (distance < 260) return destination.cues[1];
  return destination.cues[0];
}

function renderHud() {
  const destination = currentDestination();
  const position = state.position || demoPosition();
  const distance = distanceMeters(position, destination);
  const bearing = bearingDegrees(position, destination);
  const relativeBearing = (bearing - state.heading + 360) % 360;
  const speed = position.speed || 0;
  const eta = speed > 0.8 ? Math.max(1, Math.round(distance / speed / 60)) : "--";
  const formattedDistance = formatDistance(distance);

  els.gpsState.textContent = state.demo ? "Demo path" : `Live ±${Math.round(position.accuracy || 0)}m`;
  els.headingLabel.textContent = headingName(state.heading);
  els.bearingNeedle.style.transform = `rotate(${relativeBearing}deg)`;
  els.turnArrow.textContent = arrowForBearing(relativeBearing);
  els.cueText.textContent = cueFor(distance);
  els.distanceValue.textContent = formattedDistance.value;
  els.distanceUnit.textContent = formattedDistance.unit;
  els.speedValue.textContent = formatSpeed(speed);
  els.speedUnit.textContent = state.metric ? "km/h" : "mph";
  els.etaValue.textContent = eta;
  els.routeName.textContent = destination.name;
}

function arrowForBearing(relativeBearing) {
  if (relativeBearing < 25 || relativeBearing > 335) return "↑";
  if (relativeBearing < 155) return "↗";
  if (relativeBearing < 205) return "↓";
  return "↖";
}

function renderRoute() {
  const destination = currentDestination();
  els.routeName.textContent = destination.name;
  els.waypoints.innerHTML = destination.cues
    .map((cue, index) => `<li><span>${cue}</span><strong>${index + 1}</strong></li>`)
    .join("");

  els.destinationGrid.innerHTML = destinations
    .map((destinationItem, index) => {
      const selected = index === state.destinationIndex ? " selected" : "";
      return `<button class="focusable${selected}" data-destination="${index}">${destinationItem.name}</button>`;
    })
    .join("");
}

function renderSettings() {
  els.unitsLabel.textContent = state.metric ? "Metric" : "Imperial";
  els.brightnessLabel.textContent = state.glowHigh ? "High" : "Balanced";
  document.documentElement.classList.toggle("glow-high", state.glowHigh);
}

function render() {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.toggle("active", screen.id === `screen-${state.activeScreen}`);
  });
  renderHud();
  renderRoute();
  renderSettings();
  refreshFocusables();
}

function refreshFocusables() {
  const focusables = visibleFocusables();
  if (!focusables.length) return;
  state.focusIndex = Math.min(state.focusIndex, focusables.length - 1);
  focusables.forEach((element) => element.classList.remove("is-focused"));
  const active = focusables[state.focusIndex];
  active.classList.add("is-focused");
  active.focus({ preventScroll: true });
}

function visibleFocusables() {
  const screen = document.querySelector(`#screen-${state.activeScreen}`);
  return [...screen.querySelectorAll(".focusable")];
}

function activate(element) {
  if (element.dataset.screen) {
    state.activeScreen = element.dataset.screen;
    state.focusIndex = 0;
    render();
    return;
  }

  if (element.dataset.destination) {
    state.destinationIndex = Number(element.dataset.destination);
    state.activeScreen = "hud";
    state.focusIndex = 0;
    render();
    return;
  }

  const action = element.dataset.action;
  if (action === "cycle-destination") {
    state.destinationIndex = (state.destinationIndex + 1) % destinations.length;
  }
  if (action === "toggle-demo") {
    state.demo = !state.demo;
    state.demoTick = 0;
  }
  if (action === "toggle-units") {
    state.metric = !state.metric;
  }
  if (action === "toggle-brightness") {
    state.glowHigh = !state.glowHigh;
  }
  if (action === "use-current-target") {
    const source = state.position || demoPosition();
    destinations[2] = { ...destinations[2], lat: source.lat, lon: source.lon };
    state.destinationIndex = 2;
  }
  if (action === "reset-demo") {
    state.demo = true;
    state.demoTick = 0;
  }
  render();
}

function handleKey(event) {
  const focusables = visibleFocusables();
  if (!focusables.length) return;

  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
    event.preventDefault();
    state.focusIndex = (state.focusIndex + 1) % focusables.length;
    refreshFocusables();
  }

  if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
    event.preventDefault();
    state.focusIndex = (state.focusIndex - 1 + focusables.length) % focusables.length;
    refreshFocusables();
  }

  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    activate(focusables[state.focusIndex]);
  }
}

function initLocation() {
  if (!("geolocation" in navigator)) {
    state.demo = true;
    render();
    return;
  }

  navigator.geolocation.watchPosition(
    (result) => {
      state.position = {
        lat: result.coords.latitude,
        lon: result.coords.longitude,
        speed: result.coords.speed || 0,
        accuracy: result.coords.accuracy,
      };
      state.demo = false;
      render();
    },
    () => {
      state.demo = true;
      render();
    },
    {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 6000,
    },
  );
}

function initHeading() {
  window.addEventListener("deviceorientationabsolute", (event) => {
    if (typeof event.alpha === "number") {
      state.heading = (360 - event.alpha) % 360;
      renderHud();
    }
  });

  window.addEventListener("deviceorientation", (event) => {
    if (typeof event.webkitCompassHeading === "number") {
      state.heading = event.webkitCompassHeading;
      renderHud();
    } else if (typeof event.alpha === "number") {
      state.heading = (360 - event.alpha) % 360;
      renderHud();
    }
  });
}

document.addEventListener("keydown", handleKey);
document.addEventListener("click", (event) => {
  const target = event.target.closest(".focusable");
  if (target) activate(target);
});

setInterval(() => {
  if (state.demo) {
    state.demoTick += 1;
    state.heading = (state.heading + 2) % 360;
    renderHud();
  }
}, 1000);

render();
initLocation();
initHeading();
