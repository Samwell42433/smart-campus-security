const axios = require("axios");
const sensors = require("./data/sensors");
const express = require("express");
const { client, database } = require("./database");

const app = express();

const PORT = 3001;
const faultySensors = new Set();
let corruptedSensorId = null;

// Function to get a random sensor from the sensors array
function getRandomSensor() {

    const randomIndex = Math.floor(Math.random() * sensors.length);

    return sensors[randomIndex];

}
//Debugging console msg
app.get("/", (req, res) => {
    res.send("Sensor Simulator Service");
});
// endpoint to simulate a sensor reading and send it 
// to the ingestion service as a POST
app.get("/sensor", async (req, res) => {

    const sensor = getRandomSensor();

    const reading = generateReading(sensor);

    try {

        await axios.post(
            process.env.INGESTION_URL,
            reading
        );

        console.log("Reading accepted.");

    } catch (error) {

        console.log("Reading rejected.");

    }

    res.json(reading);

});

//endpoint to resolve faulty sensors/critical events
app.post("/sensor/:sensorId/resolve", (req, res) => {

    const sensorId = req.params.sensorId;

    if (!faultySensors.has(sensorId)) {

        return res.status(404).json({
            error: "Sensor is not currently faulty"
        });

    }

    faultySensors.delete(sensorId);

    console.log(
        `Sensor fault resolved: ${sensorId}`
    );

    res.json({
        message: "Sensor fault resolved"
    });

});
//creates simulated payload of sensor readings. Called in /sensor endpoint and in startSensorSimulation
function generateReading(sensor) {

    let value;

    switch (sensor.type) {

        case "fire":
            value = Math.floor(Math.random() * 101);
            break;

        case "water_leak":
            value = Math.random() < 0.05;
            break;

        case "breakin":
            value = Math.random() < 0.1 ? 1 : 0;
            break;

        default:
            value = 0;

    }

    return {
        readingId: Date.now(),
        sensorId: sensor.sensorId,
        sensorType: sensor.type,
        building: sensor.building,
        location: sensor.location,
        value: value,
        timestamp: new Date().toISOString()
    };

}

function generateStatus(sensor) {

    return {
        sensorId: sensor.sensorId,
        timestamp: new Date().toISOString()
    };

}
// Function to start the sensor simulation
// Loops every 5 seconds.
// Sensor readings are generated on each cycle, while sensor status
// updates are sent every 60 seconds.
async function startSensorSimulation() {

    // Send initial status immediately for all non-faulty sensors
    for (const sensor of sensors) {

        if (faultySensors.has(sensor.sensorId)) {
            continue;
        }

        try {
            const status = generateStatus(sensor);

            await axios.post(
                "http://sensor-ingestion:3002/status",
                status
            );

            console.log(
                `Status sent: ${sensor.sensorId}`
            );

        } catch (error) {
            console.log(
                `Status failed: ${sensor.sensorId}`
            );
        }
    }

    let lastStatusTime = Date.now();

    setInterval(async () => {

        // Send status from all non-faulty sensors every 60 seconds
        if (Date.now() - lastStatusTime >= 60000) {

            for (const sensor of sensors) {

                if (faultySensors.has(sensor.sensorId)) {
                    continue;
                }

                try {
                    const status = generateStatus(sensor);

                    await axios.post(
                        "http://sensor-ingestion:3002/status",
                        status
                    );

                    console.log(
                        `Status sent: ${sensor.sensorId}`
                    );

                } catch (error) {
                    console.log(
                        `Status failed: ${sensor.sensorId}`
                    );
                }
            }

            lastStatusTime = Date.now();
        }

        // Generate one reading every 5 seconds
        const sensor = getRandomSensor();

        // Faulty sensors send neither readings nor status
        if (faultySensors.has(sensor.sensorId)) {

            console.log(
                `Sensor fault: ${sensor.sensorId} is not sending`
            );

            return;
        }

        const reading = generateReading(sensor);

        // Simulate corrupted sensor data
        if (sensor.sensorId === corruptedSensorId) {

            reading.value = "CORRUPTED_DATA";

            console.log(
                `Corrupted reading: ${sensor.sensorId}`
            );
        }

        try {

            await axios.post(
                process.env.INGESTION_URL,
                reading
            );

            console.log(
                `Reading sent: ${reading.sensorId} = ${reading.value}`
            );

        } catch (error) {

            console.log(
                `Reading failed: ${reading.sensorId}`
            );
        }

    }, 5000);
}
// The fault simulation function randomly selects a sensor to become faulty every 60 seconds, up to a maximum of 2 faulty sensors at a time
// Faulty sensors will not send readings or status updates until they are resolved via the /sensor/:sensorId/resolve endpoint.
function startFaultSimulation() {

    setInterval(() => {

        if (faultySensors.size >= 2) {
            return;
        }

        const sensor = getRandomSensor();

        faultySensors.add(sensor.sensorId);

        console.log(
            `Sensor fault generated: ${sensor.sensorId}`
        );

    }, 60000);

}
//starts the server and connects to MongoDB. 
// Also registers sensors in the database if they are not already present.
async function startServer() {

    try {

        await client.connect();

        console.log("Connected to MongoDB");

        const collection = database.collection("sensors");

for (const sensor of sensors) {

    await collection.updateOne(
        {
            sensorId: sensor.sensorId
        },
        {
            $setOnInsert: sensor
        },
        {
            upsert: true
        }
    );

}

console.log("Sensors in database:", await collection.countDocuments());

console.log(`${sensors.length} sensors registered in MongoDB`);
startSensorSimulation();
startFaultSimulation();

app.listen(PORT, () => {
console.log(`Sensor Simulator running on port ${PORT}`);
});

    } catch (error) {

        console.error("MongoDB connection failed:", error);

    }

}

startServer();