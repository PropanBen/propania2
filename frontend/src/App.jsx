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
				credentials: "include",
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
			startGame(account_id, () => {
				// Callback bei Logout
				setAccount(null);
				setAccount_id(null);
				destroyGame();
			});
		}
		return () => {
			destroyGame();
		};
	}, [account]);

	if (!account) return <Login onLogin={setAccount} />;

	return (
		<div>
			<div id="game-container" style={{ width: "100%", height: "100%" }}></div>
		</div>
	);
}

export default App;
