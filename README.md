# Course Management System API

Backend service for managing courses, student enrollments, and course reviews. The API is built with Node.js and Express, persists data in MongoDB, and can run locally or as a Vercel Node.js function.

## Features

- Course creation, listing, lookup, update, and deletion
- Optional course filtering by creator email
- Enrollment creation, lookup, listing, and removal
- Duplicate-enrollment protection
- Automatic enrollment counts on courses
- Course reviews with ratings from 1 to 5
- Firebase ID-token authentication and role-based authorization
- Course ownership enforcement for instructors
- Paginated course listing
- Request validation and consistent JSON error responses
- Patched npm dependency overrides for known transitive vulnerabilities
- MongoDB indexes for unique student/course enrollments
- Graceful database shutdown on `SIGINT` and `SIGTERM`

## Technology

- **Runtime:** Node.js
- **Framework:** Express 5
- **Database:** MongoDB Atlas or any compatible MongoDB deployment
- **MongoDB driver:** `mongodb`
- **Authentication:** Firebase Authentication and Firebase Admin SDK
- **Testing:** Node.js built-in test runner and Supertest
- **Deployment:** Vercel (`@vercel/node`)

## Requirements

- Node.js 18 or newer
- npm
- A MongoDB deployment and database user

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the environment

Copy the example environment file and provide your MongoDB credentials:

```bash
cp .env.example .env
```

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `PORT` | No | `3000` | Port used by the local server |
| `DB_USER` | Yes | — | MongoDB username |
| `DB_PASS` | Yes | — | MongoDB password |
| `DB_NAME` | Yes | — | Database name |
| `DB_HOST` | No | `cluster0.pihhew7.mongodb.net` | MongoDB Atlas host |
| `CORS_ORIGIN` | No | `*` | Allowed CORS origin |
| `FIREBASE_PROJECT_ID` | Yes for protected endpoints | — | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Yes for protected endpoints | — | Firebase Admin service-account email |
| `FIREBASE_PRIVATE_KEY` | Yes for protected endpoints | — | Firebase Admin private key |

The MongoDB username and password are URL-encoded before being included in the connection string. `DB_HOST` should contain only the MongoDB host, without `mongodb+srv://` or a path.

For Firebase, create a service account in Firebase/Google Cloud and provide its project ID,
client email, and private key. Keep the private key only in environment variables. Replace
escaped `\n` sequences in the deployed secret only if your hosting platform does not preserve
them; the application handles escaped newlines in `FIREBASE_PRIVATE_KEY`.

### 3. Start the server

```bash
npm start
```

The API is available at `http://localhost:3000` by default. The root endpoint can be used as a health check:

```bash
curl http://localhost:3000/
```

Expected response:

```json
{
  "message": "Course management server is running!",
  "status": "OK"
}
```

## API reference

All request and response bodies are JSON. MongoDB course identifiers are represented as 24-character hexadecimal ObjectId strings.

### Health

#### `GET /`

Returns the service health response.

### Courses

#### `GET /courses`

Returns all courses. Pass `email` to return only courses created by that email:

```http
GET /courses?email=instructor@example.com
```

Optional pagination is enabled with `page` and `limit`:

```http
GET /courses?page=1&limit=10
```

`page` must be at least `1`; `limit` must be between `1` and `100`. Paginated responses
contain `data` and `pagination` fields:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0
  }
}
```

#### `GET /courses/:id`

Returns one course. Responds with `400` for an invalid ID or `404` when the course does not exist.

#### `POST /courses`

Creates a course. Requires a Firebase ID token for a user with the `instructor` or `admin`
role. `title` and `shortDescription` are required; other fields are stored when supplied.
The server sets `createdBy` and `createdByUid` from the verified Firebase user; client-supplied
ownership fields are ignored.

```json
{
  "title": "Introduction to Node.js",
  "shortDescription": "Build HTTP APIs with Node.js and Express.",
  "fullDescription": "A practical introduction to server-side JavaScript.",
  "imageURL": "https://example.com/node-course.jpg",
  "duration": "6 weeks"
}
```

The server adds `createdAt` and `updatedAt` timestamps. A successful request returns `201 Created` and the inserted course ID.

#### `PUT /courses/:id`

Updates any supplied course fields from the following set. Requires an authenticated
`instructor` or `admin`; instructors may update only their own courses:

- `title`
- `shortDescription`
- `imageURL`
- `duration`
- `fullDescription`

The server updates `updatedAt`. Unspecified fields are left unchanged.

#### `DELETE /courses/:id`

Deletes a course and removes its related enrollment records. Requires an authenticated
`admin`. Reviews are embedded in the course document and are deleted with the course.

### Enrollments

Enrollments use an email address as the student identifier. Enrollment creation and removal
require a Firebase ID token with a valid role. The current API does not automatically replace
the submitted email with the Firebase email, so clients should submit the authenticated user's
email.

#### `POST /enrollments`

Enrolls a student in an existing course. Requires a Firebase ID token with a valid role:

```json
{
  "email": "student@example.com",
  "courseId": "64f1c2a3b4c5d6e7f8a9b0c1"
}
```

Returns `201 Created` on success and `409 Conflict` if the student is already enrolled. The course's `enrollCount` is incremented after a successful enrollment.

#### `GET /enrollments/check?email=...&courseId=...`

Checks whether a student is enrolled in a course:

```json
{
  "enrolled": true,
  "enrollment": {
    "_id": "…",
    "email": "student@example.com",
    "courseId": "…",
    "createdAt": "…",
    "courseTitle": "Introduction to Node.js",
    "courseDescription": "Build HTTP APIs with Node.js and Express."
  }
}
```

When no enrollment exists, `enrolled` is `false` and `enrollment` is `null`.

#### `GET /enrollments?email=student@example.com`

Returns all enrollments for a student, including the current course document under `course`.

#### `DELETE /enrollments`

Removes a student's enrollment. Requires a Firebase ID token with a valid role:

```json
{
  "email": "student@example.com",
  "courseId": "64f1c2a3b4c5d6e7f8a9b0c1"
}
```

Returns `404` if the enrollment does not exist and decrements the course's `enrollCount` after successful removal.

### Authentication and authorization

Protected requests must include the Firebase ID token issued after the frontend user signs in:

```http
Authorization: Bearer <firebase-id-token>
```

Firebase custom claims must include a `role` value:

```json
{
  "role": "student"
}
```

Supported roles are `student`, `instructor`, and `admin`.

| Operation | Access |
| --- | --- |
| Read courses and reviews | Public |
| Read enrollments and enrollment checks | Public |
| Create a course | `instructor` or `admin` |
| Update a course | Course owner or `admin` |
| Delete a course | `admin` |
| Create or delete an enrollment | Any authenticated role |
| Create a review | Any authenticated role |

The frontend must obtain the token from Firebase and send it in the `Authorization` header.
The backend verifies the token and does not trust client-supplied `createdBy`,
`createdByUid`, or `role` values.

### Reviews

Reviews are stored inside the corresponding course document.

#### `POST /courses/:id/reviews`

Adds a review. Requires a Firebase ID token with a valid role. `name` and `comment` are
required, and `rating` must be an integer from 1 through 5:

```json
{
  "name": "Aisha Khan",
  "rating": 5,
  "comment": "Clear explanations and useful examples."
}
```

Returns `201 Created` with the newly created review.

#### `GET /courses/:id/reviews`

Returns the course reviews, newest first. Responds with `404` when the course does not exist.

## HTTP status behavior

| Status | Meaning |
| --- | --- |
| `200` | Successful read, update, or deletion |
| `201` | Resource created |
| `400` | Invalid input or MongoDB ID format |
| `401` | Missing, invalid, or expired Firebase ID token |
| `403` | Authenticated user lacks the required role or ownership |
| `404` | Route, course, or enrollment not found |
| `409` | Duplicate enrollment or other duplicate-key conflict |
| `500` | Unexpected server or database error |

Error responses use the following shape:

```json
{
  "message": "A valid email is required"
}
```

Unexpected internal errors are logged server-side while the response exposes only `Internal server error`.

## Project structure

```text
.
├── app.js                         # Express application and route mounting
├── index.js                       # Database connection and HTTP server startup
├── config/database.js             # MongoDB client and collection access
├── config/firebase.js              # Firebase Admin initialization
├── controllers/                   # HTTP request/response handlers
│   ├── course.controller.js
│   ├── enrollment.controller.js
│   └── review.controller.js
├── services/                      # Business logic and MongoDB operations
│   ├── course.service.js
│   ├── enrollment.service.js
│   └── review.service.js
├── routes/
│   ├── course.routes.js           # Course CRUD endpoints
│   ├── enrollment.routes.js       # Enrollment endpoints
│   └── review.routes.js           # Course review endpoints
├── validators/
│   └── request.validators.js      # Course, enrollment, and review validation
├── middleware/
│   ├── async-handler.js           # Promise error forwarding
│   ├── auth.js                    # Firebase token and role verification
│   └── error-handler.js           # Centralized error responses
├── test/
│   └── app.test.js                # API and validation tests
├── .env.example                   # Environment variable template
├── package.json                   # Scripts, dependencies, and npm overrides
└── vercel.json                    # Vercel deployment configuration
```

## Database behavior

The application uses two MongoDB collections:

- `courses`: course data, `enrollCount`, timestamps, and embedded `reviews`
- `enrollments`: student/course enrollment records and enrollment snapshots of the course title and short description

On startup, the application:

1. Connects to MongoDB.
2. Pings the selected database.
3. Creates a unique compound index on `enrollments.email` and `enrollments.courseId`.

Because the database configuration is loaded when the application starts, `DB_USER`, `DB_PASS`, and `DB_NAME` must be set before running the server.

## Testing

Run the test suite with:

```bash
npm test
```

The tests cover the health endpoint, unknown routes, ObjectId validation, authentication
boundaries, request validation, and safe error responses. The application validates
`DB_USER`, `DB_PASS`, and `DB_NAME` while it is loaded, so provide those variables when
running the suite; the current tests do not open a MongoDB connection.

For example:

```bash
DB_USER=test DB_PASS=test DB_NAME=test npm test
```

## Deployment on Vercel

The included `vercel.json` configures `index.js` as a Vercel Node.js function and forwards supported HTTP methods to it.

To deploy:

1. Import the repository into Vercel.
2. Add `DB_USER`, `DB_PASS`, and `DB_NAME` as production environment variables.
3. Add `DB_HOST` if the deployment uses a host other than the default.
4. Add `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`.
5. Set `CORS_ORIGIN` to the deployed frontend origin, or to `*` only when unrestricted access is intentional.
6. Deploy the project.

The serverless entry point still connects to MongoDB through the shared MongoDB client in `config/database.js`.

## Security and production notes

- Protected endpoints require a Firebase ID token in `Authorization: Bearer <token>`.
- Firebase custom claims must include `student`, `instructor`, or `admin` as the `role`.
- Course creation is available to instructors and admins; updates are limited to course owners and admins; deletion is limited to admins.
- Enrollment writes and review creation require an authenticated role.
- Use a least-privilege MongoDB user and keep `.env` out of version control.
- Restrict `CORS_ORIGIN` to trusted frontend origins in production.
- Never trust `createdBy`, `createdByUid`, or `role` values from request bodies.
- Never commit Firebase service-account credentials.
- The enrollment uniqueness rule is enforced by MongoDB, so duplicate requests remain protected under concurrent writes.
