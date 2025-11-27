import Phaser from "phaser";

export default class PlayerSelectScene extends Phaser.Scene {
	constructor(data) {
		super("PlayerSelectScene");
		this.players = [];
		this.selectedPlayer = null;
		this.account_id = data.account_id;
	}

	create() {
		this.add.text(100, 40, "Select your Player", {
			fontSize: "24px",
			color: "#ffffff",
			fontFamily: "Arial",
			backgroundColor: "#000000",
			padding: { x: 8, y: 4 },
		});

		this.loadPlayers();
	}

	async loadPlayers() {
		// 🔹 Dynamische API URL über .env
		const API_URL =
			import.meta.env.VITE_APP_ENV === "production"
				? `https://${import.meta.env.VITE_API_URL}` // nur hier einmal https hinzufügen
				: `${import.meta.env.VITE_HOST_SERVER}:${import.meta.env.VITE_API_PORT}`;

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
			console.error("Fehler in loadPlayers:", err);
			this.add
				.text(100, 120, "Fehler beim Laden der Spieler!", {
					fontSize: "20px",
					color: "#ff0000",
					fontFamily: "Arial",
				})
				.setInteractive();
		}
	}

	renderPlayerList() {
		let y = 120;

		this.players.forEach((player) => {
			const playerText = this.add
				.text(100, y, `${player.name}`, {
					fontSize: "20px",
					color: "#ffffff",
					fontFamily: "Arial",
					backgroundColor: "#333333",
					padding: { x: 6, y: 4 },
				})
				.setInteractive();

			playerText.on("pointerdown", () => {
				this.selectedPlayer = player;

				// Alle anderen resetten
				this.children.list.forEach((child) => {
					if (child.setStyle) {
						child.setStyle({ backgroundColor: "#333333" });
					}
				});

				playerText.setStyle({ backgroundColor: "#008000" });
				this.showStartButton();
			});

			y += 40;
		});
	}

	showStartButton() {
		if (this.startButton) {
			this.startButton.destroy();
		}

		this.startButton = this.add
			.text(100, 400, "▶ Spiel starten", {
				fontSize: "24px",
				color: "#ffffff",
				backgroundColor: "#0000ff",
				padding: { x: 10, y: 6 },
			})
			.setInteractive();

		this.startButton.on("pointerdown", () => {
			if (!this.selectedPlayer) return;

			this.scene.start("GameScene", {
				player_id: this.selectedPlayer.id,
				account_id: this.account_id,
			});
		});
	}
}
