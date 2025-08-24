import React, { useState, useEffect } from 'react';
import Login from './login.jsx';
import { startGame, destroyGame } from './game.jsx';

function App() {
	const [account, setAccount] = useState(null);
	const [account_id, setAccount_id] = useState(null);

	const checkAuth = async () => {
		try {
			const res = await fetch('http://localhost:3001/api/auth/me', {
				credentials: 'include', // Cookie wird automatisch gesendet
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
			console.error(err);
			setAccount(null);
			setAccount_id(null);
		}
	};

	useEffect(() => {
		checkAuth();
		if (account) {
			startGame(account_id);
		}
	}, [account]);

	if (!account) {
		return <Login onLogin={setAccount} />;
	}

	return (
		<div>
			<button
				onClick={async () => {
					await fetch('http://localhost:3001/api/auth/logout', {
						method: 'POST',
						credentials: 'include',
					});
					setAccount(null);
					destroyGame();
				}}
			>
				Logout
			</button>
			<div
				id="game-container"
				style={{ width: '100vw', height: '100vh', visibility: 'visible' }}
			></div>
		</div>
	);
}

export default App;
