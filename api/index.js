const app = require("../lib/app");

if (process.env.NETLIFY) {
    const serverless = require("serverless-http");
    const handler = serverless(app);
    module.exports = handler;
    module.exports.handler = handler;
} else {
    // Vercel expects the raw Express app (request listener)
    module.exports = app;
}
