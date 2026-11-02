import express from "express";
import { MongoClient } from "mongodb";
import "dotenv/config";
import cors from 'cors'

const app = express();
const PORT = 8000;
app.use(cors())
app.use(express.json())

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
const mongoClient = await connectToMongoDB()
const db = mongoClient.db("BookNook")
const booksCollection = db.collection("books")


// Call this only when your application terminates


app.get("/", (req, res) => {
  res.send("Hello from the backend");
});
app.get("/all-books",async (req,res)=>{
  const result =await booksCollection.find().toArray()
  res.send(result)
})
app.post("/add-book",async(req,res) => {
  const data = req.body
  const result = await booksCollection.insertOne(data);
  
  res.send(result)
  console.log(result)
})

app.listen(PORT, () => {
  console.log(`server is running at ${PORT}`);
});
