const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;
const admin = require("firebase-admin");

const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


app.use(cors());
app.use(express.json());

// Create a middleware to verify token:

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(403).json({ error: "Forbidden" });
  }
};


// MongoDb Codes
const uri = process.env.MongodbURI;

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

    const servicesCollection = client.db('Education_Services').collection('AllServices');
    const bookedServiceCollection = client.db('Education_Services').collection('bookedServices');
    const usersDataCollection = client.db('Education_Services').collection('usersData');

    app.get('/bookedServices', async (req, res) => {
      try {
        const result = await bookedServiceCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Failed to fetch booked services' });
      }
    })
    app.post('/bookedServices', async (req, res) => {
      const newBookedService = req.body;
      const result = await bookedServiceCollection.insertOne(newBookedService);
      console.log('result', result);
      res.send(result);
    })
    app.post('/user', async (req, res) => {
      const newUser = req.body;
      const result = await usersDataCollection.insertOne(newUser);
      console.log('result', result);
      res.send(result);
    })
    app.put('/user/:email', async (req, res) => {
  const email = req.params.email;
  const updatedData = req.body;
  const query = { email };
  const options = { upsert: true };

  // Check if updatedData contains MongoDB operators (like $inc)
  const containsOperator = Object.keys(updatedData).some(key => key.startsWith('$'));

  // Use updatedData as-is if contains operators, else wrap in $set
  const updateDoc = containsOperator ? updatedData : { $set: updatedData };

  try {
    const result = await usersDataCollection.updateOne(query, updateDoc, options);
    console.log('result', result);
    res.send(result);
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).send({ error: 'Failed to update user data' });
  }
});

    app.get('/allusers', async (req, res) => {
      const result = await usersDataCollection.find().toArray();
      console.log(result);
      res.send(result);
    })
    app.get('/user/:email', async (req, res) => {
      const email = req.params.email;
      const result = await usersDataCollection.findOne({ email });
      console.log(result);
      res.send(result);
    })
    app.get('/allservices', async (req, res) => {
      const result = await servicesCollection.find().toArray();
      console.log(result);
      res.send(result);
    })
    app.get('/services/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await servicesCollection.findOne(query);
      res.send(result);
    })
    app.get('/myservices/:email', verifyFirebaseToken, async (req, res) => {
      const userEmailFromParams = req.params.email;
      const query = { providerEmail: userEmailFromParams };
      const result = await servicesCollection.find(query).toArray();
      res.send(result);
    })
    app.get('/bookedservices/:email', verifyFirebaseToken, async (req, res) => {
      const providerEmailFromParams = req.params.email;
      const query = { studentEmail: providerEmailFromParams };
      const result = await bookedServiceCollection.find(query).toArray();
      console.log('result', result);
      res.send(result);
    })
    app.put('/bookedservices/:email', async (req, res) => {
      const studentEmailFromParams = req.params.email;
      const query = { studentEmail: studentEmailFromParams };
      const options = { upsert: true };
      const updatedData = req.body;
      const updateDoc = {
        $set: updatedData
      }
      const result = await bookedServiceCollection.updateOne(query, updateDoc, options);
      console.log('result', result);
      res.send(result);
    })
    app.get('/servicestodo/:email', verifyFirebaseToken, async (req, res) => {
      const providerEmailFromParams = req.params.email;
      const query = { providerEmail: providerEmailFromParams };
      const result = await bookedServiceCollection.find(query).toArray();
      console.log('result', result);
      res.send(result);
    })
    app.post('/services', async (req, res) => {
      const newService = req.body;
      const result = await servicesCollection.insertOne(newService);
      console.log('result', result);
      res.send(result);
    })
    app.put('/services/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedData = req.body;
      const updateDoc = {
        $set: updatedData
      }
      const result = await servicesCollection.updateOne(query, updateDoc, options);
      res.send(result);
    })
    app.delete('/services/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await servicesCollection.deleteOne(query);
      res.send(result);
    })




    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('server is ready');
});

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});

//everything is good


