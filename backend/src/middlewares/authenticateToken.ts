// src/middlewares/authenticateToken.ts
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/app.js';
import type { User } from 'src/types/user.type';

export interface AuthenticatedRequest extends Request {
	user?: User;
}

export function authenticateToken(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): void {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];

	if (!token) {
		res.status(401).json({ message: 'Kein Token bereitgestellt' });
		return;
	}

	jwt.verify(token, ENV.JWT_SECRET, (err, user) => {
		if (err) {
			return res.status(403).json({ message: 'Ungültiger Token' });
		}

		req.user = user as User; // Typ setzen
		next();
	});
}
