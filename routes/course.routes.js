const express = require("express");
const asyncHandler = require("../middleware/async-handler");
const { requireAuth, requireRole } = require("../middleware/auth");
const createCourseController = require("../controllers/course.controller");
const createCourseService = require("../services/course.service");

function createCourseRouter(collections) {
  const router = express.Router();
  const courseService = createCourseService(collections);
  const courseController = createCourseController(courseService);

  router.get("/", asyncHandler(courseController.getCourses));
  router.get("/:id", asyncHandler(courseController.getCourse));
  router.post(
    "/",
    requireAuth,
    requireRole("admin", "instructor"),
    asyncHandler(courseController.createCourse)
  );
  router.put(
    "/:id",
    requireAuth,
    requireRole("admin", "instructor"),
    asyncHandler(courseController.updateCourse)
  );
  router.delete(
    "/:id",
    requireAuth,
    requireRole("admin"),
    asyncHandler(courseController.deleteCourse)
  );

  return router;
}

module.exports = createCourseRouter;
