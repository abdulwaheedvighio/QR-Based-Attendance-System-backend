const haversine = require("haversine-distance");

// ✅ Function to calculate distance between two points (in meters)
function calculateDistance(studentLocation, teacherLocation) {
  if (!studentLocation || !teacherLocation) return Infinity;

  const student = {
    lat: studentLocation.latitude,
    lon: studentLocation.longitude,
  };

  const teacher = {
    lat: teacherLocation.latitude,
    lon: teacherLocation.longitude,
  };

  // 📏 Distance in meters
  return haversine(student, teacher);
}

module.exports = { calculateDistance };
