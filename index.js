const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 3000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

//middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.iqsr3w7.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const instructorCollection = client.db("lingoDb").collection("instructors");
    const usersCollection = client.db("lingoDb").collection("users");
    const classCollection = client.db("lingoDb").collection("classes");
    const cartCollection = client.db("lingoDb").collection("carts");
    
    //users related api
    app.post('/users', async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
      
    })

    //classes
    app.get('/classes', async (req, res) => {
      const query = {};
      const options = {
        sort:{"student":-1}
      }
      const result = await classCollection.find(query,options).limit(6).toArray();
      res.send(result);
    })
    
    //instructors
    app.get('/instructors', async (req, res) => {
      const result = await instructorCollection.find().toArray();
      res.send(result);
    })


    //cart collection
    app.get('/carts', async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([])
      }
      const query = { email: email }
      const result = await cartCollection.find(query).toArray();
      res.send(result)
    });
    app.post('/carts', async (req, res) => {
      const item = req.body;
      console.log(item);
      const result = await cartCollection.insertOne(item);
      res.send(result);
    })


    app.delete('/carts/:id', async (req, res) => {
      const id=req.params.id
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
   /*  await client.close(); */
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('lingo is running')
})

app.listen(port, () => {
  console.log(`Lingo Bridge is standing on port ${port}`)
})



