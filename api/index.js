const serverless = require("serverless-http");
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// Middleware to serve static files
app.use((req, res, next) => {
    const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2'];
    const ext = path.extname(req.path);
    
    if (staticExtensions.includes(ext)) {
        const filePath = path.join(__dirname, '..', req.path);
        try {
            const file = fs.readFileSync(filePath);
            res.setHeader('Content-Type', getContentType(ext));
            return res.send(file);
        } catch (e) {
            return res.status(404).json({ error: 'File not found' });
        }
    }
    next();
});

function getContentType(ext) {
    const types = {
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2'
    };
    return types[ext] || 'application/octet-stream';
}

const DEFAULT_USERNAME = process.env.DEFAULT_USERNAME || "admin";
const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || "Admin@123456";

app.post(["/api/login", "/login"], (req, res) => {
    console.log("API login hit", {
        path: req.path,
        origin: req.headers.origin,
        body: req.body
    });

    const { username, password } = req.body || {};

    if (!username || !password) {
        return res.status(400).json({ success: false, error: "Username and password are required." });
    }

    if (username === DEFAULT_USERNAME && password === DEFAULT_PASSWORD) {
        return res.json({ success: true, message: "Login successful" });
    }

    return res.status(401).json({ success: false, error: "Invalid username or password." });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});

// Serve index.html for SPA routes
app.get("*", (req, res) => {
    try {
        const indexPath = path.join(__dirname, '..', 'index.html');
        const html = fs.readFileSync(indexPath, 'utf-8');
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (e) {
        console.error('Error serving index.html:', e);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = serverless(app);
