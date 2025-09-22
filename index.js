const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

// Middleware

app.use(express.json());

app.use(cors({
  origin: "*" 
}));

// Build MongoDB URI using env variables
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pihhew7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create MongoDB client
const client = new MongoClient(uri);

// Database connection
//let database, coursesCollection, enrollmentsCollection;
const database = client.db(process.env.DB_NAME);
    const coursesCollection = database.collection("courses");
    const enrollmentsCollection = database.collection("enrollments");


// async function run() {
//   try {
//     await client.connect();
//     console.log(" Connected to MongoDB successfully!");

//     // Select DB & collection
    
//     console.log(" Database collections initialized");
//   } catch (error) {
//     console.error(" MongoDB connection failed:", error);
//     process.exit(1);
//   }
// }

// Routes


app.get("/", (req, res) => {
  res.json({ message: "Course management server is running!", status: "OK" });
});

// Get all courses
app.get("/courses", async (req, res) => {
  try {
    const email = req.query.email;
    let query = {};
    
    if (email) {
      query.createdBy = email;
    }
    
    const courses = await coursesCollection.find(query).toArray();
    res.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ message: "Failed to fetch courses", error: error.message });
  }
});

// Get single course by id
app.get("/courses/:id", async (req, res) => {
  try {
    const id = req.params.id;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid course ID format" });
    }
    
    const course = await coursesCollection.findOne({ _id: new ObjectId(id) });
    
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    res.json(course);
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({ message: "Failed to fetch course", error: error.message });
  }
});

// Add new course
app.post("/courses", async (req, res) => {
  try {
    const newCourse = req.body;
    
    // Basic validation
    if (!newCourse.title || !newCourse.shortDescription) {
      return res.status(400).json({ message: "Title and description are required" });
    }
    
    newCourse.createdAt = new Date();
    newCourse.updatedAt = new Date();
    
    const result = await coursesCollection.insertOne(newCourse);
    res.status(201).json({
      message: "Course created successfully",
      id: result.insertedId,
      ...newCourse
    });
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({ message: "Failed to create course", error: error.message });
  }
});

app.put("/courses/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { title, shortDescription, imageURL, duration, fullDescription } = req.body;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid course ID format" });
    }
    
    // Only update allowed fields
    const updateData = {
      title,
      shortDescription,
      imageURL,
      duration,
      fullDescription,
      updatedAt: new Date()
    };
    
    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    const result = await coursesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    res.json({ message: "Course updated successfully", modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ message: "Failed to update course", error: error.message });
  }
});

// Delete course
app.delete("/courses/:id", async (req, res) => {
  try {
    const id = req.params.id;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid course ID format" });
    }
    
    const result = await coursesCollection.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    // Also remove any enrollments for this course
    await enrollmentsCollection.deleteMany({ courseId: id });
    
    res.json({ message: "Course deleted successfully", deletedCount: result.deletedCount });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ message: "Failed to delete course", error: error.message });
  }
});

// Enroll in a course
app.post("/enrollments", async (req, res) => {
  try {
    const { email, courseId } = req.body;
    
    if (!email || !courseId) {
      return res.status(400).json({ message: "Email and courseId are required" });
    }
    
    if (!ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course ID format" });
    }
    
    // Check if course exists
    const course = await coursesCollection.findOne({ _id: new ObjectId(courseId) });
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    // Check if already enrolled
    const existingEnrollment = await enrollmentsCollection.findOne({ 
      email, 
      courseId: new ObjectId(courseId) 
    });
    
    if (existingEnrollment) {
      return res.status(409).json({ message: "Already enrolled in this course", enrolled: true });
    }
    
    // Create new enrollment
    const enrollment = { 
      email, 
      courseId: new ObjectId(courseId), 
      createdAt: new Date(),
      courseTitle: course.title,
      courseDescription: course.shortDescription
    };
    
    const result = await enrollmentsCollection.insertOne(enrollment);
    
    // Update course enrollment count
    await coursesCollection.updateOne(
      { _id: new ObjectId(courseId) },
      { $inc: { enrollCount: 1 } }
    );
    
    res.status(201).json({
      message: "Successfully enrolled in course",
      enrollmentId: result.insertedId,
      enrolled: true
    });
  } catch (error) {
    console.error("Error enrolling in course:", error);
    res.status(500).json({ message: "Failed to enroll in course", error: error.message });
  }
});

// Check if user is enrolled in a course
app.get("/enrollments/check", async (req, res) => {
  try {
    const { email, courseId } = req.query;
    
    if (!email || !courseId) {
      return res.status(400).json({ message: "Email and courseId are required" });
    }
    
    if (!ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course ID format" });
    }
    
    const enrollment = await enrollmentsCollection.findOne({ 
      email, 
      courseId: new ObjectId(courseId) 
    });
    
    res.json({ enrolled: !!enrollment, enrollment });
  } catch (error) {
    console.error("Error checking enrollment:", error);
    res.status(500).json({ message: "Failed to check enrollment", error: error.message });
  }
});

// Get all enrolled courses for a user
app.get("/enrollments", async (req, res) => {
  try {
    const email = req.query.email;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    
    const enrollments = await enrollmentsCollection.find({ email }).toArray();
    
    // Get course details for each enrollment
    const courseIds = enrollments.map(e => e.courseId);
    const courses = await coursesCollection.find({ 
      _id: { $in: courseIds } 
    }).toArray();
    
    // Merge enrollment and course data
    const enrolledCourses = enrollments.map(enrollment => {
      const course = courses.find(c => c._id.equals(enrollment.courseId));
      return {
        ...enrollment,
        course: course || null
      };
    });
    
    res.json(enrolledCourses);
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    res.status(500).json({ message: "Failed to fetch enrollments", error: error.message });
  }
});

// Remove enrollment
app.delete("/enrollments", async (req, res) => {
  try {
    const { email, courseId } = req.body;
    
    if (!email || !courseId) {
      return res.status(400).json({ message: "Email and courseId are required" });
    }
    
    if (!ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course ID format" });
    }
    
    const result = await enrollmentsCollection.deleteOne({ 
      email, 
      courseId: new ObjectId(courseId) 
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Enrollment not found" });
    }
    
    // Decrease course enrollment count
    await coursesCollection.updateOne(
      { _id: new ObjectId(courseId) },
      { $inc: { enrollCount: -1 } }
    );
    
    res.json({ message: "Successfully removed enrollment", deletedCount: result.deletedCount });
  } catch (error) {
    console.error("Error removing enrollment:", error);
    res.status(500).json({ message: "Failed to remove enrollment", error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({ message: "Internal server error", error: error.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Start server only after DB connection
// run().then(() => {
 
// }).catch(error => {
//   console.error("Failed to start server:", error);
//   process.exit(1);
// });



 app.listen(port, () => {
    console.log(` Server listening on port ${port}`);
  });
//module.exports = app;