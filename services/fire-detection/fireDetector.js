function detectFire(reading) {

    if (reading.sensorType !== "fire") {

        return {
            readingId: reading.readingId,
            sensorId: reading.sensorId,
            alarm: false,
            alarmType: null,
            severity: null,
            timestamp: reading.timestamp
        };

    }

    if (reading.value >= 80) {

        return {
            readingId: reading.readingId,
            sensorId: reading.sensorId,
            alarm: true,
            alarmType: "fire",
            severity: "HIGH",
            timestamp: reading.timestamp
        };

    }

    return {
        readingId: reading.readingId,
        sensorId: reading.sensorId,
        alarm: false,
        alarmType: null,
        severity: null,
        timestamp: reading.timestamp
    };

}

module.exports = detectFire;