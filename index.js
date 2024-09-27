const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
const { default: mongoose } = require("mongoose");
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//Creating Schemas
const logSchema = new mongoose.Schema({
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});
const User = mongoose.model(
  "User",
  new mongoose.Schema({
    username: { type: String, required: true },
    exerciseLogs: { type: [logSchema], default: [] },
  })
);

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post("/api/users", async (req, res) => {
  const user = req.body.username;
  if (user) {
    try {
      const newUser = User({ username: user });
      const saveUser = await newUser.save();
      res.status(201).json({ username: saveUser.username, _id: saveUser._id });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Server Error" });
    }
  } else {
    res.status(400).json({ error: "Please Enter Valid User Name" });
  }
});

app.get("/api/users/", async (req, res) => {
  try {
    const findUser = await User.find({}, { username: 1, _id: 1 });
    const data = [...findUser];
    res.status(200).json(data);
  } catch (error) {
    console.log(error);
  }
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  console.log(req.body);

  console.log(req.params._id);
  const _id = req.params._id;

  const { description, duration, date } = req.body;

  if (!description || !duration) {
    console.log("error");
    return res.json({ error: "Please Enter required fields." });
  }
  const exerciseDate = date ? new Date(date) : new Date();
  const newLog = {
    description,
    duration: Number(duration),
    date: exerciseDate,
  };
  try {
    const updateLog = await User.findByIdAndUpdate(
      _id,
      {
        $push: { exerciseLogs: newLog },
      },
      { new: true, runValidators: true }
    );
    if (!updateLog) {
      console.log(error);
      return res.json({ error: "Error Updating log" });
    }

    const lastLog = updateLog.exerciseLogs[updateLog.exerciseLogs.length - 1];
    return res.json({
      _id: updateLog._id,
      username: updateLog.username,
      date: new Date(lastLog.date).toDateString(),
      duration: lastLog.duration,
      description: lastLog.description,
    });
  } catch (error) {
    console.log(error);
    res.json({ error: error });
  }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const _id = req.params._id;
  const { from, to, limit } = req.query;
  console.log(from, to, limit);

  try {
    const user = await User.findById(_id);
    if (!user) return res.json({ error: "User not found." });
    let exerciseLogs = user.exerciseLogs;

    if (from) {
      exerciseLogs = exerciseLogs.filter(
        (log) => new Date(log.date).getTime() >= new Date(from).getTime()
      );
    }
    if (to) {
      exerciseLogs = exerciseLogs.filter(
        (log) => new Date(log.date).getTime() <= new Date(to).getTime()
      );
    }
    if (limit) {
      exerciseLogs = exerciseLogs.slice(0, Number(limit));
    }

    res.json({
      username: user.username,
      count: exerciseLogs.length,
      _id: user._id,
      log: exerciseLogs.map((log) => ({
        description: log.description,
        duration: log.duration,
        date: new Date(log.date).toDateString(),
      })),
    });
  } catch (error) {
    console.error(error);
    if (error.name === "CastError") {
      return res.status(400).json({ error: "Invalid ID format" });
    }
    res.json({ error: "Server Error", name: error.name });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
