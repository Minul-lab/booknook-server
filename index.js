import express from "express";
import { MongoClient } from "mongodb";
import "dotenv/config";

const app = express();
const PORT = 8000;

const client = new MongoClient(
  process.env.MONGODB_URI
);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

// Call this only when your application terminates

app.get("/", (req, res) => {
  res.send("Hello from the backend");
});

app.listen(PORT, () => {
  console.log(`server is running at ${PORT}`);
});
