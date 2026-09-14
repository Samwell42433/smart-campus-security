const amqp = require("amqplib");
const { MongoClient } = require("mongodb");

const RABBITMQ_URL =
    process.env.RABBITMQ_URL || "amqp://localhost:5672";

const MONGO_URL =
    process.env.MONGO_URL || "mongodb://localhost:27017";

const DB_NAME =
    process.env.DB_NAME || "CampusSecurityDB";

const ALARM_EXCHANGE = "alarms";
const QUEUE_NAME = "alarms";

async function startService() {

    const mongoClient = new MongoClient(MONGO_URL);

    await mongoClient.connect();

    const db = mongoClient.db(DB_NAME);

    console.log("Connected to MongoDB");

    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertExchange(
        ALARM_EXCHANGE,
        "topic",
        { durable: true }
    );

    await channel.assertQueue(QUEUE_NAME, {
        durable: true
    });

    await channel.bindQueue(
        QUEUE_NAME,
        ALARM_EXCHANGE,
        "alarm.*"
    );

    console.log("Alarm Service running");

    channel.consume(QUEUE_NAME, async (message) => {

        if (!message) {
            return;
        }

        try {

            const alarm = JSON.parse(
                message.content.toString()
            );

            console.log("ALARM RECEIVED:");
            console.log(alarm);

            await db.collection("alarms").insertOne({
                alarmType: alarm.alarmType,
                sensorId: alarm.sensorId,
                building: alarm.building,
                location: alarm.location,
                value: alarm.value,
                timestamp: alarm.timestamp,
                status: "active"
            });

            console.log("Alarm stored in MongoDB");

            channel.ack(message);

        } catch (error) {

            console.error("Failed to process alarm:", error);

            channel.nack(message, false, true);
        }

    });
}

startService().catch((error) => {

    console.error("Alarm Service failed:", error);

});