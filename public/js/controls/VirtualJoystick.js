// VirtualJoystick.js
export default class VirtualJoystick {
    constructor(scene, player, offsetX, offsetY, outerRadius, innerRadius) {
        this.scene = scene;
        this.player = player; // Spieler-Referenz
        this.offsetX = offsetX; // Joystick-Position relativ zum Spieler
        this.offsetY = offsetY;
        this.baseOuterRadius = outerRadius; // Unskalierter Radius
        this.baseInnerRadius = innerRadius;

        this.pointer = null;

        // Kreise erstellen
        this.outerCircle = scene.add.circle(0, 0, outerRadius, 0x666666, 0.5);
        this.innerCircle = scene.add.circle(0, 0, innerRadius, 0xffffff, 0.7);

        this.direction = { x: 0, y: 0 };

        this.updatePosition(); // Initiale Position setzen
        this.initEvents();

    }

    updatePosition() {
        // Spieler-Position abrufen
        const playerX = this.player.x;
        const playerY = this.player.y;

        // Joystick-Position relativ zum Spieler
        this.outerCircle.x = playerX + this.offsetX;
        this.outerCircle.y = playerY + this.offsetY;

      //  this.innerCircle.x = this.outerCircle.x;
      //  this.innerCircle.y = this.outerCircle.y;

    }

    initEvents() {
        this.scene.input.on('pointerdown', this.startDrag, this);
        this.scene.input.on('pointermove', this.doDrag, this);
        this.scene.input.on('pointerup', this.stopDrag, this);
    }

    startDrag(pointer) {
        if (Phaser.Math.Distance.Between(pointer.x, pointer.y, this.outerCircle.x, this.outerCircle.y) <= this.outerCircle.radius) {
            this.pointer = pointer;
        }
    }

    doDrag(pointer) {
        if (this.pointer && this.pointer.id === pointer.id) {
            const angle = Phaser.Math.Angle.Between(this.outerCircle.x, this.outerCircle.y, pointer.x, pointer.y);
            const distance = Phaser.Math.Distance.Between(this.outerCircle.x, this.outerCircle.y, pointer.x, pointer.y);
            const maxDistance = Math.min(distance, this.outerCircle.radius);

            this.innerCircle.x = this.outerCircle.x + Math.cos(angle) * maxDistance;
            this.innerCircle.y = this.outerCircle.y + Math.sin(angle) * maxDistance;

            this.direction.x = (pointer.x - this.outerCircle.x) / this.outerCircle.radius;
            this.direction.y = (pointer.y - this.outerCircle.y) / this.outerCircle.radius;
        }
    }

    stopDrag(pointer) {
        if (this.pointer && this.pointer.id === pointer.id) {
            this.pointer = null;

            this.innerCircle.x = this.outerCircle.x;
            this.innerCircle.y = this.outerCircle.y;

            this.direction.x = 0;
            this.direction.y = 0;
        }
    }

    getDirection() {
        return this.direction;
    }
}