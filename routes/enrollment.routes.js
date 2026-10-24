const express = require("express");
const { ObjectId } = require("mongodb");

function createEnrollmentRouter({ coursesCollection, enrollmentsCollection }) {
  const router = express.Router();

  router.post("/", async (req, res) => {
    try {
      const { email, courseId } = req.body;

      if (!email || !courseId) {
        return res.status(400).json({ message: "Email and courseId are required" });
      }

      if (!ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: "Invalid course ID format" });
      }

      const course = await coursesCollection.findOne({ _id: new ObjectId(courseId) });
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      const existingEnrollment = await enrollmentsCollection.findOne({
        email,
        courseId: new ObjectId(courseId)
      });

      if (existingEnrollment) {
        return res.status(409).json({
          message: "Already enrolled in this course",
          enrolled: true
        });
      }

      const enrollment = {
        email,
        courseId: new ObjectId(courseId),
        createdAt: new Date(),
        courseTitle: course.title,
        courseDescription: course.shortDescription
      };

      const result = await enrollmentsCollection.insertOne(enrollment);

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

  router.get("/check", async (req, res) => {
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

  router.get("/", async (req, res) => {
    try {
      const email = req.query.email;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const enrollments = await enrollmentsCollection.find({ email }).toArray();
      const courseIds = enrollments.map((enrollment) => enrollment.courseId);
      const courses = await coursesCollection.find({
        _id: { $in: courseIds }
      }).toArray();

      const enrolledCourses = enrollments.map((enrollment) => {
        const course = courses.find((item) => item._id.equals(enrollment.courseId));

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

  router.delete("/", async (req, res) => {
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

      await coursesCollection.updateOne(
        { _id: new ObjectId(courseId) },
        { $inc: { enrollCount: -1 } }
      );

      res.json({
        message: "Successfully removed enrollment",
        deletedCount: result.deletedCount
      });
    } catch (error) {
      console.error("Error removing enrollment:", error);
      res.status(500).json({ message: "Failed to remove enrollment", error: error.message });
    }
  });

  return router;
}

module.exports = createEnrollmentRouter;
