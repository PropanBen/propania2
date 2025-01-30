// src/config/env.ts
import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
	JWT_SECRET: process.env.JWT_SECRET || 'fallbackSecretKey',
	APP_PORT: process.env.PORT || 3001,
	DB_HOST: process.env.DB_HOST || 'localhost',
	DB_USER: process.env.DB_USER || 'root',
	DB_PASSWORD: process.env.DB_PASSWORD || 'password',
	DB_DATABASE: process.env.DB_NAME || 'propania2',
	DB_PORT: process.env.DB_PORT || 3306,
	DB_CONNECTION_LIMIT: process.env.DB_CONNECTION_LIMIT || 5,
};
