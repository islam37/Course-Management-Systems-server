const express = require("express");
const { ObjectId } = require("mongodb");
const asyncHandler = require("../middleware/async-handler");
const { validateEnrollmentInput } = require("../validators/request.validators");

function createEnrollmentRouter({ coursesCollection, enrollmentsCollection }) {
  const router = express.Router();

  router.post("/", asyncHandler(async (req, res) => {
    const { email, courseId } = req.body;

    const validationError = validateEnrollmentInput({ email, courseId });
    if (validationError) {
      return res.status(400).json({ message: validationError });
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
  }));

  router.get("/check", asyncHandler(async (req, res) => {
    const { email, courseId } = req.query;

    const validationError = validateEnrollmentInput({ email, courseId });
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    if (!ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course ID format" });
    }

    const enrollment = await enrollmentsCollection.findOne({
      email,
      courseId: new ObjectId(courseId)
    });

    res.json({ enrolled: !!enrollment, enrollment });
  }));

  router.get("/", asyncHandler(async (req, res) => {
    const email = req.query.email;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!validateEnrollmentInput({ email, courseId: "valid" })) {
      return res.status(400).json({ message: "A valid email is required" });
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
  }));

  router.delete("/", asyncHandler(async (req, res) => {
    const { email, courseId } = req.body;

    const validationError = validateEnrollmentInput({ email, courseId });
    if (validationError) {
      return res.status(400).json({ message: validationError });
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
  }));

  return router;
}

module.exports = createEnrollmentRouter;
