const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const PDFDocument = require('pdfkit');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb+srv://NeuroMechs:NeuroMechs123@neuromechs.suiv8vh.mongodb.net/?retryWrites=true&w=majority&appName=NeuroMechs', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Schema + model
const PatientSchema = new mongoose.Schema({
  name: String,
  email: String,
  age: Number,
  gender: String,
  results: Object,
  createdAt: { type: Date, default: Date.now },
});
const Patient = mongoose.model('Patient', PatientSchema);

// API route
app.post('/api/download', async (req, res) => {
  try {
    const { name, email, age, gender, results } = req.body;
    const patient = await Patient.create({ name, email, age, gender, results });

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

// Start server
const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Backend running at http://localhost:${PORT}`));
