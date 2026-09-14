const amqp = require("amqplib");

const { isWaterLeak } =
    require("./waterLeakDetector");

    const RABBITMQ_URL =
    process.env.RABBITMQ_URL ||
    "amqp://localhost:5672";

const READING_QUEUE =
    "water-leak-detection";

const ALARM_EXCHANGE =
    "alarms";

async function startService() {

    const connection =
        await amqp.connect(RABBITMQ_URL);

    const channel =
        await connection.createChannel();

    await channel.assertQueue(
        READING_QUEUE,
        {
            durable: true
        }
    );

    await channel.assertExchange(
        ALARM_EXCHANGE,
        "topic",
        {
            durable: true
        }
    );

    console.log(
        "Water Leak Detection Service running"
    );

    channel.consume(
        READING_QUEUE,
        (message) => {

            if (!message) {
                return;
            }

            const reading =
                JSON.parse(
                    message.content.toString()
                );

            console.log(
                `Water leak reading: ${reading.sensorId} = ${reading.value}`
            );

            if (isWaterLeak(reading)) {

                const alarm = {

                    alarmType: "water_leak",

                    sensorId:
                        reading.sensorId,

                    building:
                        reading.building,

                    location:
                        reading.location,

                    value:
                        reading.value,

                    timestamp:
                        new Date().toISOString()

                };

                channel.publish(
                    ALARM_EXCHANGE,
                    "alarm.water_leak",
                    Buffer.from(
                        JSON.stringify(alarm)
                    )
                );

                console.log(
                    "WATER LEAK ALARM SENT:"
                );

                console.log(alarm);
            }

            channel.ack(message);

        }
    );
}

startService().catch((error) => {

    console.error(
        "Water Leak Detection Service failed:",
        error
    );

});