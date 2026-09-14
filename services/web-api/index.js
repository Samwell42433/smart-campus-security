const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();

const PORT = process.env.PORT || 3003;
const MONGO_URL =
    process.env.MONGO_URL || "mongodb://localhost:27017";
const DB_NAME =
    process.env.DB_NAME || "CampusSecurityDB";

app.use(cors());
app.use(express.json());

let db;


// =========================
// API STATUS
// =========================

app.get("/api/status", async (req, res) => {

    res.json({
        service: "web-api",
        status: "OK"
    });

});


// =========================
// SENSORS
// =========================

app.get("/api/sensors", async (req, res) => {

    try {

        const sensors =
            await db.collection("sensors").aggregate([

                {
                    $lookup: {
                        from: "sensor_readings",
                        let: {
                            sensorId: "$sensorId"
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: [
                                            "$sensorId",
                                            "$$sensorId"
                                        ]
                                    }
                                }
                            },
                            {
                                $sort: {
                                    timestamp: -1
                                }
                            },
                            {
                                $limit: 1
                            }
                        ],
                        as: "latestReading"
                    }
                },

                {
                    $set: {
                        lastReading: {
                            $arrayElemAt: [
                                "$latestReading.value",
                                0
                            ]
                        },
                        lastReadingTime: {
                            $arrayElemAt: [
                                "$latestReading.timestamp",
                                0
                            ]
                        }
                    }
                },

                {
                    $project: {
                        latestReading: 0
                    }
                }

            ]).toArray();


        const result = sensors.map(sensor => ({

            ...sensor,

            status: sensor.status || "active"

        }));


        res.json(result);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Failed to retrieve sensors"
        });

    }

});


// =========================
// ACTIVE SENSOR COUNT
// =========================

app.get("/api/sensors/active/count", async (req, res) => {

    try {

        const total =
            await db.collection("sensors")
                .countDocuments({});


        const inactive =
            await db.collection("sensors")
                .countDocuments({
                    status: "inactive"
                });


        const count =
            total - inactive;


        res.json({
            count
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Failed to retrieve active sensor count"
        });

    }

});


// =========================
// INACTIVE SENSOR COUNT
// =========================

app.get("/api/sensors/inactive/count", async (req, res) => {

    try {

        const count =
            await db.collection("sensors")
                .countDocuments({
                    status: "inactive"
                });


        res.json({
            count
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Failed to retrieve inactive sensor count"
        });

    }

});

app.get("/api/sensors/count", async (req, res) => {

    try {

        const count =
            await db.collection("sensors")
                .countDocuments({
                    type: req.query.type
                });

        res.json({
            count: count
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Failed to retrieve sensor count"
        });
    }
});

// =========================
// READINGS
// =========================

app.get("/api/readings", async (req, res) => {

    try {

        const {
            sensorId,
            type,
            building,
            minValue,
            maxValue,
            from,
            to,
            page = 1,
            limit = 50
        } = req.query;


        const filter = {};


        if (sensorId) {

            filter.sensorId = {
                $regex: sensorId,
                $options: "i"
            };

        }


        if (type) {

            filter.sensorType = type;

        }


        if (building) {

            filter.building = building;

        }


        if (
            minValue !== undefined ||
            maxValue !== undefined
        ) {

            filter.value = {};


            if (minValue !== undefined) {

                filter.value.$gte =
                    Number(minValue);

            }


            if (maxValue !== undefined) {

                filter.value.$lte =
                    Number(maxValue);

            }

        }


        if (from || to) {

            filter.timestamp = {};


            if (from) {

                filter.timestamp.$gte =
                    new Date(from).toISOString();

            }


            if (to) {

                filter.timestamp.$lte =
                    new Date(to).toISOString();

            }

        }


        const currentPage =
            Math.max(Number(page), 1);


        const pageSize =
            Math.min(
                Math.max(Number(limit), 1),
                200
            );


        const skip =
            (currentPage - 1) * pageSize;


        const readings =
            await db.collection("sensor_readings")
                .find(filter)
                .sort({
                    timestamp: -1
                })
                .skip(skip)
                .limit(pageSize)
                .toArray();


        const total =
            await db.collection("sensor_readings")
                .countDocuments(filter);


        res.json({

            readings,

            pagination: {
                page: currentPage,
                limit: pageSize,
                total,
                totalPages:
                    Math.ceil(total / pageSize)
            }

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Failed to retrieve readings"
        });

    }

});


// =========================
// ALARMS
// =========================

app.get("/api/alarms", async (req, res) => {

    try {

        const {
            sensorId,
            alarmType,
            building,
            status,
            from,
            to,
            page = 1,
            limit = 50
        } = req.query;


        const filter = {};


        if (sensorId) {

            filter.sensorId = {
                $regex: sensorId,
                $options: "i"
            };

        }


        if (alarmType) {

            filter.alarmType =
                alarmType;

        }


        if (building) {

            filter.building = {
                $regex: building,
                $options: "i"
            };

        }


        if (status) {

            filter.status =
                status;

        }


        if (from || to) {

            filter.timestamp = {};


            if (from) {

                filter.timestamp.$gte =
                    from;

            }


            if (to) {

                filter.timestamp.$lte =
                    to;

            }

        }


        const currentPage =
            Math.max(Number(page), 1);


        const pageSize =
            Math.min(
                Math.max(Number(limit), 1),
                200
            );


        const skip =
            (currentPage - 1) * pageSize;


        const alarms =
            await db.collection("alarms")
                .find(filter)
                .sort({
                    timestamp: -1
                })
                .skip(skip)
                .limit(pageSize)
                .toArray();


        const total =
            await db.collection("alarms")
                .countDocuments(filter);


        res.json({

            alarms,

            pagination: {
                page: currentPage,
                limit: pageSize,
                total,
                totalPages:
                    Math.ceil(total / pageSize)
            }

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Failed to retrieve alarms"
        });

    }

});


// =========================
// ACTIVE ALARM COUNT
// =========================

app.get("/api/alarms/count", async (req, res) => {

    try {

        const filter = {};


        if (req.query.status) {

            filter.status =
                req.query.status;

        }


        const count =
            await db.collection("alarms")
                .countDocuments(filter);


        res.json({
            count
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Failed to retrieve alarm count"
        });

    }

});


// =========================
// RESOLVE ALARM
// =========================

app.patch("/api/alarms/:id/resolve", async (req, res) => {

    try {

        const { ObjectId } =
            require("mongodb");


        const result =
            await db.collection("alarms").updateOne(

                {
                    _id:
                        new ObjectId(req.params.id)
                },

                {
                    $set: {
                        status: "resolved",
                        resolvedAt:
                            new Date().toISOString()
                    }
                }

            );


        if (result.matchedCount === 0) {

            return res.status(404).json({
                error: "Alarm not found"
            });

        }


        res.json({
            message:
                "Alarm resolved successfully"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Failed to resolve alarm"
        });

    }

});


// =========================
// CRITICAL EVENTS
// =========================

app.get("/api/critical-events", async (req, res) => {

    try {

        const events =
            await db.collection("critical_events")
                .find({})
                .sort({
                    timestamp: -1
                })
                .toArray();


        res.json(events);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Failed to retrieve critical events"
        });

    }

});


// =========================
// CRITICAL EVENT COUNT
// =========================

app.get("/api/critical-events/count", async (req, res) => {

    try {

        const count =
            await db.collection("critical_events")
                .countDocuments({});


        res.json({
            count
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Failed to retrieve critical event count"
        });

    }

});

// =========================
// RESOLVE CRITICAL EVENT
// =========================

app.patch("/api/critical-events/:id/resolve", async (req, res) => {

    try {

        const { ObjectId } = require("mongodb");

        const event =
            await db.collection("critical_events")
                .findOne({
                    _id: new ObjectId(req.params.id)
                });

        if (!event) {

            return res.status(404).json({
                error: "Critical event not found"
            });

        }

        // Remove sensor from faulty sensors
        await fetch(
            `http://sensor-simulator:3001/sensor/${event.sensorId}/resolve`,
            {
                method: "POST"
            }
        );

        // Set sensor back to active
        await db.collection("sensors").updateOne(
            {
                sensorId: event.sensorId
            },
            {
                $set: {
                    status: "active"
                }
            }
        );

        // Remove resolved critical event
        await db.collection("critical_events")
            .deleteOne({
                _id: new ObjectId(req.params.id)
            });

        res.json({
            message: "Critical event resolved successfully"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Failed to resolve critical event"
        });

    }

});


// =========================
// START SERVER
// =========================

async function startServer() {

    const client =
        new MongoClient(MONGO_URL);


    await client.connect();

    console.log(
        "Connected to MongoDB"
    );


    db =
        client.db(DB_NAME);


    app.listen(PORT, () => {

        console.log(
            `Web API running on port ${PORT}`
        );

    });

}


startServer().catch((error) => {

    console.error(
        "Failed to start Web API:",
        error
    );

    process.exit(1);

});