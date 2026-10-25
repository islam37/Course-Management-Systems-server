const { ObjectId } = require("mongodb");

function createCourseService({ coursesCollection, enrollmentsCollection }) {
  async function findCourses(email, pagination) {
    const query = email ? { createdBy: email } : {};
    const cursor = coursesCollection.find(query);

    if (!pagination) {
      return cursor.toArray();
    }

    const { page, limit } = pagination;
    const [courses, total] = await Promise.all([
      cursor.skip((page - 1) * limit).limit(limit).toArray(),
      coursesCollection.countDocuments(query)
    ]);

    return {
      data: courses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async function findCourseById(id) {
    return coursesCollection.findOne({ _id: new ObjectId(id) });
  }

  async function createCourse(courseData, user) {
    const course = {
      title: courseData.title,
      shortDescription: courseData.shortDescription,
      imageURL: courseData.imageURL,
      duration: courseData.duration,
      fullDescription: courseData.fullDescription,
      createdBy: user.email || user.uid,
      createdByUid: user.uid,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await coursesCollection.insertOne(course);

    return {
      ...course,
      _id: result.insertedId
    };
  }

  async function updateCourse(id, courseData, user) {
    const existingCourse = await coursesCollection.findOne({ _id: new ObjectId(id) });

    if (!existingCourse) {
      return null;
    }

    if (user.role !== "admin" && existingCourse.createdByUid !== user.uid) {
      return { forbidden: true };
    }

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

    return { modifiedCount: result.modifiedCount };
  }

  async function deleteCourse(id, user) {
    if (user.role !== "admin") {
      const course = await coursesCollection.findOne({ _id: new ObjectId(id) });

      if (!course) {
        return 0;
      }

      if (course.createdByUid !== user.uid) {
        return -1;
      }
    }

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
