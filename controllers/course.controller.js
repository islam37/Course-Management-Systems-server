const { ObjectId } = require("mongodb");
const { validateCourseInput } = require("../validators/request.validators");

function createCourseController(courseService) {
  async function getCourses(req, res) {
    const email = req.query.email;
    const hasPagination = req.query.page !== undefined || req.query.limit !== undefined;
    let pagination;

    if (hasPagination) {
      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 10);

      if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
        return res.status(400).json({
          message: "Page must be at least 1 and limit must be between 1 and 100"
        });
      }

      pagination = { page, limit };
    }

    const courses = await courseService.findCourses(email, pagination);

    res.json(courses);
  }

  async function getCourse(req, res) {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid course ID format" });
    }

    const course = await courseService.findCourseById(id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json(course);
  }

  async function createCourse(req, res) {
    const validationError = validateCourseInput(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const course = await courseService.createCourse(req.body, req.user);

    res.status(201).json({
      message: "Course created successfully",
      id: course._id,
      ...course
    });
  }

  async function updateCourse(req, res) {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid course ID format" });
    }

    const result = await courseService.updateCourse(id, req.body, req.user);

    if (result === null) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (result.forbidden) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    res.json({
      message: "Course updated successfully",
      modifiedCount: result.modifiedCount
    });
  }

  async function deleteCourse(req, res) {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid course ID format" });
    }

    const deletedCount = await courseService.deleteCourse(id, req.user);

    if (deletedCount === -1) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    if (deletedCount === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json({
      message: "Course deleted successfully",
      deletedCount
    });
  }

  return {
    createCourse,
    deleteCourse,
    getCourse,
    getCourses,
    updateCourse
  };
}

module.exports = createCourseController;
