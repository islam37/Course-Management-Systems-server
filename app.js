const express = require("express");
const cors = require("cors");
const { getCollections } = require("./config/database");
const createCourseRouter = require("./routes/course.routes");
const createEnrollmentRouter = require("./routes/enrollment.routes");
const createReviewRouter = require("./routes/review.routes");

const app = express();
const collections = getCollections();

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
app.use("/courses", createReviewRouter(collections));

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