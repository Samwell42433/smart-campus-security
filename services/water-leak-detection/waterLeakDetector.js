function isWaterLeak(reading) {

    return (
        reading.sensorType === "water_leak" &&
        reading.value === true
    );
}

module.exports = {
    isWaterLeak
};