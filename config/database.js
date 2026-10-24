const { MongoClient } = require("mongodb");
require("dotenv").config();

const requiredEnvironmentVariables = ["DB_USER", "DB_PASS", "DB_NAME"];

function getDatabaseConfiguration() {
  const missingVariables = requiredEnvironmentVariables.filter(
    (variable) => !process.env[variable]
  );

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing required database environment variables: ${missingVariables.join(", ")}`
    );
  }

  const username = encodeURIComponent(process.env.DB_USER);
  const password = encodeURIComponent(process.env.DB_PASS);
  const host = process.env.DB_HOST || "cluster0.pihhew7.mongodb.net";
  const uri = `mongodb+srv://${username}:${password}@${host}/?retryWrites=true&w=majority&appName=Cluster0`;

  return {
    name: process.env.DB_NAME,
    uri
  };
}

const configuration = getDatabaseConfiguration();
const client = new MongoClient(configuration.uri);
const database = client.db(configuration.name);

async function connectToDatabase() {
  await client.connect();
  await database.command({ ping: 1 });
  return database;
}

function getCollections() {
  return {
    coursesCollection: database.collection("courses"),
    enrollmentsCollection: database.collection("enrollments")
  };
}

async function closeDatabaseConnection() {
  await client.close();
}

module.exports = {
  closeDatabaseConnection,
  connectToDatabase,
  getCollections
};
