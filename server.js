require("dotenv").config({ path: "./config/.env" });
const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const express = require("express");
const UserRoutes = require("./routes/userRoutes");
const PostRoutes = require("./routes/postRoutes");
const ChatRoutes = require("./routes/chatRoutes");
const MessageRoutes = require("./routes/messageRoutes");
// const csrf = require("csurf");
require("./config/db");
const cors = require("cors");

const app = express();

const corsOption = {
  origin: process.env.CLIENT_URL,
  Credential: true,
  allowedHeaders: ["sessionId", "content-Type"],
  exposedHeaders: ["sessionId"],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
};
app.use(cors({ credentials: true, origin: process.env.CLIENT_URL }));
app.use(cookieParser());
app.use(bodyParser.json()); // Transformer les body en json
// app.use(csrf());
app.use(
  "./client/public/image",
  express.static(path.join(__dirname, "./client/public/image"))
);
app.use(
  "./client/public/posts",
  express.static(path.join(__dirname, "./client/public/posts"))
);
app.use(bodyParser.urlencoded({ extended: true }));
// Middleware;
// app.use(csrf());
// app.use(
//   session({
//     secret: process.env.TOKEN_SECRETE,
//     resave: false,
//     saveUninitialized: false,
//     cookie: {
//       maxAge: 60 * 60 * 1000 * 168, // Durée de vie du cookie de session en millisecondes (ici, 30 minutes)
//     },
//   })
// );
// app.use(helmet());
// app.use(express.json());
// app.use(firewall.init());

// /*Configuration de firewall pour bloquer les requètes provénant d'Ip spécifiques */
// firewall.addRule("block", "ip", "deny", "1.2;3.4");

// Starting the server
// if (require.index === module) {
//   app.listen(process.env.PORT, () =>
//     console.log(`Example app listening on port ${process.env.PORT}!`)
//   );
// }
// require("./utils/test");
app.use(express.static(path.join(__dirname, "./client/build")));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "./client/build", "index.html"));
});
app.get("/profil", function (req, res) {
  res.sendFile(path.join(__dirname, "./client/build", "index.html"));
});
app.get("/edit_profil", function (req, res) {
  res.sendFile(path.join(__dirname, "./client/build", "index.html"));
});
app.get("/condition_generale", function (req, res) {
  res.sendFile(path.join(__dirname, "./client/build", "index.html"));
});
app.get("/verify/:id/activate/:token", function (req, res) {
  res.sendFile(path.join(__dirname, "./client/build", "index.html"));
});
app.get("/reset/:id/verify/:token", function (req, res) {
  res.sendFile(path.join(__dirname, "./client/build", "index.html"));
});
app.get("/home", function (req, res) {
  res.sendFile(path.join(__dirname, "./client/build", "index.html"));
});
app.get("/search", function (req, res) {
  res.sendFile(path.join(__dirname, "./client/build", "index.html"));
});
app.get("/user_profil/:id", function (req, res) {
  res.sendFile(path.join(__dirname, "./client/build", "index.html"));
});
app.get("/chat-box/:id/:id", function (req, res) {
  res.sendFile(path.join(__dirname, "./client/build", "index.html"));
});
app.get("/message", function (req, res) {
  res.sendFile(path.join(__dirname, "./client/build", "index.html"));
});
// routes
app.use("/api/user", UserRoutes);
app.use("/api/post", PostRoutes);
app.use("/api/chat", ChatRoutes);
app.use("/api/message", MessageRoutes);
app.use(express.static(path.join(__dirname, "./client")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build/index.html"));
});

//server
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
  },
});
app.listen(process.env.PORT || 7500, () => console.log(`Back is running`));
