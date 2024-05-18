const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();
const { connectDB } = require("./database/connection");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const initializeSocket = require("./socket");
dotenv.config({ path: ".env" });
// Use CORS for development
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
connectDB();
app.use(cookieParser());

// API routes
const indexRoutes = require("./router/router");
app.use("/", indexRoutes);

// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, "..", "frontend", "build")));

// Handle unknown routes and serve the frontend's index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "build", "index.html"));
});

const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

const io = initializeSocket(server);
