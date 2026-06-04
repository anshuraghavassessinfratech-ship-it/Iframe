const express = require("express");
const app = require("./lib/app");

app.use(express.static(__dirname));

const DEFAULT_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const server = app.listen(DEFAULT_PORT, () => {
    console.log(`Secured server running on port ${DEFAULT_PORT}`);
});

server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
        const fallbackPort = DEFAULT_PORT + 1;
        console.warn(`Port ${DEFAULT_PORT} is already in use; trying ${fallbackPort} instead.`);
        app.listen(fallbackPort, () => {
            console.log(`Secured server running on port ${fallbackPort}`);
        });
        return;
    }

    console.error("Server error:", err);
    process.exit(1);
});
