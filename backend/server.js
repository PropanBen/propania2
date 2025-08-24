import express from 'express';
import cors from 'cors';
import https from 'https';
import http from 'http';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import authRouter from './routes/auth.js';
import playersRouter from './routes/players.js';
import { initGameServer } from './network/gameserver.js';

dotenv.config();

const app = express();
const SERVER_PORT = process.env.SERVER_PORT || 3001;

// SSL-Zertifikate einbinden
const sslOptions = {
	key: fs.readFileSync('./certs/privkey.pem'),
	cert: fs.readFileSync('./certs/fullchain.pem'),
};

const allowedOrigins = [
	'http://localhost:8080',
	'https://localhost:8080',
	'http://api.propania2.de',
	'https://api.propania2.de',
];

const corsOptions = {
	origin: (origin, callback) => {
		if (!origin) return callback(null, true);
		if (allowedOrigins.includes(origin)) callback(null, true);
		else callback(new Error('Not allowed by CORS'));
	},
	methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
	credentials: true,
	optionsSuccessStatus: 204,
	allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Routen
app.use('/api/auth', authRouter);
app.use('/api/', playersRouter);

app.get('/', (req, res) => {
	res.send('API is running');
});

// Server starten
const isProd = process.env.NODE_ENV === 'production';
const server = isProd
	? https.createServer(sslOptions, app)
	: http.createServer(app);

// Socket.IO-Server
const io = new Server(server, {
	cors: {
		origin: allowedOrigins,
		methods: ['GET', 'POST'],
		credentials: true,
		allowedHeaders: ['Content-Type', 'Authorization'],
	},
});

// Spiel-Server initialisieren
initGameServer(io);

server.listen(SERVER_PORT, () => {
	console.log(
		`${
			isProd ? 'HTTPS' : 'HTTP'
		} Server & Socket.IO running on port ${SERVER_PORT}`
	);
});
