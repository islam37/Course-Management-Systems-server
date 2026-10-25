const { ObjectId } = require("mongodb");

function createCourseService({ coursesCollection, enrollmentsCollection }) {
  async function findCourses(email) {
    const query = email ? { createdBy: email } : {};
    return coursesCollection.find(query).toArray();
  }

  async function findCourseById(id) {
    return coursesCollection.findOne({ _id: new ObjectId(id) });
  }

  async function createCourse(courseData) {
    const course = {
      ...courseData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await coursesCollection.insertOne(course);

    return {
      ...course,
      _id: result.insertedId
    };
  }

  async function updateCourse(id, courseData) {
    const { title, shortDescription, imageURL, duration, fullDescription } = courseData;
    const updateData = {
      title,
      shortDescription,
      imageURL,
      duration,
      fullDescription,
      updatedAt: new Date()
    };

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const result = await coursesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    return result.matchedCount === 0 ? null : result.modifiedCount;
  }

  async function deleteCourse(id) {
    const result = await coursesCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount > 0) {
      await enrollmentsCollection.deleteMany({ courseId: new ObjectId(id) });
    }

    return result.deletedCount;
  }

  return {
    createCourse,
    deleteCourse,
    findCourseById,
    findCourses,
    updateCourse
  };
}

module.exports = createCourseService;
