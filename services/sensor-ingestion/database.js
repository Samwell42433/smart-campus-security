const { MongoClient } = require("mongodb");

const url = process.env.MONGO_URL || "mongodb://localhost:27017";

const client = new MongoClient(url);

const database = client.db("CampusSecurityDB");

module.exports = {
    client,
    database
};