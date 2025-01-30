// src/routes/protected.ts
import { Router } from 'express';
import type { AuthenticatedRequest } from '../middlewares/authenticateToken';
import { authenticateToken } from '../middlewares/authenticateToken.js';

const router = Router();

router.get(
	'/dashboard',
	authenticateToken,
	(req: AuthenticatedRequest, res) => {
		// Hier hat der Nutzer Zugriff
		res.json({ message: `Willkommen, ${req.user?.name}` });
	}
);

export default router;
