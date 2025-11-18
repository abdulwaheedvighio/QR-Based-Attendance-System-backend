// utils/distance.js
const haversine = require("haversine-distance");
function calculateDistance(studentLocation, teacherLocation, bufferMeters = 0) {
  if (!studentLocation || !teacherLocation) return Infinity;

  const a = { latitude: studentLocation.latitude, longitude: studentLocation.longitude };
  const b = { latitude: teacherLocation.latitude, longitude: teacherLocation.longitude };

  return haversine(a, b) + bufferMeters;
}


module.exports = { calculateDistance };
