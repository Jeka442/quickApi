const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors({ allowedHeaders: "*" }));
app.use(express.json());

let storedJson = {}; // To store the JSON received from the app

// Endpoint to receive JSON from the Electron app
app.post("/upload-json", (req, res) => {
  storedJson = req.body;
  res.send({ status: "JSON stored successfully" });
});

// Endpoint to serve the stored JSON
app.get("/", (req, res) => {
  res.json(storedJson);
});

const PORT = 3020;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
