const express = require("express");
const cors = require("cors");
const app = express();
const path = require("path");
const fs = require("fs");

app.use(cors({ allowedHeaders: "*" }));
app.use(express.json());

let storedJson = {}; // To store the JSON received from the app

const dbPath = path.join(__dirname, "db.json");
async function getDb() {
  try {
    const data = JSON.parse(fs.readFileSync(dbPath, "utf8"));
    return data;
  } catch {
    return [];
  }
}

// all endpoints
app.get("/", async (req, res) => {
  const db = await getDb();
  res.send(db.map((x) => x.name));
});

app.get("/name/:id", async (req, res) => {
  const db = await getDb();
  const result = db.find((item) => item.name === req.params.id);
  if (result) {
    res.json(result);
    return;
  } else {
    res.status(404).send("not found");
  }
});

app.get("/api/:id", async (req, res) => {
  await handleRequest(req, res);
});

app.post("/api/:id", async (req, res) => {
  await handleRequest(req, res);
});

async function handleRequest(req, res) {
  try {
    const db = await getDb();
    const result = db.find((item) => item.name === req.params.id);

    if (!result) {
      return res.status(404).send("not found");
    }

    const delay = parseInt(result.delay ?? 0);
    const status = parseInt(result.status ?? 200);
    if (delay > 0) {
      await sleep(delay);
    }
    res.status(status).json(result.obj);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Internal Server Error");
  }
}



const sleep = async (delay) => {
  return new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
};

// sets a new endpoint
app.post("/name", async (req, res) => {
  const { name } = req.body;
  const db = await getDb();
  if (db.find((x) => x.name === name)) {
    res.sendStatus(409);
    return;
  }
  db.push({ name, obj: {}, status: 200, delay: 0 });
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 3));
  res.sendStatus(201);
});

app.patch("/name", async (req, res) => {
  const { name, newName } = req.body;
  const db = await getDb();
  if (db.find((x) => x.name === name)) {
    if (db.find((x) => x.name === newName)) {
      return res.sendStatus(409);
    }

    let newDb = db.map((item) => {
      if (item.name === name) {
        item.name = newName;
      }
      return item;
    });
    fs.writeFileSync(dbPath, JSON.stringify(newDb, null, 3));
    res.status(200).send();
    return;
  }
  res.status(404).send("not found");
});

// add data to an object
app.post("/setData", async (req, res) => {
  let db = await getDb();
  if (!db.find((x) => x.name === req.body.name))
    return res.status(404).send("not found");
  db = db.map((item) => {
    if (item.name === req.body.name) {
      item.obj = req.body.obj;
      item.status = req.body.status;
      item.delay = req.body.delay;
    }
    return item;
  });
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 3));
  res.status(200).send("ok");
});

const PORT = 3020;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.delete("/", async (req, res) => {
  fs.writeFileSync(dbPath, JSON.stringify([], null, 3));
  res.status(200).send("done");
});

app.delete("/:name", async (req, res) => {
  let db = await getDb();
  db = db.filter((item) => item.name != req.params.name);
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 3));
  res.status(200).send("deleted");
});
