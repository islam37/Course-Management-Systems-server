const express = require("express");
const cors = require("cors");
const { ObjectId } = require("mongodb");
const { getCollections } = require("./config/database");
const createCourseRouter = require("./routes/course.routes");

const app = express();
const collections = getCollections();
const { coursesCollection, enrollmentsCollection } = collections;

// Middleware

app.use(express.json());

app.use(cors({
  origin: "*" 
}));

// Routes


app.get("/", (req, res) => {
  res.json({ message: "Course management server is running!", status: "OK" });
});

app.use("/courses", createCourseRouter(collections));

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


// Review Api


app.post("/courses/:id/reviews", async (req, res) => {
  try {
    const id = req.params.id;
    const { name, rating, comment } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid course ID format" });
    }

    if (!name || !rating || !comment) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newReview = {
      _id: new ObjectId(),
      name,
      rating: Number(rating),
      comment,
      createdAt: new Date(),
    };

    const result = await coursesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $push: { reviews: newReview } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(201).json({ message: "Review added successfully", review: newReview });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ message: "Failed to add review", error: error.message });
  }
});


// GET all reviews for a course
app.get("/courses/:id/reviews", async (req, res) => {
  try {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid course ID format" });
    }

    const course = await coursesCollection.findOne(
      { _id: new ObjectId(id) },
      { projection: { reviews: 1, _id: 0 } }
    );

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const reviews = course.reviews || [];
    res.json(reviews.reverse());
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Failed to fetch reviews", error: error.message });
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



module.exports = app;