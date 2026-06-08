const serverless = require("serverless-http");
const app = require("../lib/app");

const handler = serverless(app);

module.exports = handler;
module.exports.handler = handler;
