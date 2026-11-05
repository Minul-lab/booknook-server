import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import "dotenv/config";
import cors from 'cors'
import { createRemoteJWKSet, jwtVerify } from "jose";

const app = express();
const PORT = 8000;
app.use(cors())
app.use(express.json())

const client = new MongoClient(
  process.env.MONGODB_URI
);
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ msg: "unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).send({ msg: "unauthorized" });
  }
  const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
  );
  try {
    const { payload } = await jwtVerify(token, JWKS);
    req.user = payload; // <-- this line was missing
    next();
  } catch (error) {
    return res.status(401).send({ msg: "invalid token" });
  }
};

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
const borrowCollection = db.collection("borrow")

await borrowCollection.createIndex({ bookId: 1, email: 1 }, { unique: true });


// Call this only when your application terminates


app.get("/", (req, res) => {
  res.send("Hello from the backend");
});
app.get("/all-books",async (req,res)=>{
  const result =await booksCollection.find().toArray()
  res.send(result)
})
app.get("/latest-books", async (req, res) => {
  const latestBooks = await booksCollection
    .find()
    .sort({ submittedAt: -1 })
    .limit(6)
    .toArray();

  res.send(latestBooks);
});
app.get("/all-books/:id" ,verifyToken, async(req,res)=>{
  const {id} = req.params
  const result = await booksCollection.findOne({_id: new ObjectId(id)})
  res.send(result);
})
app.delete("/all-books/:id", async (req, res) => {
  const { id } = req.params;
  const result = await booksCollection.deleteOne({ _id: new ObjectId(id) });
  res.send(result);
});
// my-books collection
app.get("/my-books/:email",verifyToken, async (req, res) => {
  const { email } = req.params;

  const result = await booksCollection
    .find({ "addedBy.email": email })
    .toArray();

  res.send(result);
});
// add-book api
app.post("/add-book",verifyToken,async(req,res) => {
  const data = req.body
  const result = await booksCollection.insertOne(data);
  
  res.send(result)
  console.log(result)
})
// post api of borrow book
app.post("/borrow", verifyToken, async (req, res) => {
  const { bookId, title, image, borrowedAt } = req.body;
  const email = req.user.email; // from the verified token, not from the client

  if (!ObjectId.isValid(bookId)) {
    return res.status(400).send({ msg: "Invalid book id" });
  }

  // 1. Already borrowed?
  const alreadyBorrowed = await borrowCollection.findOne({ bookId, email });
  if (alreadyBorrowed) {
    return res.status(409).send({ msg: "You already borrowed this book" });
  }

  // 2. Decrease quantity only if copies are still available
  const updateResult = await booksCollection.updateOne(
    { _id: new ObjectId(bookId), quantity: { $gt: 0 } },
    { $inc: { quantity: -1 } },
  );

  if (updateResult.modifiedCount === 0) {
    return res.status(400).send({ msg: "This book is not available" });
  }

  // 3. Save the borrow record
  try {
    const result = await borrowCollection.insertOne({
      bookId,
      title,
      image,
      email,
      borrowedAt,
    });
    res.send(result);
  } catch (error) {
    // Put the copy back if saving the borrow failed
    await booksCollection.updateOne(
      { _id: new ObjectId(bookId) },
      { $inc: { quantity: 1 } },
    );
    res.status(500).send({ msg: "Could not save borrow" });
  }
});
app.put("/all-books/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { title, author, quantity, category, image, description } = req.body;

  const book = await booksCollection.findOne({ _id: new ObjectId(id) });
  if (!book) {
    return res.status(404).send({ msg: "Book not found" });
  }

  // Only the owner can update (token payload should include the email)


  // Only these fields can change; addedBy and submittedAt stay untouched
  await booksCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { title, author, quantity, category, image, description } },
  );

  const updatedBook = await booksCollection.findOne({ _id: new ObjectId(id) });
  res.send(updatedBook);
});
app.get("/borrow/:email",verifyToken,async(req,res)=>{
  const {email} = req.params;
  const result = await borrowCollection.find({email:email}).toArray()
  res.send(result);
})
app.delete("/borrow/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  const borrow = await borrowCollection.findOne({ _id: new ObjectId(id) });
  if (!borrow) {
    return res.status(404).send({ msg: "Borrow not found" });
  }
  if (borrow.email !== req.user.email) {
    return res.status(403).send({ msg: "forbidden" });
  }

  await borrowCollection.deleteOne({ _id: new ObjectId(id) });
  await booksCollection.updateOne(
    { _id: new ObjectId(borrow.bookId) },
    { $inc: { quantity: 1 } },
  );

  res.send({ msg: "Book returned" });
});

app.listen(PORT, () => {
  console.log(`server is running at ${PORT}`);
});

export default app