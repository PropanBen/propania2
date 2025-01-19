import type { Direction } from 'src/types/direction.enum';

export default class AnimationManager {
	private scene: Phaser.Scene;
	private player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

	constructor(
		scene: Phaser.Scene,
		player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
	) {
		this.scene = scene;
		this.player = player;

		// Animationen für den Charakter initialisieren
		this.createAnimations();
	}

	createAnimations() {
		// Idle-Animationen
		this.scene.anims.create({
			key: 'idle_up',
			frames: this.scene.anims.generateFrameNumbers('player', {
				start: this.getFrameIndex(22, 0),
				end: this.getFrameIndex(22, 1),
			}),
			frameRate: 1, // Geschwindigkeit der Animation
			repeat: -1, // Endlos wiederholen
		});

		this.scene.anims.create({
			key: 'idle_down',
			frames: this.scene.anims.generateFrameNumbers('player', {
				start: this.getFrameIndex(24, 0),
				end: this.getFrameIndex(24, 1),
			}),
			frameRate: 1,
			repeat: -1,
		});

		this.scene.anims.create({
			key: 'idle_left',
			frames: this.scene.anims.generateFrameNumbers('player', {
				start: this.getFrameIndex(23, 0),
				end: this.getFrameIndex(23, 1),
			}),
			frameRate: 1,
			repeat: -1,
		});

		this.scene.anims.create({
			key: 'idle_right',
			frames: this.scene.anims.generateFrameNumbers('player', {
				start: this.getFrameIndex(25, 0),
				end: this.getFrameIndex(25, 1),
			}),
			frameRate: 1,
			repeat: -1,
		});

		// Geh-Animationen
		this.scene.anims.create({
			key: 'walk_up',
			frames: this.scene.anims.generateFrameNumbers('player', {
				start: this.getFrameIndex(8, 0),
				end: this.getFrameIndex(8, 8),
			}),
			frameRate: 10,
			repeat: -1,
		});

		this.scene.anims.create({
			key: 'walk_down',
			frames: this.scene.anims.generateFrameNumbers('player', {
				start: this.getFrameIndex(10, 0),
				end: this.getFrameIndex(10, 8),
			}),
			frameRate: 10,
			repeat: -1,
		});

		this.scene.anims.create({
			key: 'walk_left',
			frames: this.scene.anims.generateFrameNumbers('player', {
				start: this.getFrameIndex(9, 0),
				end: this.getFrameIndex(9, 8),
			}),
			frameRate: 10,
			repeat: -1,
		});

		this.scene.anims.create({
			key: 'walk_right',
			frames: this.scene.anims.generateFrameNumbers('player', {
				start: this.getFrameIndex(11, 0),
				end: this.getFrameIndex(11, 8),
			}),
			frameRate: 10,
			repeat: -1,
		});

		// Lauf-Animationen
		this.scene.anims.create({
			key: 'run_up',
			frames: this.scene.anims.generateFrameNumbers('player', {
				start: this.getFrameIndex(34, 0),
				end: this.getFrameIndex(34, 7),
			}),
			frameRate: 10,
			repeat: -1,
		});

		this.scene.anims.create({
			key: 'run_down',
			frames: this.scene.anims.generateFrameNumbers('player', {
				start: this.getFrameIndex(36, 0),
				end: this.getFrameIndex(36, 7),
			}),
			frameRate: 10,
			repeat: -1,
		});

		this.scene.anims.create({
			key: 'run_left',
			frames: this.scene.anims.generateFrameNumbers('player', {
				start: this.getFrameIndex(35, 0),
				end: this.getFrameIndex(35, 7),
			}),
			frameRate: 10,
			repeat: -1,
		});

		this.scene.anims.create({
			key: 'run_right',
			frames: this.scene.anims.generateFrameNumbers('player', {
				start: this.getFrameIndex(37, 0),
				end: this.getFrameIndex(37, 7),
			}),
			frameRate: 10,
			repeat: -1,
		});
	}

	// Hilfsfunktion zur Berechnung des Frame-Index
	getFrameIndex(row: number, column: number) {
		const SPRITESHEET_COLUMNS = 13; // Anzahl der Spalten im Spritesheet
		return row * SPRITESHEET_COLUMNS + column;
	}

	// Methode zum Setzen der richtigen Animation basierend auf der Bewegungsrichtung
	playAnimation(direction: Direction, velocity: number[]) {
		const [velocityX, velocityY] = velocity;

		// Bestimme die größere Geschwindigkeit der beiden Komponenten (für diagonale Bewegungen)
		const maxSpeed = Math.max(Math.abs(velocityX), Math.abs(velocityY));

		// Bestimme den Walk-State basierend auf der maximalen Geschwindigkeit
		let walkState;
		if (maxSpeed === 0) {
			walkState = 'idle'; // Wenn die Geschwindigkeit 0 ist, "idle"
		} else if (maxSpeed <= 60) {
			walkState = 'walk'; // Wenn die Geschwindigkeit zwischen 1 und 60 ist, "walk"
		} else {
			walkState = 'run'; // Wenn die Geschwindigkeit über 60 ist, "run"
		}

		// Der Animation-Name wird durch die Richtung und den Zustand bestimmt
		const animationName = `${walkState}_${direction}`;
		this.player.anims.play(animationName, true);
	}
}
