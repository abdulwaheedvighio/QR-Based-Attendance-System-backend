const haversine = require("haversine-distance");

function calculateDistance(teacherLocation,     ){
    return haversine(
        {lat: teacherLocation.latitude, lon: teacherLocation.longitude },
        {lat: studentLocation.latitude, lon: studentLocation.longitude},
    );  
}
module.exports = {calculateDistance};

