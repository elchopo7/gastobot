const express = require("express");

// Vercel looks for an entrypoint that imports Express directly.
// We keep the real app in server/app.js and load it here for deployment.
module.exports = require("./server/app");
