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
