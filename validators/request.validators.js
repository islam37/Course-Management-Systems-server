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

  if (course.title.trim().length > 200) {
    return "Title must be 200 characters or fewer";
  }

  if (course.shortDescription.trim().length > 1000) {
    return "Short description must be 1000 characters or fewer";
  }

  if (course.fullDescription !== undefined && !isNonEmptyString(course.fullDescription)) {
    return "Full description must be a non-empty string";
  }

  if (course.fullDescription && course.fullDescription.trim().length > 10000) {
    return "Full description must be 10000 characters or fewer";
  }

  if (course.imageURL !== undefined) {
    try {
      const imageURL = new URL(course.imageURL);
      if (!["http:", "https:"].includes(imageURL.protocol)) {
        return "Image URL must use HTTP or HTTPS";
      }
    } catch {
      return "Image URL must be valid";
    }
  }

  if (course.duration !== undefined &&
      (!Number.isFinite(Number(course.duration)) || Number(course.duration) <= 0)) {
    return "Duration must be a positive number";
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

  if (name.trim().length > 100 || comment.trim().length > 2000) {
    return "Name or comment is too long";
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
