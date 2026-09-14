const amqp = require("amqplib");

const RABBITMQ_URL =
    process.env.RABBITMQ_URL || "amqp://localhost:5672";

const READING_QUEUE = "fire-detection";
const ALARM_EXCHANGE = "alarms";

async function startService() {

    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertQueue(READING_QUEUE, {
        durable: true
    });

    await channel.assertExchange(
        ALARM_EXCHANGE,
        "topic",
        { durable: true }
    );

    console.log("Fire Detection Service running");

    channel.consume(READING_QUEUE, (message) => {

        if (!message) {
            return;
        }

        const reading = JSON.parse(message.content.toString());

        console.log(
            `Fire reading: ${reading.sensorId} = ${reading.value}`
        );

        if (reading.value > 80) {

            const alarm = {
                alarmType: "fire",
                sensorId: reading.sensorId,
                building: reading.building,
                location: reading.location,
                value: reading.value,
                timestamp: new Date().toISOString()
            };

            channel.publish(
                ALARM_EXCHANGE,
                "alarm.fire",
                Buffer.from(JSON.stringify(alarm))
            );

            console.log("FIRE ALARM SENT:");
            console.log(alarm);
        }

        channel.ack(message);

    });
}

startService().catch((error) => {

    console.error("Fire Detection Service failed:", error);

});