const express = require("express");
const asyncHandler = require("../middleware/async-handler");
const { requireAuth, requireRole } = require("../middleware/auth");
const createReviewController = require("../controllers/review.controller");
const createReviewService = require("../services/review.service");

function createReviewRouter(collections) {
  const router = express.Router();
  const reviewService = createReviewService(collections);
  const reviewController = createReviewController(reviewService);

  router.post(
    "/:id/reviews",
    requireAuth,
    requireRole("student", "instructor", "admin"),
    asyncHandler(reviewController.createReview)
  );
  router.get("/:id/reviews", asyncHandler(reviewController.getReviews));

  return router;
}

module.exports = createReviewRouter;
