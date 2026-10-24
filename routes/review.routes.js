const express = require("express");
const { ObjectId } = require("mongodb");

function createReviewRouter({ coursesCollection }) {
  const router = express.Router();

  router.post("/:id/reviews", async (req, res) => {
    try {
      const id = req.params.id;
      const { name, rating, comment } = req.body;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid course ID format" });
      }

      if (!name || !rating || !comment) {
        return res.status(400).json({ message: "All fields are required" });
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
    } catch (error) {
      console.error("Error adding review:", error);
      res.status(500).json({ message: "Failed to add review", error: error.message });
    }
  });

  router.get("/:id/reviews", async (req, res) => {
    try {
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
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews", error: error.message });
    }
  });

  return router;
}

module.exports = createReviewRouter;
