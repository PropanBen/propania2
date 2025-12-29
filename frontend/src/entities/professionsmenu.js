import { socket } from "../socket.js";

export default class ProfessionsMenu {
	constructor(scene, player) {
		this.scene = scene;
		this.player = player;
		this.professions = this.scene.professions;
		this.playerprofessions = [];
		this.isVisible = false;
		this.buyinglocked = false;

		// Haupt UI
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

		this.gridContainer = this.ui.querySelector(".professions-grid");

		this.ui.querySelector(".professions-close").addEventListener("click", () => this.toggle());

		this.loadProfessions();
		this.loadPlayerProfessions();

		socket.on("professions:player:loaded", (data) => {
			this.playerprofessions = data;
			if (this.isVisible) this.loadProfessions();
		});
	}

	loadProfessions() {
		this.gridContainer.innerHTML = "";

		Object.values(this.professions).forEach((prof) => {
			const playerProf = this.playerprofessions.find((p) => p.profession_id === prof.id);

			const btn = document.createElement("button");
			btn.classList.add("profession-btn");
			if (playerProf) btn.classList.add("owned");

			btn.innerHTML = `
				<img src="src/assets/ui/professions/${prof.id}.png" class="profession-icon"/>
				<span class="profession-name">${prof.name}</span>
				${
					playerProf
						? `
							<span>Level: ${playerProf.level}</span>
							<span>Exp: ${playerProf.exp}/${playerProf.level * 100}</span>
						`
						: `<span>Click for details</span>`
				}
			`;

			btn.addEventListener("click", () => {
				this.openProfessionPopup(prof, playerProf);
			});

			this.gridContainer.appendChild(btn);
		});
	}

	openProfessionPopup(prof, playerProf) {
		this.ui.style.pointerEvents = "none";
		this.ui.style.opacity = "0.4";

		const popup = document.createElement("div");
		popup.classList.add("profession-popup");

		const isOwned = !!playerProf;

		const activeSkillsHtml = Object.values(prof.activeSkills || {})
			.map(
				(skill) => `
					<div style="margin-bottom:10px">
						<p><strong>${skill.name}</strong></p>
						<p>Required Level: ${skill.levelRequired}</p>
						<p>Cooldown: ${skill.cooldown} ms</p>
						<p>Base EXP: ${skill.baseExp}</p>
					</div>
				`
			)
			.join("");

		const passivesHtml = Object.values(prof.passives || {})
			.map(
				(passive) => `
					<div style="margin-bottom:10px">
						<p><strong>${passive.id}</strong></p>
						<p>${passive.description}</p>
					</div>
				`
			)
			.join("");

		/* ---------- Buy Section ---------- */
		let buySectionHtml = "";

		if (!isOwned && !this.buyinglocked) {
			buySectionHtml = `
				<div class="profession-cost-container">
					<p>Unlock Cost: ${prof.unlockCost}</p>
					<img src="/src/assets/ui/money.png" />
				</div>
				<button class="buy-btn">Buy Profession</button>
			`;
		}

		if (isOwned) {
			buySectionHtml = `<p><strong>Already owned</strong></p>`;
		}

		popup.innerHTML = `
			<div class="popup-content" style="position:relative">

				<button class="popup-close-top"
					style="
						position:absolute;
						top:5px;
						right:8px;
						font-size:2rem;
						font-weight:bold;
						background:transparent;
						border:none;
						cursor:pointer;
						color:#ff4444;
					">X</button>

				<h2>${prof.name}</h2>

				<img 
					src="src/assets/ui/professions/${prof.id}.png"
					style="width:100px;height:100px;image-rendering:pixelated;margin-bottom:10px"
				/>

				<p>${prof.description}</p>

				<hr/>

				<h3>Active Skills</h3>
				${activeSkillsHtml || "<p>None</p>"}

				<hr/>

				<h3>Passives</h3>
				${passivesHtml || "<p>None</p>"}

				<hr/>

				${buySectionHtml}

				<button class="close-btn">Close</button>
			</div>
		`;

		document.body.appendChild(popup);

		const closePopup = () => {
			this.ui.style.pointerEvents = "auto";
			this.ui.style.opacity = "1";
			popup.remove();
		};

		if (!isOwned && !this.buyinglocked) {
			popup.querySelector(".buy-btn").addEventListener("click", () => {
				socket.emit("profession:unlock", prof.id);
				closePopup();
				this.toggle();
			});
		}

		popup.querySelector(".close-btn").addEventListener("click", closePopup);
		popup.querySelector(".popup-close-top").addEventListener("click", closePopup);

		popup.addEventListener("click", (e) => {
			if (e.target === popup) closePopup();
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
