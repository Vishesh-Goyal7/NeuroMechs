const express = require("express");
const fs = require("fs");
const { exec } = require("child_process");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
app.use(bodyParser.json());
app.use(require("cors")());

const PORT = 6969;

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

    const emptyMedibot = { date: new Date().toISOString().slice(0, 10), input_symptoms: {} };
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
  exec("../venv/bin/python3 nlp_input_convert.py", (err1) => {
    if (err1) return res.status(500).json({ error: "NLP step failed", details: err1.message });

    exec("../venv/bin/python3 T2S6EI.py", (err2) => {
      if (err2) return res.status(500).json({ error: "Prediction step failed", details: err2.message });

      exec("../venv/bin/python3 Watson\\ group\\ summary.py", (err3) => {
        if (err3) return res.status(500).json({ error: "Summary generation failed", details: err3.message });

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
