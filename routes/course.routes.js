const express = require("express");
const { ObjectId } = require("mongodb");
const asyncHandler = require("../middleware/async-handler");

function createCourseRouter({ coursesCollection, enrollmentsCollection }) {
  const router = express.Router();

  router.get("/", asyncHandler(async (req, res) => {
    const email = req.query.email;
    const query = email ? { createdBy: email } : {};
    const courses = await coursesCollection.find(query).toArray();

    res.json(courses);
  }));

  router.get("/:id", asyncHandler(async (req, res) => {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid course ID format" });
    }

    const course = await coursesCollection.findOne({ _id: new ObjectId(id) });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json(course);
  }));

  router.post("/", asyncHandler(async (req, res) => {
    const newCourse = req.body;

    if (!newCourse.title || !newCourse.shortDescription) {
      return res.status(400).json({ message: "Title and description are required" });
    }

    newCourse.createdAt = new Date();
    newCourse.updatedAt = new Date();

    const result = await coursesCollection.insertOne(newCourse);

    res.status(201).json({
      message: "Course created successfully",
      id: result.insertedId,
      ...newCourse
    });
  }));

  router.put("/:id", asyncHandler(async (req, res) => {
    const id = req.params.id;
    const { title, shortDescription, imageURL, duration, fullDescription } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid course ID format" });
    }

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

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json({
      message: "Course updated successfully",
      modifiedCount: result.modifiedCount
    });
  }));

  router.delete("/:id", asyncHandler(async (req, res) => {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid course ID format" });
    }

    const result = await coursesCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    await enrollmentsCollection.deleteMany({ courseId: new ObjectId(id) });

    res.json({
      message: "Course deleted successfully",
      deletedCount: result.deletedCount
    });
  }));

  return router;
}

module.exports = createCourseRouter;
