import React, { useState, useEffect } from "react";
import Login from "./login.jsx";
import { startGame, destroyGame } from "./game.jsx";
import "./App.css";
import API_BASE from "./config/api";

function App() {
	const [account, setAccount] = useState(null);
	const [account_id, setAccount_id] = useState(null);

	const checkAuth = async () => {
		try {
			const res = await fetch(`${API_BASE}/api/auth/me`, {
				credentials: "include", // Cookie wird automatisch gesendet
			});
			if (res.ok) {
				const data = await res.json();
				setAccount(data.email);
				setAccount_id(data.id);
			} else {
				setAccount(null);
				setAccount_id(null);
			}
		} catch (err) {
			console.error("Auth check failed:", err);
			setAccount(null);
			setAccount_id(null);
		}
	};

	useEffect(() => {
		checkAuth();
		if (account) {
			startGame(account_id);
		}
		// Cleanup optional: Game zerstören beim Unmount
		return () => {
			destroyGame();
		};
	}, [account]);

	const handleLogout = async () => {
		try {
			await fetch(`${API_BASE}/api/auth/logout`, {
				method: "POST",
				credentials: "include",
			});
		} catch (err) {
			console.error("Logout failed:", err);
		} finally {
			setAccount(null);
			setAccount_id(null);
			destroyGame();
		}
	};

	if (!account) {
		return <Login onLogin={setAccount} />;
	}

	return (
		<div>
			<button onClick={handleLogout}>Logout</button>
			<div id="game-container" style={{ width: "100vw", height: "100vh", visibility: "visible" }}></div>
		</div>
	);
}

export default App;
