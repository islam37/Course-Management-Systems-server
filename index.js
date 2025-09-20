const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Build MongoDB URI using env variables
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pihhew7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create MongoDB client
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log(' Connected to MongoDB successfully!');

    // Select DB & collection
    const database = client.db(process.env.DB_NAME);
    const coursesCollection = database.collection('courses');

    // Routes
    app.get('/', (req, res) => {
      res.send('Course management server is running!');
    });

    // Example: get all courses
    app.get('/courses', async (req, res) => {
      const courses = await coursesCollection.find({}).toArray();
      res.send(courses);
    });

    // Example: add a new course
    app.post('/courses', async (req, res) => {
      const newCourse = req.body;
      const result = await coursesCollection.insertOne(newCourse);
      res.send(result);
    });

  } catch (error) {
    console.error(' MongoDB connection failed:', error);
  }
}

run();

// Start server
app.listen(port, () => {
  console.log(` Server listening on port ${port}`);
});
