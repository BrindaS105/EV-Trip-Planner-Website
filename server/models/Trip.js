import mongoose from "mongoose";
const TripSchema = new mongoose.Schema({
  start: String,
  end: String,
  distance: Number
});
export default mongoose.model("Trip", TripSchema);
