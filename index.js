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

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
