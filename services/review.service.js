const { ObjectId } = require("mongodb");

function createReviewService({ coursesCollection }) {
  async function addReview(id, reviewData) {
    const review = {
      _id: new ObjectId(),
      name: reviewData.name,
      rating: Number(reviewData.rating),
      comment: reviewData.comment,
      createdAt: new Date()
    };

    const result = await coursesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $push: { reviews: review } }
    );

    return result.matchedCount === 0 ? null : review;
  }

  async function findReviews(id) {
    const course = await coursesCollection.findOne(
      { _id: new ObjectId(id) },
      { projection: { reviews: 1, _id: 0 } }
    );

    if (!course) {
      return null;
    }

    return [...(course.reviews || [])].reverse();
  }

  return { addReview, findReviews };
}

module.exports = createReviewService;
