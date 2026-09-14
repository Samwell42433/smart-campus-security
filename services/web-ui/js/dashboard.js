async function loadDashboard() {

    try {

        // =========================
        // Total Sensors
        // =========================

        const sensorsResponse =
            await fetch(
                "http://localhost:3003/api/sensors"
            );

        if (!sensorsResponse.ok) {
            throw new Error("Failed to retrieve sensors");
        }

        const sensors =
            await sensorsResponse.json();

        document.getElementById("total-sensors").textContent =
            sensors.length;


        // =========================
        // Active Sensors
        // =========================

        const activeSensorsResponse =
            await fetch(
                "http://localhost:3003/api/sensors/active/count"
            );

        if (!activeSensorsResponse.ok) {
            throw new Error(
                "Failed to retrieve active sensor count"
            );
        }

        const activeSensors =
            await activeSensorsResponse.json();

        document.getElementById("active-sensors").textContent =
            activeSensors.count;


        // =========================
        // Active Alarms
        // =========================

        const alarmsResponse =
            await fetch(
                "http://localhost:3003/api/alarms/count?status=active"
            );

        if (!alarmsResponse.ok) {
            throw new Error(
                "Failed to retrieve active alarm count"
            );
        }

        const alarms =
            await alarmsResponse.json();

        document.getElementById("active-alarms").textContent =
            alarms.count;


        // =========================
        // Critical Events
        // =========================

        const criticalEventsResponse =
            await fetch(
                "http://localhost:3003/api/critical-events/count"
            );

        if (!criticalEventsResponse.ok) {
            throw new Error(
                "Failed to retrieve critical event count"
            );
        }

        const criticalEvents =
            await criticalEventsResponse.json();

        document.getElementById("critical-events").textContent =
            criticalEvents.count;


    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

    }

}

async function loadSensorCounts() {

    try {

        const sensors = [
            {
                type: "fire",
                element: "fire-sensor-count"
            },
            {
                type: "water_leak",
                element: "water-leak-sensor-count"
            },
            {
                type: "breakin",
                element: "breakin-sensor-count"
            }
        ];

        for (const sensor of sensors) {

            const response = await fetch(
                `http://localhost:3003/api/sensors/count?type=${sensor.type}`
            );

            if (!response.ok) {
                throw new Error(
                    `Failed to retrieve ${sensor.type} sensor count`
                );
            }

            const data = await response.json();

            document.getElementById(
                sensor.element
            ).textContent = data.count;
        }

    } catch (error) {

        console.error(
            "Failed to load sensor counts:",
            error
        );
    }
}

// Load dashboard immediately
loadDashboard();

// Load sensor counts immediately
loadSensorCounts();

// Refresh dashboard every 10 seconds
setInterval(
    loadDashboard,
    10000
);