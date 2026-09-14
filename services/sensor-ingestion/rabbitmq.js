const amqp = require("amqplib");

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost:5672";
const EXCHANGE_NAME = "sensor-readings";
const STATUS_EXCHANGE = "sensor_status";

let connection;
let channel;

async function connectRabbitMQ() {

    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();

    await channel.assertExchange(
        EXCHANGE_NAME,
        "topic",
        { durable: true }
    );

    await channel.assertQueue("fire-detection", { durable: true });
    await channel.assertQueue("water-leak-detection", { durable: true });
    await channel.assertQueue("breakin-detection", { durable: true });

    await channel.bindQueue(
        "fire-detection",
        EXCHANGE_NAME,
        "sensor.fire"
    );

    await channel.bindQueue(
         "water-leak-detection",
        EXCHANGE_NAME,
        "sensor.water_leak"
    );

    await channel.bindQueue(
        "breakin-detection",
        EXCHANGE_NAME,
        "sensor.breakin"
    );

    await channel.assertExchange(
        STATUS_EXCHANGE,
        "topic",
        { durable: true }
    );

    console.log("Connected to RabbitMQ");
}

async function publishReading(reading) {

    const routingKey = `sensor.${reading.sensorType}`;

    channel.publish(
        EXCHANGE_NAME,
        routingKey,
        Buffer.from(JSON.stringify(reading))
    );
}

async function publishStatus(statusEvent) {

    channel.publish(
        STATUS_EXCHANGE,
        statusEvent.eventType,
        Buffer.from(JSON.stringify(statusEvent))
    );

}

module.exports = {
    connectRabbitMQ,
    publishReading,
    publishStatus
};