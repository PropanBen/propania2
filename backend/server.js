import express from "express";
import cors from "cors";
import https from "https"; // <- Korrekt: https statt http
import fs from "fs";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import dotenv from "dotenv";
import authRouter from "./routes/auth.js";
import playersRouter from "./routes/players.js";
import { initGameServer } from "./network/gameserver.js";

dotenv.config();

const app = express();
const SERVER_PORT = process.env.SERVER_PORT || 3001; // HTTPS Port

// SSL-Zertifikate einbinden
const sslOptions = {
	key: fs.readFileSync("./certs/privkey.pem"),
	cert: fs.readFileSync("./certs/fullchain.pem"),
};

const allowedOrigins = process.env.NODE_ENV === "development" ? ["http://localhost:8080"] : ["https://propania2.de"];

const corsOptions = {
	origin: function (origin, callback) {
		if (!origin || allowedOrigins.includes(origin)) {
			callback(null, true);
		} else {
			callback(new Error("Not allowed by CORS"));
		}
	},
	methods: ["GET", "POST"],
	allowedHeaders: ["Content-Type", "Authorization"],
	credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Routen
app.use("/api/auth", authRouter);
app.use("/api/", playersRouter);

app.get("/", (req, res) => {
	res.send("API is running");
});

// HTTPS-Server starten
const server = https.createServer(sslOptions, app); // <- Hier https.createServer

// Socket.IO-Server
const io = new Server(server, {
	cors: {
		origin: allowedOrigins,
		methods: ["GET", "POST"],
		credentials: true,
		allowedHeaders: ["Content-Type", "Authorization"],
		transports: ["websocket", "polling"],
	},
});

// Spiel-Server initialisieren
initGameServer(io);

server.listen(SERVER_PORT, () => {
	console.log(`HTTPS Server & Socket.IO running on port ${SERVER_PORT}`);
});
