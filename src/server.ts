import express from "express";
import cors from "cors";
import path from "path";
import { appConfig } from "./config";
import { routes } from "./routes";
import { errorHandler } from "./middleware/error.middleware";

const app = express();
const port = appConfig.port;

// Middleware
app.use(cors());
app.use(express.json());

// Static file serving for output files
app.use("/output", express.static(path.join(__dirname, "..", "output")));

// API routes
app.use("/api", routes);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});