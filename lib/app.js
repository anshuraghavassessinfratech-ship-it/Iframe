require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();

// Disable power identification headers for security
app.disable("x-powered-by");

app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                imgSrc: ["'self'", "data:"],
                frameSrc: ["'self'", process.env.METABASE_SITE_URL || "http://82.29.160.161:3000"],
                connectSrc: ["'self'", "http://localhost:5000", "http://127.0.0.1:5000", "http://localhost:3000"]
            }
        }
    })
);

app.use(cors({
    origin: '*',
    credentials: false
}));

app.use(express.json());

const METABASE_SITE_URL = process.env.METABASE_SITE_URL || "http://82.29.160.161:3000";
const METABASE_SECRET_KEY = process.env.METABASE_SECRET_KEY;
const SESSION_SECRET = process.env.SESSION_SECRET || "fallback_secret_if_not_provided";
const DEFAULT_USERNAME = process.env.DEFAULT_USERNAME || "admin";
const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || "Admin@123456";

if (!METABASE_SECRET_KEY) {
    console.warn("WARNING: METABASE_SECRET_KEY is not configured in environment variables!");
}

const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, // Increased to avoid deployment lockouts while testing
    message: { error: "Too many login attempts from this IP, please try again after 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false
});

const authenticateSession = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Access denied. Login required." });
    }

    jwt.verify(token, SESSION_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Session expired or invalid. Please login again." });
        }
        req.user = user;
        next();
    });
};

const handleLogin = (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required." });
    }

    if (username === DEFAULT_USERNAME && password === DEFAULT_PASSWORD) {
        const sessionToken = jwt.sign(
            { username: DEFAULT_USERNAME },
            SESSION_SECRET,
            { expiresIn: "2h" }
        );

        return res.json({
            success: true,
            token: sessionToken,
            username: DEFAULT_USERNAME,
            message: "Login successful!"
        });
    }

    return res.status(401).json({ error: "Invalid username or password." });
};

app.post(["/api/login", "/login", "/.netlify/functions/index/api/login"], loginRateLimiter, handleLogin);

app.get(["/api/verify-session", "/verify-session", "/.netlify/functions/index/api/verify-session"], authenticateSession, (req, res) => {
    res.json({ success: true, username: req.user.username });
});

app.get(["/api/metabase-token", "/metabase-token", "/.netlify/functions/index/api/metabase-token"], authenticateSession, (req, res) => {
    if (!METABASE_SECRET_KEY) {
        return res.status(500).json({ error: "Dashboard authentication is misconfigured on the server." });
    }

    const payload = {
        resource: { dashboard: 2 },
        params: {},
        exp: Math.round(Date.now() / 1000) + (10 * 60)
    };

    const token = jwt.sign(payload, METABASE_SECRET_KEY);
    const iframeUrl = `${METABASE_SITE_URL}/embed/dashboard/${token}#bordered=true&titled=true`;

    res.json({ iframeUrl, token });
});

app.get(["/api/health", "/health", "/.netlify/functions/index/api/health"], (req, res) => {
    res.json({ status: "ok" });
});

module.exports = app;
