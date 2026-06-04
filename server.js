const express = require("express");
const app = require("./lib/app");

app.use(express.static(__dirname));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Secured server running on port ${PORT}`);
});
