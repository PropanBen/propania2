import { socket } from "../socket.js";

export default class NPCMenu extends Phaser.Physics.Arcade.Sprite {
	constructor(scene, npc) {
		super(scene, 0, 0, "");
		this.scene = scene;
		this.npc = npc;
		this.isVisible = false;

		// UI Container erstellen
		this.ui = document.createElement("div");
		this.ui.className = "npc-ui";
		this.ui.style.display = "none";

		// Header + Close Button + Button-Container
		this.ui.innerHTML = `
			<div class="npc-header">
				<p>${this.npc.name}</p>
			</div>
            <button class="npc-close">X</button>
			<div class="npc-buttons"></div>
		`;

		const closeBtn = this.ui.querySelector(".npc-close");
		closeBtn.addEventListener("click", () => this.toggle());

		document.body.appendChild(this.ui);
		this.npcmenucontainer = this.ui.querySelector(".npc-buttons");
	}

	// Buttons abhängig vom NPC-Typ erstellen
	refresh() {
		this.npcmenucontainer.innerHTML = ""; // reset

		const buttons = [];

		if (this.npc.type === "trader") {
			const buttonTalk = document.createElement("button");
			buttonTalk.textContent = "Talk";
			buttonTalk.addEventListener("click", () => {
				socket.emit("npc:talk", this.npc.id);
			});

			const buttonTrade = document.createElement("button");
			buttonTrade.textContent = "Trade";
			buttonTrade.addEventListener("click", () => {
				socket.emit("inventory:open:request", this.npc.id);
				this.toggle();
			});

			this.npcmenucontainer.appendChild(buttonTalk);
			this.npcmenucontainer.appendChild(buttonTrade);
			if (this.npc.id === "start_merchant") {
				const buttonProf = document.createElement("button");
				buttonProf.textContent = "Choose Profession";
				buttonProf.addEventListener("click", () => {
					//	socket.emit("professions:open:request", this.npc.id);
					this.scene.localPlayer.ProfessionsMenu.buyinglocked = false;
					this.scene.localPlayer.ProfessionsMenu.toggle();
					this.toggle();
				});
				this.npcmenucontainer.appendChild(buttonProf);
			}
		} else if (this.npc.type === "worker") {
		}
	}

	toggle() {
		this.isVisible = !this.isVisible;
		this.ui.style.display = this.isVisible ? "block" : "none";
		if (this.isVisible) this.refresh();
	}
}
