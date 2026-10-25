const { ObjectId } = require("mongodb");
const { validateReviewInput } = require("../validators/request.validators");

function createReviewController(reviewService) {
  async function createReview(req, res) {
    const id = req.params.id;
    const { name, rating, comment } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid course ID format" });
    }

    const validationError = validateReviewInput({ name, rating, comment });
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const review = await reviewService.addReview(id, { name, rating, comment });

    if (!review) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(201).json({
      message: "Review added successfully",
      review
    });
  }

  async function getReviews(req, res) {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid course ID format" });
    }

    const reviews = await reviewService.findReviews(id);

    if (reviews === null) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json(reviews);
  }

  return { createReview, getReviews };
}

module.exports = createReviewController;
