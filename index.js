const express = require('express');
const app = express();
const cors = require('cors');
 const jwt = require('jsonwebtoken'); 
require('dotenv').config()
const port = process.env.PORT || 3000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

//middleware
app.use(cors());
app.use(express.json());

 const verifyJWT = (req, res, next) => {
   const authorization = req.headers.authorization;
   console.log(authorization)
  if (!authorization) {
    return res.status(401).send({error:true,massage:'unauthorize access'})
  }
  //bearer token
   const token = authorization.split(' ')[1];
   console.log(token)

   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    
     if (err) {
      console.log(err)
      return res.status(401).send({ error: true, massage: 'unauthorize access2' })
    }
    req.decoded = decoded;
    next();
  })
} 



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
   /*  await client.connect();/* */ 
 
    const instructorCollection = client.db("lingoDb").collection("instructors");
    const usersCollection = client.db("lingoDb").collection("users");
    const classCollection = client.db("lingoDb").collection("classes");
    const cartCollection = client.db("lingoDb").collection("carts");

  app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h'
      })
      res.send({token})
  })
    //
    const verifyAdmin = async(req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await usersCollection.findOne(query);
      if (user?.role !== 'admin') {
        return res.status(403).send({error:true,massage:'forbidden access'})
      }
      next()
    }
     
    //users related api
    app.get('/users',verifyJWT,verifyAdmin,async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result)
    })

    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existingUser = await usersCollection.findOne(query);
      console.log('existingUser',existingUser)
      if (existingUser) {
        return res.send({message:'user already exist'})
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
      
    })

    app.get('/instructorsList', async (req, res) => {
      const query = { role: 'instructor' };
    
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    app.get('/users/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      if (req.decoded.email !== email) {
        return res.send({admin:false})
      }
      const query = { email: email }
      const user = await usersCollection.findOne(query);
      const result = { admin: user?.role === 'admin' }
      res.send(result);
    })

    //instructor
    app.get('/users/instructor/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      if (req.decoded.email !== email) {
        return res.send({instructor:false})
      }
      const query = { email: email }
      const user = await usersCollection.findOne(query);
      const result = { instructor: user?.role === 'instructor' }
      res.send(result);
    })
 


    //admin patch
    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role:'admin'
        }
      }
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result)
    })

    //instructor patch
    app.patch('/users/instructor/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role:'instructor'
        }
      }
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result)
    })

    //make approve
    app.patch('/classes/approve/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status:'approve'
        }
      }
      const result = await classCollection.updateOne(filter, updateDoc);
      res.send(result)
    })

    // make deny
    app.patch('/users/deny/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status:'deny'
        }
      }
      const result = await classCollection.updateOne(filter, updateDoc);
      res.send(result)
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

    //my class for admin page

    app.get('/manageClasses', async (req, res) => {
      const query = { status: 'pending' };
    
      const result = await classCollection.find(query).toArray();
      res.send(result);
    });
     

    //my class for instructor page
    app.get('/myClass', async (req, res) => {
      console.log(req.query.email) 
      let query = {}; 
       if (req.query?.email) {
         query = {email:req.query.email}
       } 
      const cursor = classCollection.find(query);
   /*    sortBy({createAt:1}) */
       const result = await cursor.toArray();
        res.send(result); 
    /*  console.log(result);  */
       
    }) 
     

    app.post('/classes', async (req, res) => {
      const item = req.body;
      console.log(item);
      const result = await classCollection.insertOne(item);
      res.send(result);
    })

    
    //instructors
    app.get('/instructors', async (req, res) => {
      const result = await instructorCollection.find().toArray();
      res.send(result);
    })

 
     


    //cart collection
    app.get('/carts', verifyJWT, async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([])
      }
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res.status(403).send({error:true,massage:'forbidden access'})
      }
      const query = { email: email }
      const result = await cartCollection.find(query).toArray();
      res.send(result)
    }); 

   /*  app.get('/carts', async(req, res) => {
      const result = await cartCollection.find().toArray();
      res.send(result)
    }); 
 */
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
 /*    await client.db("admin").command({ ping: 1 }); */
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
   /*  await client.close(); */
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('lingoBridge is running')
})

app.listen(port, () => {
  console.log(`Lingo Bridge is standing on port ${port}`)
})



