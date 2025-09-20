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
    const coursesCollection = database.collection("courses");
    const enrollmentsCollection = database.collection("enrollments");

    // Routes
    app.get('/', (req, res) => {
      res.send('Course management server is running!');
    });

    
    
    // Get all courses
    app.get("/courses", async (req, res) => {
      const email = req.query.email; // filter by user email
      let query = {};
      if (email) query.email = email;
      const courses = await coursesCollection.find(query).toArray();
      res.send(courses);
    });

    // Get single course by ID
    app.get("/courses/:id", async (req, res) => {
      const id = req.params.id;
      const course = await coursesCollection.findOne({ _id: new ObjectId(id) });
      res.send(course);
    });

   // Add new course
    app.post("/courses", async (req, res) => {
      const newCourse = req.body;
      const result = await coursesCollection.insertOne(newCourse);
      res.send(result);
    });

     // Update course
    app.put("/courses/:id", async (req, res) => {
      const id = req.params.id;
      const updatedCourse = req.body;
      const result = await coursesCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedCourse }
      );
      res.send(result);
    });

    // Delete course
    app.delete("/courses/:id", async (req, res) => {
      const id = req.params.id;
      const result = await coursesCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // Enroll in a course
    app.post("/enrollments", async (req, res) => {
      const { email, courseId } = req.body;

      // check if already enrolled
      const exists = await enrollmentsCollection.findOne({ email, courseId });
      if (exists) {
        return res.send({ message: "Already enrolled", enrolled: true });
      }

      // insert new enrollment
      const enrollment = { email, courseId, createdAt: new Date() };
      const result = await enrollmentsCollection.insertOne(enrollment);

    // update course enrollCount
      await coursesCollection.updateOne(
        { _id: new ObjectId(courseId) },
        { $inc: { enrollCount: 1 } }
      );

      res.send(result);
    });

    // Check if user is enrolled in a course
    app.get("/enrollments/check", async (req, res) => {
      const { email, courseId } = req.query;
      const exists = await enrollmentsCollection.findOne({ email, courseId });
      res.send({ enrolled: !!exists });
    });

    // Get all enrolled courses for a user
    app.get("/enrollments", async (req, res) => {
      const email = req.query.email;
      if (!email) return res.status(400).send({ message: "Email required" });

      const enrollments = await enrollmentsCollection.find({ email }).toArray();

      // fetch course details for each enrolled course
      const courseIds = enrollments.map((e) => new ObjectId(e.courseId));
      const courses = await coursesCollection
        .find({ _id: { $in: courseIds } })
        .toArray();

      res.send(courses);
    });
 // Remove enrollment
    app.delete("/enrollments", async (req, res) => {
      const { email, courseId } = req.body;

      // remove enrollment
      const result = await enrollmentsCollection.deleteOne({ email, courseId });

      // decrease course enrollCount
      await coursesCollection.updateOne(
        { _id: new ObjectId(courseId) },
        { $inc: { enrollCount: -1 } }
      );

      res.send(result);
    });
  } catch (error) {
    console.error(" MongoDB connection failed:", error);
  }
}

run();

// Start server
app.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
});