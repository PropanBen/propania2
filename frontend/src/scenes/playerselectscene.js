import Phaser from "phaser";
import logoutImg from "../assets/ui/logout.png";
import Functions from "../assets/utils/functions.js";

export default class PlayerSelectScene extends Phaser.Scene {
	constructor(data) {
		super("PlayerSelectScene");
		this.onLogout = data.onLogout;
		this.players = [];
		this.selectedPlayer = null;
		this.account_id = data.account_id;
	}

	preload() {
		this.load.image("logout", logoutImg);
	}

	create() {
		this.add.text(window.innerWidth / 2 - 200, window.innerHeight / 2 - 300, "Select your Player", {
			color: "#ffffffff",
			fontFamily: "Pixel Code",
			fontSize: "36px",
		});

		const logoutbtn = this.add
			.image(window.innerWidth - 50, 50, "logout")
			.setScale(4)
			.setOrigin(1, 0) // rechts oben ausrichten
			.setInteractive({ useHandCursor: true }); // wichtig: Input korrekt aktivieren
		logoutbtn.on("pointerdown", async () => {
			try {
				const API_BASE = import.meta.env.PROD
					? `${import.meta.env.VITE_API_PROTOKOLL}://${import.meta.env.VITE_API_URL}`
					: `${import.meta.env.VITE_API_PROTOKOLL}://${import.meta.env.VITE_HOST_SERVER}:${import.meta.env.VITE_API_PORT}`;

				await fetch(`${API_BASE}/api/auth/logout`, {
					method: "POST",
					credentials: "include",
				});
			} catch (err) {
				console.error("Logout failed:", err);
			} finally {
				if (this.scene.isActive("UIScene")) this.scene.stop("UIScene");
				if (this.scene.isActive("GameScene")) this.scene.stop("GameScene");

				if (this.onLogout) this.onLogout(); // React Callback
			}
		});

		this.loadPlayers();
		this.renderPlayerCreation();
	}

	async loadPlayers() {
		const API_URL = import.meta.env.PROD
			? `${import.meta.env.VITE_API_PROTOKOLL}://${import.meta.env.VITE_API_URL}`
			: `${import.meta.env.VITE_API_PROTOKOLL}://${import.meta.env.VITE_HOST_SERVER}:${import.meta.env.VITE_API_PORT}`;

		try {
			const res = await fetch(`${API_URL}/api/players`, {
				credentials: "include",
			});

			if (!res.ok) {
				const errText = await res.text();
				throw new Error(`HTTP ${res.status}: ${errText}`);
			}

			const data = await res.json();
			this.players = data;

			this.renderPlayerList();
		} catch (err) {
			console.error("Error loadPlayers:", err);
			this.add
				.text(window.innerWidth / 2 - 200, window.innerHeight / 2 - 300, "Error when loading the players", {
					fontSize: "40px",
					color: "#ff0000",
					fontFamily: "Pixel Code",
				})
				.setInteractive();
		}
	}

	renderPlayerList() {
		let y = 120;

		this.players.forEach((player) => {
			const playerText = this.add
				.text(window.innerWidth / 2 - 200, window.innerHeight / 2 + y - 300, `${player.name}`, {
					fontSize: "40px",
					color: "#ffffffff",
					fontFamily: "Pixel Code",
					backgroundColor: "#748800ff",
					padding: { x: 6, y: 4 },
				})
				.setInteractive();

			playerText.on("pointerdown", () => {
				this.selectedPlayer = player;

				// Alle anderen resetten
				this.children.list.forEach((child) => {
					if (child.setStyle) {
						child.setStyle({ backgroundColor: "#748800ff" });
					}
				});

				playerText.setStyle({ backgroundColor: "#008000" });
				this.showStartButton();
			});

			y += 80;
		});
	}

	showStartButton() {
		if (this.startButton) {
			this.startButton.destroy();
		}

		this.startButton = this.add
			.text(window.innerWidth / 2 - 200, window.innerHeight / 2 + 220, "▶ Start Game", {
				fontSize: "40px",
				fontFamily: "Pixel Code",
				color: "#ffffff",
				backgroundColor: "#0000ff",
				padding: { x: 10, y: 6 },
			})
			.setInteractive();

		this.startButton.on("pointerdown", () => {
			if (!this.selectedPlayer) return;

			this.scene.start("GameScene", {
				player: this.selectedPlayer,
			});
		});
	}

	renderPlayerCreation() {
		// Textfeld
		const inputStyle = {
			fontSize: "40px",
			fontFamily: "Pixel Code",
			color: "#000000",
			backgroundColor: "#ffffff",
			padding: { x: 6, y: 4 },
		};

		this.playerNameInput = this.add.dom(window.innerWidth / 2 - 110, window.innerHeight / 2 + 100).createFromHTML(`
        <input
  type="text"
  id="playerName"
  placeholder="Create new Player"
  maxlength="20"
  style="font-family: Pixel Code; height: 40px;"
/>
    `);

		// Button erstellen
		this.createButton = this.add
			.text(window.innerWidth / 2 - 200, window.innerHeight / 2 + 150, "Create new Player", {
				fontSize: "40px",
				fontFamily: "Pixel Code",
				color: "#ffffff",
				backgroundColor: "#008000",
				padding: { x: 6, y: 4 },
			})
			.setInteractive();

		this.createButton.on("pointerdown", async () => {
			const inputEl = document.getElementById("playerName");
			const playerName = inputEl.value.trim();

			if (!playerName) return alert("Name can not be empty !");
			if (!/^[A-Za-z\s]{1,20}$/.test(playerName)) return alert("Only Letters and blanks allowed, max. 20 Chars!");

			try {
				const API_URL = import.meta.env.PROD
					? `${import.meta.env.VITE_API_PROTOKOLL}://${import.meta.env.VITE_API_URL}`
					: `${import.meta.env.VITE_API_PROTOKOLL}://${import.meta.env.VITE_HOST_SERVER}:${import.meta.env.VITE_API_PORT}`;

				const res = await fetch(`${API_URL}/api/players/register`, {
					method: "POST",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ name: playerName }),
				});

				if (!res.ok) {
					const errorText = await res.text();
					return alert(`Error: ${errorText}`);
				}

				alert("Player created!");
				inputEl.value = "";
				this.loadPlayers(); // Liste aktualisieren
			} catch (err) {
				console.error("Error creating new player:", err);
				alert("Server error creating new player.");
			}
		});
	}
}
