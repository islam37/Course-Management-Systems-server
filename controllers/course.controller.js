const { ObjectId } = require("mongodb");
const { validateCourseInput } = require("../validators/request.validators");

function createCourseController(courseService) {
  async function getCourses(req, res) {
    const email = req.query.email;
    const courses = await courseService.findCourses(email);

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

    const course = await courseService.createCourse(req.body);

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

    const modifiedCount = await courseService.updateCourse(id, req.body);

    if (modifiedCount === null) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json({
      message: "Course updated successfully",
      modifiedCount
    });
  }

  async function deleteCourse(req, res) {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid course ID format" });
    }

    const deletedCount = await courseService.deleteCourse(id);

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
