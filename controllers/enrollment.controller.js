const { ObjectId } = require("mongodb");
const { validateEnrollmentInput } = require("../validators/request.validators");

function createEnrollmentController(enrollmentService) {
  async function createEnrollment(req, res) {
    const { email, courseId } = req.body;
    const validationError = validateEnrollmentInput({ email, courseId });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    if (!ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course ID format" });
    }

    const enrollment = await enrollmentService.createEnrollment(email, courseId);

    if (enrollment === null) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (enrollment.alreadyEnrolled) {
      return res.status(409).json({
        message: "Already enrolled in this course",
        enrolled: true
      });
    }

    res.status(201).json({
      message: "Successfully enrolled in course",
      enrollmentId: enrollment.enrollmentId,
      enrolled: true
    });
  }

  async function checkEnrollment(req, res) {
    const { email, courseId } = req.query;
    const validationError = validateEnrollmentInput({ email, courseId });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    if (!ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course ID format" });
    }

    const enrollment = await enrollmentService.findEnrollment(email, courseId);
    res.json({ enrolled: !!enrollment, enrollment });
  }

  async function getEnrollments(req, res) {
    const email = req.query.email;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!validateEnrollmentInput({ email, courseId: "valid" })) {
      return res.status(400).json({ message: "A valid email is required" });
    }

    const enrollments = await enrollmentService.findEnrollmentsWithCourses(email);
    res.json(enrollments);
  }

  async function deleteEnrollment(req, res) {
    const { email, courseId } = req.body;
    const validationError = validateEnrollmentInput({ email, courseId });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    if (!ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course ID format" });
    }

    const deletedCount = await enrollmentService.deleteEnrollment(email, courseId);

    if (deletedCount === 0) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    res.json({
      message: "Successfully removed enrollment",
      deletedCount
    });
  }

  return {
    checkEnrollment,
    createEnrollment,
    deleteEnrollment,
    getEnrollments
  };
}

module.exports = createEnrollmentController;
