import React, { useState } from 'react';

export default function Login({ onLogin }) {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);

	const handleLogin = async (e) => {
		e.preventDefault();
		setLoading(true);
		try {
			const response = await fetch('http://localhost:3001/api/auth/login', {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
			});

			const data = await response.json();

			if (response.ok) {
				onLogin(email);
			} else {
				alert(data.message || 'Login fehlgeschlagen!');
			}
		} catch (err) {
			console.error(err);
			alert('Serverfehler!');
		} finally {
			setLoading(false);
		}
	};

	const handleRegister = async () => {
		if (!email || !password) {
			alert('Bitte Email und Passwort ausfüllen!');
			return;
		}
		setLoading(true);
		try {
			const response = await fetch('http://localhost:3001/api/auth/register', {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
			});

			const data = await response.json();

			if (response.ok) {
				onLogin(email);
				alert('Registrierung erfolgreich!');
			} else {
				alert(data.message || 'Registrierung fehlgeschlagen!');
			}
		} catch (err) {
			console.error(err);
			alert('Serverfehler!');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				height: '100vh',
				backgroundColor: 'rgba(0,0,0,0.1)',
			}}
		>
			<form
				onSubmit={handleLogin}
				style={{
					display: 'flex',
					flexDirection: 'column',
					gap: '1rem',
					padding: '2rem',
					borderRadius: '12px',
					backgroundColor: 'white',
					width: '90%',
					maxWidth: '400px',
					boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
				}}
			>
				<input
					type="email"
					placeholder="E-Mail"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					style={{
						padding: '0.75rem',
						borderRadius: '8px',
						border: '1px solid #ccc',
					}}
				/>
				<input
					type="password"
					placeholder="Passwort"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					style={{
						padding: '0.75rem',
						borderRadius: '8px',
						border: '1px solid #ccc',
					}}
				/>
				<button
					type="submit"
					disabled={loading}
					style={{
						padding: '0.75rem',
						borderRadius: '8px',
						border: 'none',
						backgroundColor: '#4f46e5',
						color: 'white',
						fontWeight: 'bold',
						cursor: 'pointer',
						opacity: loading ? 0.6 : 1,
					}}
				>
					{loading ? 'Logging in...' : 'Login'}
				</button>
				<button
					type="button"
					onClick={handleRegister}
					disabled={loading}
					style={{
						padding: '0.75rem',
						borderRadius: '8px',
						border: 'none',
						backgroundColor: '#10b981',
						color: 'white',
						fontWeight: 'bold',
						cursor: 'pointer',
						opacity: loading ? 0.6 : 1,
					}}
				>
					{loading ? 'Registrieren...' : 'Registrieren'}
				</button>
			</form>
		</div>
	);
}
