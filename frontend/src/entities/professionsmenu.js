import { socket } from "../socket.js";

export default class ProfessionsMenu {
	constructor(scene, player) {
		this.scene = scene;
		this.player = player;
		this.professions = this.scene.professions;
		this.playerprofessions = [];
		this.isVisible = false;

		// HTML Container erstellen
		this.ui = document.createElement("div");
		this.ui.classList.add("professions-menu");
		this.ui.innerHTML = `
			<div class="professions-header">
				<p>Professions</p>
				<button class="professions-close">X</button>
			</div>
			<div class="professions-grid"></div>
		`;
		document.body.appendChild(this.ui);

		// Close Button
		const closeBtn = this.ui.querySelector(".professions-close");
		closeBtn.addEventListener("click", () => this.toggle());

		// Grid Container
		this.gridContainer = this.ui.querySelector(".professions-grid");

		// Profession Buttons laden
		this.loadProfessions();

		// Playerprofessions laden
		this.loadPlayerProfessions();

		// Socket Listener für die geladenen Player-Daten
		socket.on("professions:player:loaded", (data) => {
			this.playerprofessions = data; // überschreibt
			if (this.isVisible) this.loadProfessions(); // Refresh UI
		});
	}

	loadProfessions() {
		this.gridContainer.innerHTML = ""; // leeren

		Object.values(this.professions).forEach((prof) => {
			const playerProf = this.playerprofessions.find((p) => p.profession_id === prof.id);

			const btn = document.createElement("button");
			btn.classList.add("profession-btn");

			if (playerProf) {
				// Spieler hat den Beruf bereits
				btn.classList.add("owned");
				btn.innerHTML = `
					<img src="src/assets/ui/professions/${prof.id}.png" alt="${prof.name}" class="profession-icon"/>
					<span class="profession-name">${prof.name}</span>
					<span class="profession-level">Level: ${playerProf.level}</span>
					<span class="profession-exp">Exp: ${playerProf.exp}/${playerProf.level * 100}</span>
				`;
			} else {
				// Spieler hat den Beruf noch nicht
				btn.innerHTML = `
					<img src="src/assets/ui/professions/${prof.id}.png" alt="${prof.name}" class="profession-icon"/>
					<span class="profession-name">${prof.name}</span>
					<div class="profession-costs-container">
						<span class="profession-cost">${prof.unlockCost}</span>
						<img class="propancoin" src="src/assets/ui/money.png" />
					</div>
				`;

				// Socket emit zum freischalten
				btn.addEventListener("click", () => {
					socket.emit("profession:unlock", prof.id);
					this.toggle();
				});
			}

			this.gridContainer.appendChild(btn);
		});
	}

	toggle() {
		this.isVisible = !this.isVisible;
		this.ui.style.display = this.isVisible ? "block" : "none";

		if (this.isVisible) {
			this.loadPlayerProfessions();
		}
	}

	loadPlayerProfessions() {
		socket.emit("professions:player:load", this.player.id);
	}
}
