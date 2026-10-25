const express = require("express");
const asyncHandler = require("../middleware/async-handler");
const { requireAuth, requireRole } = require("../middleware/auth");
const createEnrollmentController = require("../controllers/enrollment.controller");
const createEnrollmentService = require("../services/enrollment.service");

function createEnrollmentRouter(collections) {
  const router = express.Router();
  const enrollmentService = createEnrollmentService(collections);
  const enrollmentController = createEnrollmentController(enrollmentService);

  router.post(
    "/",
    requireAuth,
    requireRole("student", "instructor", "admin"),
    asyncHandler(enrollmentController.createEnrollment)
  );
  router.get("/check", asyncHandler(enrollmentController.checkEnrollment));
  router.get("/", asyncHandler(enrollmentController.getEnrollments));
  router.delete(
    "/",
    requireAuth,
    requireRole("student", "instructor", "admin"),
    asyncHandler(enrollmentController.deleteEnrollment)
  );

  return router;
}

module.exports = createEnrollmentRouter;
