import React, { useState } from "react";
import bg from "./assets/ui/login-background.png";
import lb from "./assets/ui/login-button.png";
import p2 from "./assets/ui/propania2.png";

export default function Login({ onLogin }) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);

	// Dynamisch je nach env
	const API_URL =
		import.meta.env.VITE_APP_ENV === "production"
			? `https://${import.meta.env.VITE_API_URL}` // nur hier einmal https hinzufügen
			: `${import.meta.env.VITE_HOST_SERVER}:${import.meta.env.VITE_API_PORT}`;

	const handleLogin = async (e) => {
		e.preventDefault();
		setLoading(true);
		try {
			const response = await fetch(`${API_URL}/api/auth/login`, {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});

			const data = await response.json();

			if (response.ok) {
				onLogin(email);
			} else {
				alert(data.message || "Login fehlgeschlagen!");
			}
		} catch (err) {
			console.error(err);
			alert("Serverfehler!");
		} finally {
			setLoading(false);
		}
	};

	const handleRegister = async () => {
		if (!email || !password) {
			alert("Bitte Email und Passwort ausfüllen!");
			return;
		}
		setLoading(true);
		try {
			const response = await fetch(`${API_URL}/api/auth/register`, {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});

			const data = await response.json();

			if (response.ok) {
				onLogin(email);
				alert("Registrierung erfolgreich!");
			} else {
				alert(data.message || "Registrierung fehlgeschlagen!");
			}
		} catch (err) {
			console.error(err);
			alert("Serverfehler!");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				height: "100vh",
				backgroundColor: "rgba(0,0,0,0.1)",
				backgroundImage: `url(${bg})`,
				backgroundSize: "cover",
				backgroundPosition: "center",
				flexDirection: "column",
			}}
		>
			<img
				src={p2}
				alt="Bild"
				style={{
					width: "200px",
					height: "auto",
				}}
			/>
			<form
				onSubmit={handleLogin}
				style={{
					display: "flex",
					flexDirection: "column",
					gap: "1rem",
					padding: "2rem",
					borderRadius: "12px",
					color: "white",
					width: "90%",
					maxWidth: "400px",
					boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
					backgroundColor: "burlywood",
					border: "2px solid #000000ff",
				}}
			>
				<input
					type="email"
					placeholder="E-Mail"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					style={{
						padding: "0.75rem",
						borderRadius: "8px",
						border: "1px solid #ccc",
					}}
				/>
				<input
					type="password"
					placeholder="Passwort"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					style={{
						padding: "0.75rem",
						borderRadius: "8px",
						border: "1px solid #ccc",
					}}
				/>
				<button
					type="submit"
					disabled={loading}
					style={{
						padding: "0.75rem",
						borderRadius: "8px",
						border: "none",
						backgroundColor: "#856945ff",
						color: "black",
						fontWeight: "bold",
						cursor: "pointer",
						opacity: loading ? 0.6 : 1,
					}}
				>
					{loading ? "Logging in..." : "Login"}
				</button>
				<button
					type="button"
					onClick={handleRegister}
					disabled={loading}
					style={{
						padding: "0.75rem",
						borderRadius: "8px",
						border: "none",
						backgroundColor: "#856945ff",
						color: "black",
						fontWeight: "bold",
						cursor: "pointer",
						opacity: loading ? 0.6 : 1,
					}}
				>
					{loading ? "Registrieren..." : "Register"}
				</button>
			</form>
		</div>
	);
}
