export default class UI{
    constructor(scene, player) {
        this.scene = scene;
        this.player = player; 
    
    }
    

    create(){
        //UI
        this.ui_playerpos = this.scene.add.text(16, 16, 'HP: ' + this.player.x+'/'+this.player.y,{
            fill: '#ffffff'
        });
        this.ui_playerpos.setDepth(10);
    }

    update()
    {
        this.ui_playerpos.x = this.player.x +10;
        this.ui_playerpos.y = this.player.y;
        this.ui_playerpos.text = Math.round(this.player.x) + ' / ' + Math.round(this.player.y);

    }

    }
