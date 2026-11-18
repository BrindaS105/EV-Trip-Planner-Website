import axios from "axios";
import Trip from "../models/Trip.js";

export const createTrip = async (req, res) => {

  try {
    let { start, end } = req.body;

    // 📍 Get Route
    let route = await axios.get(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${start};${end}?geometries=geojson&access_token=${process.env.MAPBOX}`
    );

    let data = route.data.routes[0];

    let distance = data.distance / 1000; // km
    let duration = data.duration / 3600; // hours
    let speed = distance / duration;

    // 🌡 Get Weather
    let coords = data.geometry.coordinates[0];

    let weather = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${coords[1]}&lon=${coords[0]}&appid=${process.env.WEATHER}&units=metric`
    );

    let temp = weather.data.main.temp;

    // 🔋 Battery Calculation
    let usage = distance * 0.15 * (1 - ((25 - temp) * 0.01));
    

    let batteryCapacity = parseFloat(req.body.battery) || 60;

// ⚡ Check if charging needed
let chargingNeeded = usage > batteryCapacity;

// 📍 Find midpoint for stop
let stopCoord = null;

if (chargingNeeded) {
  let coords = data.geometry.coordinates;
  let midIndex = Math.floor(coords.length / 2);
  stopCoord = coords[midIndex];
}

    // 💾 Save to DB
    await Trip.create({ start, end, distance, usage, temp });

    // ✅ Send FULL response
    res.json({
  distance,
  temp,
  speed,
  usage,
  geometry: data.geometry,
  chargingNeeded,
  stopCoord
});

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};