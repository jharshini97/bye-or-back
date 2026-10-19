import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const databaseName = "byeOrBack";

if (!uri) {
  throw new Error("MONGODB_URI is not defined");
}

const client = new MongoClient(uri);

let database;

export async function connectToDatabase() {
  await client.connect();
  database = client.db(databaseName);
  return database;
}

export function getDatabase() {
  if (!database) {
    throw new Error("Database connection has not been initialized");
  }

  return database;
}

export async function closeDatabaseConnection() {
  await client.close();
  database = undefined;
}
