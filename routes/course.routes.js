const express = require("express");
const asyncHandler = require("../middleware/async-handler");
const createCourseController = require("../controllers/course.controller");
const createCourseService = require("../services/course.service");

function createCourseRouter(collections) {
  const router = express.Router();
  const courseService = createCourseService(collections);
  const courseController = createCourseController(courseService);

  router.get("/", asyncHandler(courseController.getCourses));
  router.get("/:id", asyncHandler(courseController.getCourse));
  router.post("/", asyncHandler(courseController.createCourse));
  router.put("/:id", asyncHandler(courseController.updateCourse));
  router.delete("/:id", asyncHandler(courseController.deleteCourse));

  return router;
}

module.exports = createCourseRouter;
