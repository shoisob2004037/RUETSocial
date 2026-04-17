import express from "express"
import bodyParser from "body-parser"
import mongoose from "mongoose"
import dotenv from "dotenv"
import cors from "cors"
import http from "http"
import AuthRoute from "./Routes/AuthRoute.js"
import UserRoute from "./Routes/UserRoute.js"
import PostRoute from "./Routes/PostRoute.js"
import UploadRoute from "./Routes/UploadRoute.js"
import NotificationRoute from "./Routes/NotificationRoute.js"
import ChatRoute from "./Routes/ChatRoute.js"
import { setupSocketServer } from "./socket.js"

// ✅ MUST be first before anything uses process.env
dotenv.config()

const app = express()
const server = http.createServer(app)

// ✅ Now process.env.FRONTEND_URL will actually work
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,
      "https://ruet-social.vercel.app",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
    optionsSuccessStatus: 200,
  }),
)

app.use(bodyParser.json({ limit: "30mb", extended: true }))
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }))

const io = setupSocketServer(server)

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    server.listen(process.env.PORT, () => {
      console.log(`Server running on port : ${process.env.PORT}`)
      console.log("Connected to MongoDB")
    })
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error)
  })

app.use("/auth", AuthRoute)
app.use("/user", UserRoute)
app.use("/post", PostRoute)
app.use("/upload", UploadRoute)
app.use("/notifications", NotificationRoute)
app.use("/chat", ChatRoute)

app.use("/health", (req, res) => {
  res.status(200).send("OK")
})

app.use("/", (req, res) => {
  res.send("Welcome !")
})