const serverless = require("serverless-http");
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, "../")));

const DEFAULT_USERNAME = process.env.DEFAULT_USERNAME || "admin";
const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || "Admin@123456";

app.post("/api/login", (req, res) => {
    const { username, password } = req.body || {};

    if (!username || !password) {
        return res.status(400).json({ success: false, error: "Username and password are required." });
    }

    if (username === DEFAULT_USERNAME && password === DEFAULT_PASSWORD) {
        return res.json({ success: true, message: "Login successful" });
    }

    return res.status(401).json({ success: false, error: "Invalid username or password." });
});

app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});

module.exports = serverless(app);
