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
const verifyToken = async(req,res,next)=>{
  const authHeader = req.headers.authorization
  if(!authHeader){
    return res.status(401).send({msg:"uauthorized"})
  }
  const token = authHeader.split(" ")[1]
  if(!token){
    return res.status(401).send({ msg: "uauthorized" });
  }
  const JWKS = createRemoteJWKSet(
    new URL("http://localhost:3000/api/auth/jwks"),
  );
  try{
      const { payload } = await jwtVerify(token, JWKS)
  console.log(payload)
 
  next()
  } catch(error){
    return res.status(500).send({msg:"server error"})
  }
}

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
app.post("/borrow",async(req,res) =>{
  const data = req.body
  const result = await borrowCollection.insertOne(data)
  res.send(result)
})
app.get("/borrow/:email",async(req,res)=>{
  const {email} = req.params;
  const result = await borrowCollection.find({email:email}).toArray()
  res.send(result);
})

app.listen(PORT, () => {
  console.log(`server is running at ${PORT}`);
});
