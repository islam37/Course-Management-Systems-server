# Course Management Server

Backend API for the Course Management System. It uses Node.js, Express, and the native MongoDB driver without an additional framework or ORM.

## Requirements

- Node.js 18 or newer
- MongoDB Atlas or a compatible MongoDB deployment

## Setup

```bash
npm install
```

Copy `.env.example` to `.env` and set the database values:

```env
PORT=3000
DB_USER=
DB_PASS=
DB_NAME=
DB_HOST=cluster0.pihhew7.mongodb.net
CORS_ORIGIN=http://localhost:5173
```

## Commands

```bash
npm start
npm test
```

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/` | Health check |
| GET | `/courses` | List courses |
| GET | `/courses?email=user@example.com` | List courses created by an email |
| GET | `/courses?page=1&limit=10` | Paginated course list |
| GET | `/courses/:id` | Get one course |
| POST | `/courses` | Create a course |
| PUT | `/courses/:id` | Update a course |
| DELETE | `/courses/:id` | Delete a course and its enrollments |
| POST | `/enrollments` | Enroll in a course |
| GET | `/enrollments?email=user@example.com` | List a user's enrollments |
| GET | `/enrollments/check?email=...&courseId=...` | Check enrollment |
| DELETE | `/enrollments` | Remove an enrollment |
| POST | `/courses/:id/reviews` | Add a course review |
| GET | `/courses/:id/reviews` | List course reviews |

Successful paginated course responses have this shape:

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

Invalid input returns a JSON response containing a `message` field. Unexpected server errors return status `500` without exposing internal details.
