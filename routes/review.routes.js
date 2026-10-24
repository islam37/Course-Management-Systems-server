const express = require("express");
const { ObjectId } = require("mongodb");
const asyncHandler = require("../middleware/async-handler");
const { validateReviewInput } = require("../validators/request.validators");

function createReviewRouter({ coursesCollection }) {
  const router = express.Router();

  router.post("/:id/reviews", asyncHandler(async (req, res) => {
    const id = req.params.id;
    const { name, rating, comment } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid course ID format" });
    }

    const validationError = validateReviewInput({ name, rating, comment });
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const newReview = {
      _id: new ObjectId(),
      name,
      rating: Number(rating),
      comment,
      createdAt: new Date()
    };

    const result = await coursesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $push: { reviews: newReview } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(201).json({
      message: "Review added successfully",
      review: newReview
    });
  }));

  router.get("/:id/reviews", asyncHandler(async (req, res) => {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid course ID format" });
    }

    const course = await coursesCollection.findOne(
      { _id: new ObjectId(id) },
      { projection: { reviews: 1, _id: 0 } }
    );

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const reviews = course.reviews || [];
    res.json(reviews.reverse());
  }));

  return router;
}

module.exports = createReviewRouter;
