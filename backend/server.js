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

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");

// User Schema
const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String
});
const User = mongoose.model("User", userSchema);

// User Registration
app.post("/register",
    [
        body("email").isEmail(),
        body("password").isLength({ min: 6 })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        res.json({ message: "User registered successfully!" });
    }
);

// User Login
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)return res.status(400).json({ error: "User does not exist. Please register first." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Incorrect password. Try again." });

    const token = jwt.sign({ userId: user._id }, "secretkey", { expiresIn: "1h" });
    res.json({ message :"Login Successful" });
});

// Middleware for Protected Routes
const authMiddleware = (req, res, next) => {
    const token = req.header("Authorization");
    if (!token) return res.status(401).json({ message: "Access Denied" });

    try {
        const decoded = jwt.verify(token, "secretkey");
        req.user = decoded;
        next();
    } catch (err) {
        res.status(400).json({ message: "Invalid Token" });
    }
};

// Update `/add` and `/history` to require authentication
app.post("/add", authMiddleware, async (req, res) => {
    const { num1, num2 } = req.body;
    const result = num1 + num2;

    const newSum = new Sum({ num1, num2, result });
    await newSum.save();

    res.json({ result });
});

app.get("/history", authMiddleware, async (req, res) => {
    const history = await Sum.find().sort({ _id: -1 });
    res.json(history);
});


// Route to Clear History
app.delete("/clear-history", async (req, res) => {
    try {
        await Sum.deleteMany({});
        res.json({ message: "History cleared!" });
    } catch (error) {
        res.status(500).json({ error: "Failed to clear history" });
    }
});

// Start Server
app.listen(5000, () => console.log("Server running on port 5000"));
