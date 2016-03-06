
BasicGame.Game = function (game) {

    //	When a State is added to Phaser it automatically has the following properties set on it, even if they already exist:
    this.game;		//	a reference to the currently runningthis.game
    this.add;		//	used to add sprites, text, groups, etc
    this.camera;	//	a reference to thethis.game camera
    this.cache;		//	thethis.game cache
    this.input;		//	the global input manager (you can access this.input.keyboard, this.input.mouse, as well from it)
    this.load;		//	for preloading assets
    this.math;		//	lots of useful common math operations
    this.sound;		//	the sound manager - add a sound, play one, set-up markers, etc
    this.stage;		//	thethis.game stage
    this.time;		//	the clock
    this.tweens;    //  the tween manager
    this.state;	    //	the state manager
    this.world;		//	thethis.game world
    this.particles;	//	the particle manager
    this.physics;	//	the physics manager
    this.rnd;		//	the repeatable random number generator

    //
    this.isRunning = true;

    // world settings
    this.levelLength;
    this.tubeHeight = 200;
    this.startPos;

    this.bottomWall;

    this.groundMaterial;
    this.playerMaterial;
    this.wheelMaterial;
    this.tunnelPhysicsData;
    this.CG_world;
    this.Health_text;

    // environment
    this.environment;
    this.background;
    this.midground;
    this.foreground;

    // global vars
    this.menuButton;
    this.cursors;
    this.loseflag;

    // pod settings
    this.carBody;
    this.wheelSpeed = 25;


    // GUI
    this.rudEvent_graphic;
    this.winStage_graphic;
    this.Level_text;
    this.Timer_text;
    this.Speed_text;

    //Audio
    this.sound_music;
    this.sound_explosion;
    this.sound_hit;

    // Snow
    this.is_snowing = false;
    this.snow_var = 0;
    this.update_interval = 4 * 60;
    this.max = 0;
    this.front_emitter;
    this.mid_emitter;
    this.back_emitter;
};


BasicGame.Game.prototype = {
    init: function () {
        var envs = this.game['GameData'].environments,
            totalEnvs = envs.length;

        var levelSelect = (Math.random() < 0.5) ? 0 : 2;

        this.environment = envs[levelSelect];
        this.levelLength = this.game['GameData'].baseLevelLength * (Math.random() + 1);

        if (this.environment.name == "Snowy Hills") { this.is_snowing = true; }
    },

    preload: function () {
        // Audio
        this.load.audio('level1Music', 'assets/sound/Totta-HeroQuest-Pophousedub-remix.ogg');
        this.load.audio('explosion', 'assets/sound/player_death.wav');
        this.load.audio('hit', 'assets/sound/squit.wav');

        // Snow
        this.load.spritesheet('snowflakes', 'assets/sprites/snowflakes.png', 17, 17);
        this.load.spritesheet('snowflakes_large', 'assets/sprites/snowflakes_large.png', 64, 64);
    },

    create: function () {
        //Audio
        this.sound_music = this.add.sound('level1Music');
        this.sound_explosion = this.add.sound('explosion');
        this.sound_hit = this.add.sound('hit');
        this.sound_music.play();

        // numberOfHills, start_y, hill_max_height, tube_length, tube_height, pixelStep
        this.tunnelPhysicsData = this.generateTubePoints(15, (this.world.height / 2) + 30, 580, this.levelLength, this.tubeHeight, 100);
        this.load.physics('physicsData', "", this.tunnelPhysicsData);

        // Variable setup
        this.time.reset();
        this.loseflag = false;

        //gametime
        this.time.advancedTiming = true;
        this.physics.startSystem(Phaser.Physics.P2JS);
        this.physics.p2.gravity.y = 300;
        this.physics.p2.restitution = 0.2;
        this.physics.p2.setImpactEvents(true);
        

        this.groundMaterial = this.physics.p2.createMaterial('ground');
        this.playerMaterial = this.physics.p2.createMaterial('player');
        this.wheelMaterial = this.physics.p2.createMaterial('wheel');
        this.physics.p2.createContactMaterial(this.playerMaterial, this.groundMaterial, { friction: 5.0, restitution: 0 });
        this.physics.p2.createContactMaterial(this.wheelMaterial, this.groundMaterial, { friction: 5.0, restitution: 0 });

        

        //control
        this.cursors = this.input.keyboard.createCursorKeys();

        // set world settings and player start position
        this.startPos = { "x": 100, "y": (this.world.height / 2) };
        this.stage.backgroundColor = "#0c9fc7";
        this.world.setBounds(0, 0, this.levelLength, 500);

        // create background first so that it goes to the back most position
        this.addBackground();
        this.addMidground();
        var graphics = this.add.graphics(0, 0); // create a graphics object and prepare generate tube and rest of environment
        this.addCar();
        this.drawTube(graphics, this.tunnelPhysicsData);
        this.carBody.body.onBeginContact.add(this.podCollision, this);
        this.addForeground();

        window.graphics = graphics;

        // GUI - create this last so it overlays on top of everything else
        this.trackProgressorBackground = this.add.sprite(this.camera.x + ((this.camera.height) / 4), this.camera.y + 560, 'progressorBackground');
        this.trackProgressorBackground.anchor.setTo(0, 0.5);
        this.trackProgressorMarker = this.add.sprite(this.trackProgressorBackground.x, this.trackProgressorBackground.y, 'progressorMarker');
        this.trackProgressorMarker.anchor.setTo(0.5, 0.5);

        this.menuButton = this.add.button(this.camera.x, this.camera.y, 'menu_button', this.quitGame, this, 'over', 'out', 'down');
        this.menuButton.scale.set(0.5, 0.5);

        // Displays
        this.Level_text = this.add.text(this.camera.x + this.camera.width - 100, this.camera.y + 10, 'Level ' + this.game['GameData'].cLevel, {
            font: "24px Arial",
            fill: "#ffffff",
            align: "center"
        });
        this.Timer_text = this.add.text(this.camera.x + 15, this.camera.y + 550, "00:00:00", {
            font: "24px Arial",
            fill: "#ffffff",
            align: "center"
        });
        this.Speed_text = this.add.text(this.camera.x + 15, this.camera.y + 530, "0 m/s", {
            font: "24px Arial",
            fill: "#ffffff",
            align: "center"
        });
        this.Health_text = this.add.text(this.camera.x + this.camera.width - 135, this.camera.height - 50, "Health: 100%", {
            font: "24px Arial",
            fill: "#ffffff",
            align: "center"
        });

        //fix GUI elements to camera
        this.trackProgressorBackground.fixedToCamera = true;
        this.trackProgressorMarker.fixedToCamera = false;
        this.menuButton.fixedToCamera = true;
        this.Level_text.fixedToCamera = true;
        this.Timer_text.fixedToCamera = true;
        this.Speed_text.fixedToCamera = true;
        this.Health_text.fixedToCamera = true;

        // Snow 
        if (this.is_snowing) {
            this.back_emitter = this.add.emitter(this.camera.width * 5, -32, 1000);
            this.back_emitter.makeParticles('snowflakes', [0, 1, 2, 3, 4, 5]);
            this.back_emitter.maxParticleScale = 0.6;
            this.back_emitter.minParticleScale = 0.2;
            this.back_emitter.setYSpeed(20, 100);
            this.back_emitter.gravity = 0;
            this.back_emitter.width = this.camera.width * 10;
            this.back_emitter.minRotation = 0;
            this.back_emitter.maxRotation = 40;

            this.mid_emitter = this.add.emitter(this.camera.width * 5, -32, 400);
            this.mid_emitter.makeParticles('snowflakes', [0, 1, 2, 3, 4, 5]);
            this.mid_emitter.maxParticleScale = 1.2;
            this.mid_emitter.minParticleScale = 0.8;
            this.mid_emitter.setYSpeed(50, 150);
            this.mid_emitter.gravity = 0;
            this.mid_emitter.width = this.camera.width * 10;
            this.mid_emitter.minRotation = 0;
            this.mid_emitter.maxRotation = 40;

            this.front_emitter = this.add.emitter(this.camera.width * 5, -32, 100);
            this.front_emitter.makeParticles('snowflakes_large', [0, 1, 2, 3, 4, 5]);
            this.front_emitter.maxParticleScale = 1;
            this.front_emitter.minParticleScale = 0.5;
            this.front_emitter.setYSpeed(100, 200);
            this.front_emitter.gravity = 0;
            this.front_emitter.width = this.camera.width * 10;
            this.front_emitter.minRotation = 0;
            this.front_emitter.maxRotation = 40;

            this.changeWindDirection();

            this.back_emitter.start(false, 14000, 20);
            this.mid_emitter.start(false, 12000, 40);
            this.front_emitter.start(false, 6000, 1000);
        }
    },

    update: function () {

        // handle inputs
        if (!this.loseflag) { this.handleInput(); }

        // camera follow pod
        this.camera.x = this.carBody.body.x - 200;

        // update background
        //this.background.x = this.camera.x;

        // update midground
        var camera = this.camera;
        this.midground.forEach(function (item) {
            if (item.type === 5) { // tileable sprite
                item.tilePosition.x = -(camera.x * item.parallax) + item.offset.x;
                item.tilePosition.y = item.offset.y;
            }
        })

        // update fore ground

        // update GUI

        // update marker on track progressor
        var ProgressMultiplier = this.carBody.x / this.levelLength;
        if (ProgressMultiplier > 1) { ProgressMultiplier = 1; }
        this.trackProgressorMarker.x = this.trackProgressorBackground.x + (ProgressMultiplier * this.trackProgressorBackground.width);
        this.trackProgressorMarker.y = this.trackProgressorBackground.y;

        if (ProgressMultiplier != 1 && !this.loseflag) {
            // Timer
            var minutes = Math.floor(this.game.time.totalElapsedSeconds() / 60);
            var seconds = Math.floor(this.game.time.totalElapsedSeconds()) % 60;
            var miliseconds = Math.floor((this.game.time.totalElapsedSeconds() - Math.floor(this.game.time.totalElapsedSeconds())) * 100);
            if (seconds < 10) seconds = '0' + seconds;
            if (minutes < 10) minutes = '0' + minutes;
            if (miliseconds < 10) miliseconds = '0' + miliseconds;
            this.Timer_text.setText(minutes + ':' + seconds + ':' + miliseconds);

            // Speed
            var pod_velcity = this.carBody.body.velocity.x; // in pixels per second
            pod_velcity = pod_velcity / 5; // could set this as a constant somewhere...pixels/meter
            pod_velcity = Math.floor(pod_velcity);
            this.Speed_text.setText(pod_velcity + ' m/s');
        } else {
            this.Speed_text.setText('Signal Lost!');
        }

        // Check pod's angle, explode if out of bounds
        if (!this.loseflag && (this.carBody.body.angle > 135 || this.carBody.body.angle < -135)) {
            console.log('You exploded!');
            this.loseflag = true;
            this.lose();
        }

        // check if pod reached end
        if (this.carBody.body.x >= this.levelLength) {
            this.winStage();
        }

        // Snow
        if (this.is_snowing) {
            this.snow_var++;
            if (this.snow_var === this.update_interval) {
                this.changeWindDirection();
                update_interval = Math.floor(Math.random() * 20) * 60; // 0 - 20sec @ 60fps
                this.snow_var = 0;
            }
            this.front_emitter.emitX = (this.camera.x + this.camera.width * 5);
            this.mid_emitter.emitX = (this.camera.x + this.camera.width * 5);
            this.back_emitter.emitX = (this.camera.x + this.camera.width * 5);
        }
    },

    changeWindDirection: function () {

        var multi = Math.floor((this.max + 200) / 4),
                    frag = (Math.floor(Math.random() * 100) - multi);
        this.max = this.max + frag;

        if (this.max > 200) this.max = 150;
        if (this.max < -200) this.max = -150;

        this.setXSpeed(this.back_emitter, this.max);
        this.setXSpeed(this.mid_emitter, this.max);
        this.setXSpeed(this.front_emitter, this.max);

    },

    setXSpeed: function (emitter, max) {

        emitter.setXSpeed(max - 20, max);
        emitter.forEachAlive(this.setParticleXSpeed, this, max);

    },

    setParticleXSpeed: function (particle, max) {

        particle.body.velocity.x = max - Math.floor(Math.random() * 30);

    },

    addBackground: function () {
        var environmentBackground = this.environment['background'];
        var backgroundGroup = this.background = this.add.group();
        for (var key in environmentBackground) {
            if (environmentBackground.hasOwnProperty(key)) {
                //alert(key + " -> " + background[key]);
                var unique = backgroundGroup.create(environmentBackground[key].position.x, environmentBackground[key].position.y, environmentBackground[key].texture);
                unique.fixedToCamera = environmentBackground[key].fixedToCamera;
            }
        }
    },

    addMidground: function () {
        var environmentMidground = this.environment['midground'];
        var midgroundGroup = this.midground = this.add.group();
        for (var key in environmentMidground) {

            if (environmentMidground.hasOwnProperty(key)) {

                if (environmentMidground[key].type === "unique") {

                    midgroundGroup.create(environmentMidground[key].position.x, environmentMidground[key].position.y, environmentMidground[key].texture);

                } else if (environmentMidground[key].type === "repeat") {

                    var tileable = this.add.tileSprite(0, 0, this.camera.width, this.camera.height, environmentMidground[key].texture);
                    tileable.tilePosition = { "x": environmentMidground[key].position.x, "y": environmentMidground[key].position.y };
                    tileable.fixedToCamera = true;
                    tileable.scale = { "x": environmentMidground[key].scale.x, "y": environmentMidground[key].scale.y };

                    // need to pass some data to the update function so store it on the object
                    tileable['parallax'] = environmentMidground[key].parallax;
                    tileable['offset'] = environmentMidground[key].position;
                    midgroundGroup.add(tileable);
                }

            }

        }
    },
    addForeground: function () {
        this.foreground = this.add.group();

    },
    generateTubePoints: function (numberOfHills, start_y, hill_max_height, tube_length, tube_height, pixelStep) {
        var hillStartY = start_y,
            hillWidth = tube_length / numberOfHills,
            hillSlices = hillWidth / pixelStep,
            tunnelPhysicsData = { "top": [], "bottom": [], "pylons": [] },
            prevx = 0,
            prevy = 800;

        for (var i = 0; i < numberOfHills; i++) {
            var randomHeight = Math.random() * 78.5;
            // this is necessary to make all hills (execept the first one) begin where the previous hill ended
            if (i != 0) {
                hillStartY -= randomHeight;
            }
            // looping through hill slices
            for (var j = 0; j <= hillSlices; j++) {
                var x = j * pixelStep + hillWidth * i,
                    y = hillStartY + randomHeight * Math.cos(2 * Math.PI / hillSlices * j),
                    height = y - prevy,
                    length = Math.sqrt((pixelStep * pixelStep) + (height * height)),
                    hillPoint = { "x": x, "y": y },
                    angle = Math.atan2(y - prevy, x - prevx)

                var rect = {
                    "density": 2, "friction": 0, "bounce": 0,
                    "filter": { "categoryBits": 1, "maskBits": 65535 },
                    "shape": [prevx, hillPoint.y + 100, prevx, prevy, hillPoint.x, hillPoint.y, hillPoint.x, hillPoint.y + 100]
                };
                tunnelPhysicsData['bottom'].push(rect);

                var topRect = {
                    "density": 2, "friction": 0, "bounce": 0,
                    "filter": { "categoryBits": 1, "maskBits": 65535 },
                    "shape": [prevx, hillPoint.y - tube_height - 100, hillPoint.x, hillPoint.y - tube_height - 100, hillPoint.x, hillPoint.y - tube_height, prevx, prevy - tube_height]
                    //"shape": [prevx, hillPoint.y - tube_height, prevx, hillPoint.y - tube_height - 10, hillPoint.x, hillPoint.y - tube_height-10, hillPoint.x, hillPoint.y - tube_height]
                };
                tunnelPhysicsData['top'].push(topRect);

                prevx = x;
                prevy = y;
            }
            tunnelPhysicsData['pylons'].push({ position: { "x": prevx, "y": prevy } });

            // this is also necessary to make all hills (execept the first one) begin where the previous hill ended
            hillStartY = hillStartY + randomHeight;
        }
        return tunnelPhysicsData;
    },
    drawTube: function (graphics, points) {

        var totalPoints = points['bottom'].length;
        var prevx = points['bottom'][0]['shape'][2];
        var prevy = points['bottom'][0]['shape'][3];

        var totalPylons = points['pylons'].length;


        //==================//
        // draw tube
        //==================//
        
        
        graphics.beginFill(0xAAAAAA, 0.75);
        btm_prevx = points['bottom'][0]['shape'][4];
        btm_prevy = points['bottom'][0]['shape'][5];
        top_prevx = points['top'][0]['shape'][4];
        top_prevy = points['top'][0]['shape'][5];
        for (var i = 1; i < totalPoints; i++) {
            var btm_x = points['bottom'][i]['shape'][4],
                btm_y = points['bottom'][i]['shape'][5],
                top_x = points['top'][i]['shape'][4],
                top_y = points['top'][i]['shape'][5];

            // Solid gray background
            graphics.lineStyle(6, 0xAAAAAA, 0);
            graphics.drawPolygon([btm_prevx, btm_prevy, top_prevx, top_prevy, top_x, top_y, btm_x, btm_y]);

            // Black outline
            graphics.lineStyle(6, 0x000000, 1);
            graphics.moveTo(btm_prevx, btm_prevy);
            graphics.lineTo(btm_x, btm_y);
            graphics.moveTo(top_prevx, top_prevy);
            graphics.lineTo(top_x, top_y);
            btm_prevx = btm_x;
            btm_prevy = btm_y;
            top_prevx = top_x;
            top_prevy = top_y;
        }


        //==================//
        // draw pylons
        //==================//
        for (var i = 0; i < totalPylons; i++) {
            var x = points['pylons'][i]['position'].x,
                y = points['pylons'][i]['position'].y;
            var pylon = this.add.sprite(x, y - this.tubeHeight - 20, 'pylon');
            //pylon.anchor.setTo(0.5, 0.1);
        }


        //==================//
        // load physics data
        //==================//
        var polygonCollisionSprite = this.add.sprite(0, 0, 'wall');
        this.physics.p2.enableBody(polygonCollisionSprite);
        polygonCollisionSprite.name = 'wall_bot';
        polygonCollisionSprite.body.loadPolygon('physicsData', 'bottom');
        polygonCollisionSprite.body.static = true;
        polygonCollisionSprite.body.setMaterial(this.groundMaterial);

        var top_polygonCollisionSprite = this.add.sprite(0, 0, 'wall');
        this.physics.p2.enableBody(top_polygonCollisionSprite);
        top_polygonCollisionSprite.name = 'wall_top';
        top_polygonCollisionSprite.body.loadPolygon('physicsData', 'top');
        top_polygonCollisionSprite.body.static = true;
        top_polygonCollisionSprite.body.addRectangle(10, 50, 0, 400);
        top_polygonCollisionSprite.body.setMaterial(this.groundMaterial);

        this.bottomWall = polygonCollisionSprite;
    },

    render: function () {
        this.game.debug.text(this.game.time.fps || '--', 2, 14, "#00ff00");
    },

    resize: function (width, height) {
        //this.menuButton.x = 25;
        //this.menuButton.y = 25;
    },

    handleInput: function () {
        if (this.cursors.up.isDown) {
            if (this.wheel_back.body.angularVelocity < 300) {
                this.wheel_back.body.angularVelocity += this.wheelSpeed;
                this.wheel_front.body.angularVelocity += this.wheelSpeed;
            }
            //this.carBody.body.thrust(500);
            this.carBody.body.velocity.x += 20;
        }

        if (this.cursors.down.isDown) {
            // if (this.wheel_back.body.angularVelocity < 300) {
            //     this.wheel_back.body.angularVelocity -= 50;
            //     this.wheel_front.body.angularVelocity -= 50;
            // }
            //this.carBody.body.thrust(-1000);
            this.wheel_back.body.angularVelocity *= 0.2;
            this.wheel_front.body.angularVelocity *= 0.2;
        }
        if (this.carBody.body.velocity.x < 0) {
            this.carBody.body.velocity.x = 0;
        }


        if (this.cursors.right.isDown) {
            this.carBody.body.angularVelocity = .5;
        }
        if (this.cursors.left.isDown) {
            this.carBody.body.angularVelocity = -.5;
        }
    },

    quitGame: function (pointer) {

        //	Here you should destroy anything you no longer need.
        //	Stop music, delete sprites, purge caches, free resources, all that good stuff.
        this.sound_music.stop();
        this.state.start('MainMenu');
    },

    lose: function (pointer) {

        console.log("You lost!")
        if (!this.rudEvent_graphic) {
            this.rudEvent_graphic = this.add.sprite(this.camera.x + this.camera.width / 2, this.camera.y + this.camera.height / 2, 'rud_event');
            this.rudEvent_graphic.anchor.set(0.5, 0.5);
        }

        this.sound_music.stop();
        this.sound_explosion.play();

        this.carBody.body.velocity.x = 0;
        this.carBody.body.velocity.y = 0;

        this.carBody.loadTexture('kaboom');
        this.carBody.scale.set(1, 1);
        this.carBody.animations.add('kaboom');
        this.carBody.animations.play('kaboom', 30, false, false); //play(name, frameRate, loop, killOnComplete) 

        var loseTimeout = setTimeout(function (state) {
            this.loseflag = false;
            state.start('Game')
        }, 3000, this.state);

    },

    winStage: function (pointer) {
        console.log("You won the stage!")

        this.sound_music.stop();

        if (!this.winStage_graphic) {
            this.game['GameData'].cLevel += 1;
            this.winStage_graphic = this.add.sprite(this.camera.x + this.camera.width / 2, this.camera.y + this.camera.height / 2, 'win_stage');
            this.winStage_graphic.anchor.set(0.5, 0.5);

            setTimeout(function (state) {
                state.start('Game')
            }, 3000, this.state);
        }

    },

    win: function (pointer) {

        //  Here you should destroy anything you no longer need.
        //  Stop music, delete sprites, purge caches, free resources, all that good stuff.

        //  Then let's go back to the main menu.
        console.log("go back to win screen")
        this.state.start('Win');

    },

    podCollision: function (body, bodyB, shapeA, shapeB, equation) {
        if (!this.loseflag) {
            var damage = Math.abs(body.velocity.y) / 5000;
            if (damage < .01) { damage = .01; }
            this.carBody.health -= damage;
            if (this.carBody.health > 0) {
                this.sound_hit.play();
                console.log('Colision! rPod Health is ' + this.carBody.health);
            } else {
                if (!this.loseflag) {
                    console.log('You exploded!');
                    this.loseflag = true;
                    this.lose();

                }
            }
            var health_percentage = Math.round(this.carBody.health * 100);
            if (health_percentage < 0) { health_percentage = 0; }
            this.Health_text.setText('Health: ' + health_percentage + '%');
        } else {
            this.Health_text.setText('Health: 0%');
        }
    },

    addCar: function () {
        // basic settings
        var startPos = this.startPos;
        var wheel_front_pos = [50, 30];
        var wheel_back_pos = [-50, 30];

        // create pod
        var carBody = this.add.sprite(startPos.x, startPos.y, 'pod'); //CARBODY
        carBody.name = 'carBody';
        carBody.scale.set(0.5, 0.5);

        var wheel_front = this.add.sprite(140, startPos.y + 50); //FRONT WHEEL
        wheel_front.name = 'wheel_front';
        var wheel_back = this.add.sprite(60, startPos.y + 50); //BACK WHEEL 
        wheel_front.name = 'wheel_back';
        carGroup = this.game.physics.p2.createCollisionGroup();

        this.physics.p2.updateBoundsCollisionGroup();
        this.physics.p2.enable([wheel_front, wheel_back, carBody]);

        carBody.body.setRectangle(110, 40);
        carBody.body.debug = false; //this adds the pink box
        carBody.body.mass = 1.5;
        carBody.body.angle = 0;
        carBody.body.setMaterial(this.playerMaterial);
        //carBody.body.setCollisionGroup(carGroup);

        wheel_front.body.setCircle(1);
        wheel_front.body.debug = false;
        wheel_front.body.mass = 0.2;
        wheel_front.body.setMaterial(this.wheelMaterial);
        wheel_front.renderable = false;
        //wheel_front.body.setCollisionGroup(carGroup);

        wheel_back.body.setCircle(1);
        wheel_back.body.debug = false;
        wheel_back.body.mass = 0.5;
        wheel_back.body.setMaterial(this.wheelMaterial);
        wheel_back.renderable = false;

        var spring = this.physics.p2.createSpring(carBody, wheel_front, 123, 150, 10, null, null, wheel_front_pos, null);
        var spring_1 = this.physics.p2.createSpring(carBody, wheel_back, 123, 150, 10, null, null, wheel_back_pos, null);

        var constraint = this.physics.p2.createPrismaticConstraint(carBody, wheel_front, false, wheel_front_pos, [0, 0], [0, 1]);
        constraint.lowerLimitEnabled = constraint.upperLimitEnabled = true;
        constraint.upperLimit = -.1;
        constraint.lowerLimit = -10;

        var constraint_1 = this.physics.p2.createPrismaticConstraint(carBody, wheel_back, false, wheel_back_pos, [0, 0], [0, 1]);
        constraint_1.lowerLimitEnabled = constraint_1.upperLimitEnabled = true;
        constraint_1.upperLimit = -.1;
        constraint_1.lowerLimit = -10;

        this.carBody = carBody;
        this.wheel_front = wheel_front;
        this.wheel_back = wheel_back;
    }
};
