const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateCourseInput(course) {
  if (!course || !isNonEmptyString(course.title)) {
    return "Title is required";
  }

  if (!isNonEmptyString(course.shortDescription)) {
    return "Short description is required";
  }

  return null;
}

function validateEnrollmentInput({ email, courseId }) {
  if (!isNonEmptyString(email) || !isNonEmptyString(courseId)) {
    return "Email and courseId are required";
  }

  if (!emailPattern.test(email.trim())) {
    return "A valid email is required";
  }

  return null;
}

function validateReviewInput({ name, rating, comment }) {
  if (!isNonEmptyString(name) || !isNonEmptyString(comment)) {
    return "Name and comment are required";
  }

  const numericRating = Number(rating);
  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    return "Rating must be an integer between 1 and 5";
  }

  return null;
}

module.exports = {
  validateCourseInput,
  validateEnrollmentInput,
  validateReviewInput
};
