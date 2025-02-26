const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/sumdb", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// Define Schema & Model
const sumSchema = new mongoose.Schema({
    num1: Number,
    num2: Number,
    result: Number,
    timestamp: { type: Date, default: Date.now },});
const Sum = mongoose.model("Sum", sumSchema);

// Route to Add Numbers
app.post("/add", async (req, res) => {
    const { num1, num2 } = req.body;
    const result = num1 + num2;

    // Save to Database
    const newSum = new Sum({ num1, num2, result });
    await newSum.save();

    res.json({ result });
});

// Route to Fetch History
app.get("/history", async (req, res) => {
    const history = await Sum.find().sort({ _id: -1 });
    res.json(history);
});

// Start Server
app.listen(5000, () => console.log("Server running on port 5000"));
