require("dotenv").config();
const express = require("express");
const { connectRabbitMQ, publishReading } = require("./rabbitmq");
const { client, database } = require("./database");
const processReading = require("./sensorIngestion");
const { startStatusChecker } = require("./status");

const app = express();

app.use(express.json());

const PORT = process.env.PORT;

app.get("/", (req, res) => {

    res.send("Sensor Ingestion Service");

});

app.post("/ingest", async (req, res) => {

    const reading = req.body;

    if (!(await processReading(reading))) {
        return res.status(400).json({
            error: "Invalid sensor reading"
        });

    }

    const collection =
        database.collection("sensor_readings");

    await collection.insertOne(reading);

    await publishReading(reading);

    console.log("Reading received:");
    console.log(reading);

    res.json({
        message: "Reading stored successfully"
    });

});

app.post("/status", async (req, res) => {

    const status = req.body;

    await database
    .collection("sensor_status")
    .insertOne(status);

    await database
         .collection("sensors")
         .updateOne(
              {
                  sensorId: status.sensorId
              },
              {
                  $set: {
                     status: "active"
                 }
              }
         );

    console.log(
    `Status received: ${status.sensorId}`
    );

    res.json({
        message: "Status stored successfully"
    });

});

async function startServer() {
    try {

        await client.connect();

        console.log("Connected to MongoDB");

        await connectRabbitMQ();

        startStatusChecker();

        app.listen(PORT, () => {
            console.log(
                `Sensor Ingestion Service running on port ${PORT}`
            );
        });
    } catch (error) {
        console.error(error);
    }
}

startServer();