const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(bodyParser.json());
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB:", err));

// Define a schema and model for leaderboard entries
const leaderboardSchema = new mongoose.Schema({
  email: { type: String, required: true },
  score: { type: Number, required: true },
});

const Leaderboard = mongoose.model("Leaderboard", leaderboardSchema);

// Route to submit quiz results
app.post("/submit-score", async (req, res) => {
  const { email, score } = req.body;

  if (!email || typeof score !== "number") {
    return res.status(400).json({ error: "Invalid data provided" });
  }

  try {
    // Add the user's email and score to the database
    const entry = new Leaderboard({ email, score });
    await entry.save();

    res.status(200).json({ message: "Score submitted successfully!" });
  } catch (error) {
    console.error("Error saving score:", error);
    res.status(500).json({ error: "Failed to save score" });
  }
});

// Route to fetch leaderboard
app.get("/leaderboard", async (req, res) => {
  try {
    // Retrieve leaderboard sorted by score in descending order
    const leaderboard = await Leaderboard.find().sort({ score: -1 }).limit(10);
    res.status(200).json(leaderboard);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
