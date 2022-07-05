const express = require('express')
const app = express()
const admin = require("firebase-admin");
const ObjectId = require('mongodb').ObjectId;
const cors = require('cors')
require('dotenv').config()

const { MongoClient, ServerApiVersion } = require('mongodb');

const { initializeApp } = require('firebase-admin/app')
const port = process.env.PORT || 5000



const serviceAccount = require("./doctors-portal-c5857-6391e11710bf.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
app.use(cors())
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.es376.mongodb.net/?retryWrites=true&w=majority`;

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.t0fgxph.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1});

async function verifyToken(req, res, next){
      if(req.headers?.authorization?.startsWith('Bearer ')){
        const token = req.headers.authorization.split(' ')[1]


        try{
          const decodedUser = await admin.auth().verifyIdToken(token)
          req.decodedEmail = decodedUser.email;
      }
      catch{

      }
      }

  next()
}

async function run() {
  try {
    await client.connect();
    const database = client.db("doctors_portal")
    const appointmentsCollection = database.collection("appointments")
    const usersCollection = database.collection("users")

    app.get('/appointments', verifyToken, async(req, res) => {
      const email = req.query.email;
      const date = new Date(req.query.date).toDateString()
      const query = {email: email, date: date}
      const cursor = appointmentsCollection.find(query)
      const appointments = await cursor.toArray()
      res.json(appointments)
    })
    app.get('/appointment', async(req, res) => {
      const email = req.query.email;
      const query = {email: email}
      const cursor = appointmentsCollection.find(query)
      const appointment = await cursor.toArray()
      res.json(appointment)
    })

    app.get('/allAppointments', async(req, res) => {
      const cursor = appointmentsCollection.find({})
      const result = await cursor.toArray()
      // console.log(result)
      res.json(result)
    })

    app.post('/appointments', async(req, res) => {
      const appointment = req.body;
      const result = await appointmentsCollection.insertOne(appointment)
      // console.log(result);
      res.json(result)
    })

    app.post('/users', async(req, res) => {
        const user = req.body;
        const result = await usersCollection.insertOne(user)
        // console.log(result)
        res.json(result)
    })

  app.get('/users/:email', async(req, res) => {
    const email = req.params.email;
    const query = {email: email};
    const user = await usersCollection.findOne(query)

    let isAdmin = false;
    if(user?.role === 'admin'){
      isAdmin = true;
    }
    res.json({admin : isAdmin})

  })
    app.put('/users', async(req, res) => {
      const user = req.body;
      // console.log(user)
      const filter = {email: user.email};
      const options = {upsert: true};
      const updateDoc = {$set: user};
      const result = await usersCollection.updateOne(filter, updateDoc, options)
      res.json(result)
    })

    app.put('/users/admin',verifyToken, async(req, res) => {
      const user = req.body;
      const requester = req.decodedEmail;
      if(requester){
        const requesterAccount = await usersCollection.findOne({email: requester})
        if(requesterAccount.role === 'admin'){
          // console.log('put', req.headers.authorization)
          const filter = {email: user.email};
          const updateDoc = {$set: {role: 'admin'}};
          const result = await usersCollection.updateOne(filter, updateDoc);
          res.json(result)
        }
      }
     else{
      res.status(401).json({message: 'You do not access to make admin'})
     }
     
      
    })

    app.delete('/delete/:id', async(req, res) => {
      const id = req.params.id;
      // console.log(id)
      const query = {_id: ObjectId(id)}
      // console.log(query)
      const result = await appointmentsCollection.deleteOne(query)
      if (result.deletedCount === 1) {
        console.log("Successfully deleted one document.");
      } else {
        console.log("No documents matched the query. Deleted 0 documents.");
      }
      res.json(result)
    })

    
  } finally {
   
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})