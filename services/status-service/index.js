const amqp = require("amqplib");
const { MongoClient } = require("mongodb");

const RABBITMQ_URL =
    process.env.RABBITMQ_URL || "amqp://localhost:5672";

const MONGO_URL =
    process.env.MONGO_URL || "mongodb://localhost:27017";

const DB_NAME =
    process.env.DB_NAME || "CampusSecurityDB";

const STATUS_EXCHANGE = "sensor_status";
const QUEUE_NAME = "sensor_status";

async function startService() {

    const mongoClient = new MongoClient(MONGO_URL);

    await mongoClient.connect();

    console.log("Connected to MongoDB");

    const database =
        mongoClient.db(DB_NAME);

    const connection =
        await amqp.connect(RABBITMQ_URL);

    const channel =
        await connection.createChannel();

    await channel.assertExchange(
        STATUS_EXCHANGE,
        "topic",
        { durable: true }
    );

    await channel.assertQueue(
        QUEUE_NAME,
        { durable: true }
    );

    await channel.bindQueue(
        QUEUE_NAME,
        STATUS_EXCHANGE,
        "sensor_inactive"
    );

    console.log("Status Service running");

    channel.consume(QUEUE_NAME, async (message) => {

    if (!message) {
        return;
    }

    try {

        const statusEvent =
            JSON.parse(message.content.toString());

        const sensorsCollection =
            database.collection("sensors");

        const sensor =
            await sensorsCollection.findOne({
                sensorId: statusEvent.sensorId
            });

        if (!sensor) {

            console.log(
                `Sensor ${statusEvent.sensorId} not found`
            );

            channel.ack(message);
            return;
        }

        const latestStatus =
            await database
                .collection("sensor_status")
                .findOne(
                    {
                        sensorId: sensor.sensorId
                    },
                    {
                        sort: {
                            timestamp: -1
                        }
                    }
                );

        if (
            latestStatus &&
            new Date(latestStatus.timestamp) > new Date(statusEvent.timestamp)
        ) {
            console.log(
                `Ignoring stale inactivity event for ${sensor.sensorId}`
            );

            channel.ack(message);
            return;
        }

        const existingEvent =
            await database
                .collection("critical_events")
                .findOne({
                    sensorId: sensor.sensorId
                });

        if (existingEvent) {
             channel.ack(message);
             return;
        }

        await sensorsCollection.updateOne(
             {
                  sensorId: sensor.sensorId
            },
            {
                  $set: {
                      status: "inactive"
                  }
              }
        );

        const lastReading =
            await database
                .collection("sensor_readings")
                .findOne(
                    {
                        sensorId: sensor.sensorId
                    },
                    {
                        sort: {
                            timestamp: -1
                        }
                    }
                );

        await database
            .collection("critical_events")
            .insertOne({
                sensorId: sensor.sensorId,

                lastReadingTime:
                    lastReading
                        ? lastReading.timestamp
                        : null,

                timestamp: statusEvent.timestamp
            });

        console.log(
            `Critical event created for ${sensor.sensorId}`
        );

        channel.ack(message);

    } catch (error) {

        console.error(
            "Error processing status event:",
            error
        );

        channel.nack(message, false, true);

    }

});

}

startService().catch((error) => {

    console.error(
        "Status Service failed:",
        error
    );

});