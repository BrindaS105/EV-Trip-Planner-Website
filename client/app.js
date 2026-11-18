mapboxgl.accessToken = "Your Token";
let map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/dark-v11',
  center: [77, 15],
  zoom: 5
});

// GLOBAL VARIABLES
let startCoordsGlobal;
let endCoordsGlobal;
let stopCoordGlobal;

// 🌍 Convert city → coordinates
async function getCoordinates(place) {
  let res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${place}.json?access_token=${mapboxgl.accessToken}`
  );

  let data = await res.json();

  if (!data.features.length) {
    throw new Error("Location not found");
  }

  return data.features[0].center;
}

// 🚀 MAIN FUNCTION
async function planTrip() {

  try {
    document.getElementById("loader").classList.remove("hidden");
    document.getElementById("results").innerHTML = "";

    let startInput = document.getElementById("start").value;
    let endInput = document.getElementById("end").value;
    let battery = document.getElementById("battery").value;

    startCoordsGlobal = await getCoordinates(startInput);
    endCoordsGlobal = await getCoordinates(endInput);

    let start = startCoordsGlobal.join(",");
    let end = endCoordsGlobal.join(",");

    let res = await fetch("http://localhost:5000/api/trip", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ start, end, battery })
    });

    let data = await res.json();

    stopCoordGlobal = data.stopCoord;

    drawRoute(data.geometry);

    document.getElementById("loader").classList.add("hidden");

    document.getElementById("results").innerHTML = `
      <div class="card">⚡ ${data.distance?.toFixed(2)} km</div>
      <div class="card">🌡 ${data.temp} °C</div>
      <div class="card">🚗 ${data.speed?.toFixed(2) || 60} km/h</div>
      <div class="card">🔋 ${data.usage?.toFixed(2)} kWh</div>
      <div class="card">
        ${data.chargingNeeded ? "⚡ Charging Required" : "✅ No Charging Needed"}
      </div>
    `;

  } catch (error) {
    console.error(error);
    document.getElementById("loader").classList.add("hidden");
    document.getElementById("results").innerHTML = `
      <div class="card">❌ Error occurred</div>
    `;
  }
}

// 🗺️ DRAW ROUTE
function drawRoute(geometry) {

  if (!geometry) return;

  if (map.getSource("route")) {
    map.removeLayer("route");
    map.removeSource("route");
  }

  map.addSource("route", {
    type: "geojson",
    data: {
      type: "Feature",
      geometry: geometry
    }
  });

  map.addLayer({
    id: "route",
    type: "line",
    source: "route",
    paint: {
      "line-width": 5,
      "line-color": "#00c6ff"
    }
  });

  const coords = geometry.coordinates;

  // 🔥 FIXED BOUNDS
  let bounds = coords.reduce(
    (b, coord) => b.extend(coord),
    new mapboxgl.LngLatBounds(coords[0], coords[0])
  );

  bounds.extend(startCoordsGlobal);
  bounds.extend(endCoordsGlobal);

  if (stopCoordGlobal) bounds.extend(stopCoordGlobal);

  map.fitBounds(bounds, {
    padding: {
      top: 100,
      bottom: 120,
      left: 100,
      right: 100
    }
  });

  // REMOVE OLD MARKERS
  if (window.startMarker) window.startMarker.remove();
  if (window.endMarker) window.endMarker.remove();
  if (window.chargeMarker) window.chargeMarker.remove();

  // START
  window.startMarker = new mapboxgl.Marker({ color: "green", scale: 1.2 })
    .setLngLat(startCoordsGlobal)
    .setPopup(new mapboxgl.Popup().setText("Start"))
    .addTo(map);

  // END
  window.endMarker = new mapboxgl.Marker({ color: "red", scale: 1.2 })
    .setLngLat(endCoordsGlobal)
    .setPopup(new mapboxgl.Popup().setText("Destination"))
    .addTo(map);

  // CHARGING
  if (stopCoordGlobal) {
    window.chargeMarker = new mapboxgl.Marker({ color: "yellow", scale: 1.2 })
      .setLngLat(stopCoordGlobal)
      .setPopup(new mapboxgl.Popup().setText("Charging Stop"))
      .addTo(map);
  }
}