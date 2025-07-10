require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const fs = require("fs");
const { exec } = require("child_process");
const bodyParser = require("body-parser");
const path = require("path");
const PDFDocument = require('pdfkit');
const authMiddleware = require('./middlewares/authMiddleware');
const { type } = require("os");

const app = express();
app.use(cors({
  credentials: true,
  allowedHeaders: ["Authorization", "Content-Type", "X-Doctor-Email"]
}));
app.use(express.json());

const PORT = process.env.PORT || 6969;

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: {type:String, required: true, enum: ["DOCTOR", "PATIENT"]}
});
const User = mongoose.model("User", userSchema);

const PatientSchema = new mongoose.Schema({
  doctorEmail : String,
  name: String,
  email: String,
  age: Number,
  gender: String,
  results: Object,
  prescription: String,
  createdAt: { type: Date, default: Date.now },
});
const Patient = mongoose.model('Patient', PatientSchema);

const sessionFiles = [
  "medibot_result.json",
  "input.json"
];

app.post('/login-doctor', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: "User not found" });
    if(user.role !== 'DOCTOR') return res.status(402).json({error: "User not a doctor"});

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(403).json({ error: "Incorrect password" });

    const token = jwt.sign(
      { username : user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.status(200).json({ message: "Login successful", token, username });
  } catch (err) {
    res.status(500).json({ error: "Login failed", details: err.message });
  }
});

app.post('/login-patient', async(req, res) => {
  const {username, password} = req.body;
  
  try {
    const user = await User.findOne({ username });
    if(!user) return res.status(401).json({ error: "User not found" });
    if(user.role !== 'PATIENT') return res.status(402).json({ error: "User not a patient" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(403).json({ error: "Incorrect password" });

    const token = jwt.sign(
      { username : user.username, role : user.role },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );
    res.status(200).json({ message: "Login successful", token, username });
  } catch (err) {
    res.status(500).json({ error: "Login failed", details: err.message });
  }

});

app.post('/register-doctor', async (req, res) => {
  const { username, password } = req.body;
  try {
    const existing = await User.findOne({ username });
    if (existing) return res.status(409).json({ error: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashed, role: "DOCTOR" });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: "Registration failed", details: err.message });
  }
});

app.post('/register-patient', async(req, res) => {
  const { username, password } = req.body;
  try {
    const isPatient = await Patient.findOne({ email: username});
    if(!isPatient) return res.status(500).json({error:"error"});
    const existing = await User.findOne({ username });
    if (existing) return res.status(409).json({ error: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashed, role: "PATIENT" });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(510).json({ error: "Registration failed", details: err.message });
  }
});

app.post('/session/start', authMiddleware, (req, res) => {
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

app.post('/chat', authMiddleware, (req, res) => {
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

app.post('/process', authMiddleware, async (req, res) => {
  exec("../venv/bin/python3.10 nlp_input_convert.py", (err1) => {
    if (err1) return res.status(500).json({ error: "NLP step failed", details: err1.message });
    console.log("nlp_input_convert.py finished");

    exec("../venv/bin/python3.10 T2S6EI.py", { cwd: __dirname }, (err2, stdout, stderr) => {
      console.log("T2S6EI.py finished");
      if (err2) {
        console.error(stderr);
        return res.status(500).json({ error: "Prediction step failed", details: err2.message, stderr });
      }
      console.log(stdout);

      exec("../venv/bin/python3.10 watsonGroupSummary.py", (err3, stdout3, stderr3) => {
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

app.post('/api/download', authMiddleware, async (req, res) => {
  try {
    const { doctorEmail, name, email, age, gender, results, prescription } = req.body;
    
    const patient = await Patient.create({ doctorEmail, name, email, age, gender, results, prescription });

    const doc = new PDFDocument();
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=patient_report.pdf');
      res.send(pdfBuffer);
    });

    doc.fontSize(18).text('Patient Report', { align: 'center' }).moveDown();
    doc.fontSize(12).text(`Name: ${name}`);
    doc.text(`Email: ${email}`);
    doc.text(`Age: ${age}`);
    doc.text(`Gender: ${gender}`);
    doc.moveDown().text('Diagnosis Results:');
    Object.entries(results || {}).forEach(([k, v]) => doc.text(`${k}: ${v}`));
    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.post('/api/records-doctor', authMiddleware, async(req, res) => {
  try {
    const {doctorEmail} = req.body;
    
    const records = await Patient.find({doctorEmail});

    if(records){
      res.status(200).json({message : "records fetched", records});
    } else {
      res.status(404).json({message : "no records found"});
    }
  } catch (error) {
    console.error("Record fetch failed:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post('/api/records-patient', authMiddleware, async(req, res) => {
  try {
    const {email} = req.body;
    
    const records = await Patient.find({email});

    if(records){
      res.status(200).json({message : "records fetched", records});
    } else {
      res.status(404).json({message : "no records found"});
    }
  } catch (error) {
    console.error("Record fetch failed:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`Pipeline server running on port ${PORT}`));