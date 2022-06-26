const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

const { MongoClient, ServerApiVersion } = require('mongodb');


const port = process.env.PORT || 5000


app.use(cors())
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.t0fgxph.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1});


async function run() {
  try {
    await client.connect();
    const database = client.db("doctors_portal")
    const appointmentsCollection = database.collection("appointments")


    app.post('/appointments', (res, req) => {
      const appointment = req.body;
      console.log(appointment);
      res.json({message: 'hello'})
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