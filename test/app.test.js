const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const app = require("../app");
const errorHandler = require("../middleware/error-handler");
const { validateReviewInput } = require("../validators/request.validators");

test("GET / returns the server health response", async () => {
  const response = await request(app).get("/");

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, {
    message: "Course management server is running!",
    status: "OK"
  });
});

test("unknown routes return a JSON 404 response", async () => {
  const response = await request(app).get("/not-a-route");

  assert.equal(response.statusCode, 404);
  assert.deepEqual(response.body, {
    message: "Route not found"
  });
});

test("course routes reject invalid MongoDB IDs", async () => {
  const response = await request(app).get("/courses/not-an-object-id");

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, {
    message: "Invalid course ID format"
  });
});

test("enrollment creation rejects invalid course IDs", async () => {
  const response = await request(app)
    .post("/enrollments")
    .send({ email: "student@example.com", courseId: "not-an-object-id" });

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, {
    message: "Invalid course ID format"
  });
});

test("review creation rejects invalid course IDs", async () => {
  const response = await request(app)
    .post("/courses/not-an-object-id/reviews")
    .send({ name: "Student", rating: 5, comment: "Useful course" });

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, {
    message: "Invalid course ID format"
  });
});

test("review lookup rejects invalid course IDs", async () => {
  const response = await request(app).get("/courses/not-an-object-id/reviews");

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, {
    message: "Invalid course ID format"
  });
});

test("enrollment checks reject invalid course IDs", async () => {
  const response = await request(app).get("/enrollments/check").query({
    email: "student@example.com",
    courseId: "not-an-object-id"
  });

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, {
    message: "Invalid course ID format"
  });
});

test("enrollment deletion rejects invalid course IDs", async () => {
  const response = await request(app)
    .delete("/enrollments")
    .send({ email: "student@example.com", courseId: "not-an-object-id" });

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, {
    message: "Invalid course ID format"
  });
});

test("error handler hides internal error details", () => {
  const response = {
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
    }
  };

  errorHandler(new Error("database credentials should not be exposed"), {}, response, () => {});

  assert.equal(response.statusCode, 500);
  assert.deepEqual(response.body, {
    message: "Internal server error"
  });
});

test("course creation rejects blank required fields", async () => {
  const response = await request(app)
    .post("/courses")
    .send({ title: "   ", shortDescription: "Description" });

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, {
    message: "Title is required"
  });
});

test("enrollment creation rejects invalid email addresses", async () => {
  const response = await request(app)
    .post("/enrollments")
    .send({ email: "not-an-email", courseId: "not-an-object-id" });

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, {
    message: "A valid email is required"
  });
});

test("review validation rejects ratings outside the allowed range", () => {
  assert.equal(
    validateReviewInput({
      name: "Student",
      rating: 6,
      comment: "Useful course"
    }),
    "Rating must be an integer between 1 and 5"
  );
});

test("duplicate key errors return conflict responses", () => {
  const response = {
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
    }
  };

  errorHandler({ code: 11000 }, {}, response, () => {});

  assert.equal(response.statusCode, 409);
  assert.deepEqual(response.body, {
    message: "Resource already exists"
  });
});
