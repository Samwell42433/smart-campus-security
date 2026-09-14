const sensors = [];

function generateSensors(type, prefix, count, buildings, locations) {

    for (let i = 1; i <= count; i++) {

        const building = buildings[(i - 1) % buildings.length];
        const location = locations[(i - 1) % locations.length];

        sensors.push({
            sensorId: `${prefix}-${String(i).padStart(3, "0")}`,
            type: type,
            building: building,
            location: location,
        });

    }

}

generateSensors(
    "fire",
    "fire",
    10,
    ["Building A", "Building B", "Building C"],
    ["Ground Floor", "First Floor", "Laboratory", "Corridor"]
);

generateSensors(
    "water_leak",
    "water_leak",
    10,
    ["Building A", "Building B", "Building C"],
    ["Basement", "Ground Floor", "Storage Room"]
);

generateSensors(
    "breakin",
    "breakin",
    10,
    ["Building A", "Building B", "Building C", "Library"],
    ["Main Entrance", "Back Entrance", "Window", "Side Door"]
);

module.exports = sensors;