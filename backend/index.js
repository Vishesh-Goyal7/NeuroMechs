const express = require("express");
const fs = require("fs");
const { exec } = require("child_process");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
app.use(bodyParser.json());
app.use(require("cors")());

const PORT = 6969;

app.post("/process", async (req, res) => {
  const inputPath = path.join(__dirname, "input.json");

  // 1. Save incoming JSON to input.json
  fs.writeFileSync(inputPath, JSON.stringify(req.body, null, 2));

  // 2. Run NLP processor
  exec("../venv/bin/python3 nlp_input_convert.py", (err1) => {
    if (err1) return res.status(500).json({ error: "NLP step failed", details: err1.message });

    // 3. Run Prediction + SHAP
    exec("../venv/bin/python3 T2S6EI.py", (err2) => {
      if (err2) return res.status(500).json({ error: "Prediction step failed", details: err2.message });

      // 4. Run Summary Generator
      exec("../venv/bin/python3 Watson\\ group\\ summary.py", (err3) => {
        if (err3) return res.status(500).json({ error: "Summary generation failed", details: err3.message });

        // 5. Return the final summary JSON
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