
BasicGame.Game = function (game) {

	//	When a State is added to Phaser it automatically has the following properties set on it, even if they already exist:

    this.game;		//	a reference to the currently running game
    this.add;		//	used to add sprites, text, groups, etc
    this.camera;	//	a reference to the game camera
    this.cache;		//	the game cache
    this.input;		//	the global input manager (you can access this.input.keyboard, this.input.mouse, as well from it)
    this.load;		//	for preloading assets
    this.math;		//	lots of useful common math operations
    this.sound;		//	the sound manager - add a sound, play one, set-up markers, etc
    this.stage;		//	the game stage
    this.time;		//	the clock
    this.tweens;    //  the tween manager
    this.state;	    //	the state manager
    this.world;		//	the game world
    this.particles;	//	the particle manager
    this.physics;	//	the physics manager
    this.rnd;		//	the repeatable random number generator

    //	You can use any of these from any function within this State.
    //	But do consider them as being 'reserved words', i.e. don't create a property for your own game called "world" or you'll over-write the world reference.
    
    this.menuButton;
    this.cursors;

    this.player;

    this.playerCollisionGroup;
    this.tunnelCollisionGroup;
};

BasicGame.Game.prototype = {

	create: function () {
        //gametime
        this.time.advancedTiming = true;

        console.log("game started")
        this.physics.startSystem(Phaser.Physics.P2JS);
        this.physics.p2.gravity.y = 300;
        this.physics.p2.restitution = 0.2;

        this.groundMaterial = this.physics.p2.createMaterial('ground');
        this.playerMaterial = this.physics.p2.createMaterial('player');
        this.physics.p2.createContactMaterial(this.playerMaterial, this.groundMaterial, { friction: 0.1,restitution: 0  });
        
        //control
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // GUI buttons
        //this.menuButton = this.add.button(25, 25, 'button_normal', this.quitGame, this, 'button_hover', 'button_normal', 'button_hover');

        // world
        this.stage.backgroundColor = "#0c9fc7";
        
        // set world size
        this.world.setBounds(0, 0, 20000, 500);

        // player
        this.player = this.add.sprite(32, this.world.height / 2, 'pod');
        this.physics.p2.enable(this.player, true);
        this.player.body.mass = 2;
        this.player.body.setMaterial(this.playerMaterial);
        //player.body.collideWorldBounds = true;

        var graphics = this.game.add.graphics(0, 0);
        this.drawTube(graphics, this.tunnel, 3, (this.world.height / 2) - 100, 580, 4000, 200, 15);
                      //graphics, group, numberOfHills, hill_max_height, tube_length, tube_height, pixelStep){
        window.graphics = graphics;
	},

	update: function () {

        this.camera.x = this.player.x - 200;
        this.player.body.velocity.x = 400;
        this.handleInput();

	},

    drawTube: function (graphics, group, numberOfHills, start_y, hill_max_height, tube_length, tube_height, pixelStep){
        try{
            var hillStartY  = start_y,//+Math.random()*hill_max_height
                hillWidth   = tube_length/numberOfHills,
                hillSlices  = hillWidth/pixelStep,
                prevx,
                prevy;
    
            graphics.lineStyle(6,0xAAAAAA, 0.8);
            graphics.beginFill(0xFF700B, 1);
            graphics.moveTo(0,480);

            for (var i = 0; i < numberOfHills; i++) {
                var randomHeight = Math.random()*100;
                // this is necessary to make all hills (execept the first one) begin where the previous hill ended
                if (i!=0) {
                    hillStartY -= randomHeight;
                }
                // looping through hill slices
                for (var j = 0; j <= hillSlices; j++) {
                        var x           = j * pixelStep + hillWidth * i,
                            y           = hillStartY + randomHeight * Math.cos(2*Math.PI/hillSlices*j),
                            height      = y - prevy,
                            length      = Math.sqrt((pixelStep*pixelStep) + (height*height)),
                            hillPoint   = {"x": x, "y": y},
                            angle       = Math.atan2(y - prevy, x - prevx);

                        // drawing the line
                        //graphics.lineTo(hillPoint.x, hillPoint.y);

                        // generating the physics for the line
                        // bottom wall
                        var newRect = this.add.sprite(x, y, 'wall', 0);
                        newRect.scale.setTo(length, 10);
                        this.physics.p2.enable(newRect, true);
                        newRect.anchor.setTo(1, 0.5);
                        newRect.body.clearShapes();
                        newRect.body.addRectangle(length, 10, -length/2, 0);
                        newRect.body.static = true;
                        newRect.body.rotation = angle;
                        newRect.body.setMaterial(this.groundMaterial);

                        //top wall
                        var newRect = this.add.sprite(x, y + tube_height, 'wall', 0);
                        newRect.scale.setTo(length, 10);
                        this.physics.p2.enable(newRect, true);
                        newRect.anchor.setTo(1, 0.5);
                        newRect.body.clearShapes();
                        newRect.body.addRectangle(length, 10, -length/2, 0);
                        newRect.body.static = true;
                        newRect.body.rotation = angle;
                        newRect.body.setMaterial(this.groundMaterial);

                        //graphics.moveTo(hillPoint.x, hillPoint.y);

                        prevx = x;
                        prevy = y;
                }
                // this is also necessary to make all hills (execept the first one) begin where the previous hill ended
                hillStartY = hillStartY + randomHeight;
            }
            graphics.lineTo(tube_length,480);
            graphics.endFill();
        } catch(e) {
            console.log(e);
        }
    },
            
    render: function() {
        try{
        this.game.debug.text(this.game.time.fps || '--', 2, 14, "#00ff00");  
        } catch(e){
            console.log("===render error====")
            console.log(e)
        }
        
    },
    
    resize: function (width, height) {
        //this.menuButton.x = 25;
        //this.menuButton.y = 25;
    },

    handleInput: function() {
        if (this.cursors.left.isDown || this.moveLeft) {
            this.player.body.velocity.x = -200;
            this.player.frame = 2;
        }
        else if (this.cursors.right.isDown || this.moveRight) {
            this.player.body.velocity.x = 200;
            this.player.frame = 1;
        }
        else {
            //this.player.body.velocity.x = 0;
        }

        if (this.player.body.velocity.x == 0)
            this.player.animations.play('idle');
    },


	quitGame: function (pointer) {

		//	Here you should destroy anything you no longer need.
		//	Stop music, delete sprites, purge caches, free resources, all that good stuff.

		//	Then let's go back to the main menu.
        console.log("go back to main menu")
		this.state.start('MainMenu');

	},

    win: function (pointer) {

        //  Here you should destroy anything you no longer need.
        //  Stop music, delete sprites, purge caches, free resources, all that good stuff.

        //  Then let's go back to the main menu.
        console.log("go back to win screen")
        this.state.start('Win');

    }
};
