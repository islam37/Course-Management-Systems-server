require("dotenv").config();

const app = require("./app");
const {
  closeDatabaseConnection,
  connectToDatabase
} = require("./config/database");

const port = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectToDatabase();

    const server = app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });

    const shutdown = async (signal) => {
      console.log(`${signal} received. Shutting down server...`);
      server.close(async () => {
        await closeDatabaseConnection();
        process.exit(0);
      });
    };

    process.once("SIGINT", () => shutdown("SIGINT"));
    process.once("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("Failed to start server:", error);
    await closeDatabaseConnection();
    process.exit(1);
  }
}

startServer();
