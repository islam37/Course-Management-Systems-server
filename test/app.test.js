const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const app = require("../app");

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
