const { ObjectId } = require("mongodb");

function createEnrollmentService({ coursesCollection, enrollmentsCollection }) {
  async function createEnrollment(email, courseId) {
    const courseObjectId = new ObjectId(courseId);
    const course = await coursesCollection.findOne({ _id: courseObjectId });

    if (!course) {
      return null;
    }

    const existingEnrollment = await enrollmentsCollection.findOne({
      email,
      courseId: courseObjectId
    });

    if (existingEnrollment) {
      return { alreadyEnrolled: true };
    }

    const enrollment = {
      email,
      courseId: courseObjectId,
      createdAt: new Date(),
      courseTitle: course.title,
      courseDescription: course.shortDescription
    };

    const result = await enrollmentsCollection.insertOne(enrollment);

    await coursesCollection.updateOne(
      { _id: courseObjectId },
      { $inc: { enrollCount: 1 } }
    );

    return {
      enrollmentId: result.insertedId,
      alreadyEnrolled: false
    };
  }

  async function findEnrollment(email, courseId) {
    return enrollmentsCollection.findOne({
      email,
      courseId: new ObjectId(courseId)
    });
  }

  async function findEnrollmentsWithCourses(email) {
    const enrollments = await enrollmentsCollection.find({ email }).toArray();
    const courseIds = enrollments.map((enrollment) => enrollment.courseId);
    const courses = await coursesCollection.find({
      _id: { $in: courseIds }
    }).toArray();

    return enrollments.map((enrollment) => {
      const course = courses.find((item) => item._id.equals(enrollment.courseId));

      return {
        ...enrollment,
        course: course || null
      };
    });
  }

  async function deleteEnrollment(email, courseId) {
    const courseObjectId = new ObjectId(courseId);
    const result = await enrollmentsCollection.deleteOne({
      email,
      courseId: courseObjectId
    });

    if (result.deletedCount > 0) {
      await coursesCollection.updateOne(
        { _id: courseObjectId },
        { $inc: { enrollCount: -1 } }
      );
    }

    return result.deletedCount;
  }

  return {
    createEnrollment,
    deleteEnrollment,
    findEnrollment,
    findEnrollmentsWithCourses
  };
}

module.exports = createEnrollmentService;
