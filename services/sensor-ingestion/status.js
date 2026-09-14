const { database } = require("./database");
const { publishStatus } = require("./rabbitmq");

async function checkStatus() {

    console.log("Checking sensor status...");

    const sensors =
        await database.collection("sensors").find({}).toArray();

    const statusMessages =
        database.collection("sensor_status");

    for (const sensor of sensors) {

        const lastStatus =
            await statusMessages.findOne(
                {
                    sensorId: sensor.sensorId
                },
                {
                    sort: {
                        timestamp: -1
                    }
                }
            );

        if (!lastStatus) {

            await publishStatus({
                eventType: "sensor_inactive",
                sensorId: sensor.sensorId,
                timestamp: new Date().toISOString()
            });

            continue;

        }

        const lastStatusTime =
            new Date(lastStatus.timestamp).getTime();

        const timeSinceLastStatus =
            Date.now() - lastStatusTime;

        if (timeSinceLastStatus > 300000) {

            await publishStatus({
                eventType: "sensor_inactive",
                sensorId: sensor.sensorId,
                timestamp: new Date().toISOString()
            });

        }

    }

}

function startStatusChecker() {

    setInterval(
        checkStatus,
        10000
    );

}

module.exports = {
    startStatusChecker
};