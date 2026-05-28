const speedValue = document.querySelector("#speedValue");

let lastPoint = null;
let smoothedSpeedKmh = 0;

function toRad(value) {
  return (value * Math.PI) / 180;
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

function showSpeed(speedKmh) {
  const cleanSpeed = Number.isFinite(speedKmh) ? Math.max(0, speedKmh) : 0;
  smoothedSpeedKmh = smoothedSpeedKmh * 0.65 + cleanSpeed * 0.35;
  speedValue.textContent = Math.round(smoothedSpeedKmh).toString();
}

function speedFromPosition(position) {
  const currentPoint = {
    lat: position.coords.latitude,
    lon: position.coords.longitude,
    time: position.timestamp,
  };

  if (typeof position.coords.speed === "number" && position.coords.speed >= 0) {
    lastPoint = currentPoint;
    return position.coords.speed * 3.6;
  }

  if (!lastPoint) {
    lastPoint = currentPoint;
    return 0;
  }

  const elapsedSeconds = (currentPoint.time - lastPoint.time) / 1000;
  const distance = distanceMeters(lastPoint, currentPoint);
  lastPoint = currentPoint;

  if (elapsedSeconds <= 0 || distance < 1.5) return 0;
  return (distance / elapsedSeconds) * 3.6;
}

if ("geolocation" in navigator) {
  navigator.geolocation.watchPosition(
    (position) => showSpeed(speedFromPosition(position)),
    () => {
      speedValue.textContent = "--";
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 8000,
    },
  );
} else {
  speedValue.textContent = "--";
}
