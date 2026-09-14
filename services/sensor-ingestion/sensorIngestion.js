const { database } = require("./database");

async function processReading(reading) {

    // Validate required fields
    if (!reading.readingId) return false;
    if (!reading.sensorId) return false;
    if (!reading.sensorType) return false;
    if (!reading.building) return false;
    if (!reading.location) return false;
    if (reading.value === undefined) return false;
    if (!reading.timestamp) return false;

    // Check that the sensor exists
    const collection = database.collection("sensors");

    const sensor = await collection.findOne({
        sensorId: reading.sensorId
    });

    if (!sensor) {
        return false;
    }

    return true;

}

module.exports = processReading;