const express = require("express");
const cors = require("cors");
const { ObjectId } = require("mongodb");
const { getCollections } = require("./config/database");
const createCourseRouter = require("./routes/course.routes");
const createEnrollmentRouter = require("./routes/enrollment.routes");

const app = express();
const collections = getCollections();
const { coursesCollection } = collections;

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
app.use("/enrollments", createEnrollmentRouter(collections));


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