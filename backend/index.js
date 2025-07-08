require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const fs = require("fs");
const { exec } = require("child_process");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 6969;

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

// User schema and model
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true }
});
const User = mongoose.model("User", userSchema);

// Register user
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const existing = await User.findOne({ username });
    if (existing) return res.status(409).json({ error: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashed });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: "Registration failed", details: err.message });
  }
});

// Login user
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Incorrect password" });

    res.status(200).json({ message: "Login successful" });
  } catch (err) {
    res.status(500).json({ error: "Login failed", details: err.message });
  }
});

// Medibot session routes
const sessionFiles = [
  "medibot_result.json",
  "input.json"
];

app.post("/session/start", (req, res) => {
  try {
    sessionFiles.forEach(file => {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    const emptyMedibot = {
      date: new Date().toISOString().slice(0, 10),
      input_symptoms: {}
    };
    fs.writeFileSync(path.join(__dirname, "input.json"), JSON.stringify(emptyMedibot, null, 2));
    res.status(200).json({ message: "Session initialized successfully." });
  } catch (err) {
    console.error("Session initialization failed:", err);
    res.status(500).json({ error: "Failed to initialize session." });
  }
});

app.post("/chat", (req, res) => {
  const inputPath = path.join(__dirname, "input.json");
  const { symptom, score } = req.body;

  if (!symptom || score === undefined) {
    return res.status(400).json({ error: "Missing symptom or score" });
  }

  try {
    let inputData = { input_symptoms: {} };

    if (fs.existsSync(inputPath)) {
      const rawData = fs.readFileSync(inputPath, "utf8");
      inputData = JSON.parse(rawData);
    }

    inputData.input_symptoms[symptom] = score;

    fs.writeFileSync(inputPath, JSON.stringify(inputData, null, 2));
    res.status(200).json({ message: "Symptom added", updated: inputData });
  } catch (err) {
    console.error("Chat input append failed:", err);
    res.status(500).json({ error: "Failed to append symptom." });
  }
});

app.post("/process", async (req, res) => {
  exec("../.venv/bin/python3 nlp_input_convert.py", (err1) => {
    if (err1) return res.status(500).json({ error: "NLP step failed", details: err1.message });
    console.log("nlp_input_convert.py finished");

    exec("../.venv/bin/python3 T2S6EI.py", { cwd: __dirname }, (err2, stdout, stderr) => {
      console.log("T2S6EI.py finished");
      if (err2) {
        console.error(stderr);
        return res.status(500).json({ error: "Prediction step failed", details: err2.message, stderr });
      }
      console.log(stdout);

      exec("../.venv/bin/python3 watsonGroupSummary.py", (err3, stdout3, stderr3) => {
        console.log("Watson group summary.py finished");
        if (err3) return res.status(500).json({ error: "Summary generation failed", details: err3.message });
        console.log(5678);

        const summaryPath = path.join(__dirname, "shap_outputs", "shap_explanation_summary.json");
        if (fs.existsSync(summaryPath)) {
          const summary = fs.readFileSync(summaryPath, "utf8");
          res.status(200).json({ message: "Success", summary: JSON.parse(summary) });
        } else {
          res.status(500).json({ error: "Summary file not found" });
        }
      });
    });
  });
});

app.listen(PORT, () => console.log(`Pipeline server running on port ${PORT}`));