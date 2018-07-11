/**
 * @author alteredq / http://alteredqualia.com/
 * @author zhuoniy: add map constraints
 */

THREE.MD2CharacterComplex = function () {

    var scope = this;

    this.scale = 1;

    // animation parameters

    this.animationFPS = 6;
    this.transitionFrames = 15;

    // movement model parameters

    this.maxSpeed = 275;
    this.maxReverseSpeed = -275;

    this.frontAcceleration = 600;
    this.backAcceleration = 600;

    this.frontDecceleration = 600;

    this.angularSpeed = 2.5;

    // rig

    this.root = new THREE.Object3D();

    this.meshBody = null;
    this.meshWeapon = null;

    this.controls = null;

    // skins

    this.skinsBody = [];
    this.skinsWeapon = [];

    this.weapons = [];

    this.currentSkin = undefined;

    //

    this.onLoadComplete = function () {
    };

    // internals

    this.meshes = [];
    this.animations = {};

    this.loadCounter = 0;

    // internal movement control variables

    this.speed = 0;
    this.bodyOrientation = 0;

    this.walkSpeed = this.maxSpeed;
    this.crouchSpeed = this.maxSpeed * 0.5;

    // internal animation parameters

    this.activeAnimation = null;
    this.oldAnimation = null;

    // API

    this.enableShadows = function (enable) {

        for (var i = 0; i < this.meshes.length; i++) {

            this.meshes[i].castShadow = enable;
            this.meshes[i].receiveShadow = enable;

        }

    };

    this.setVisible = function (enable) {

        for (var i = 0; i < this.meshes.length; i++) {

            this.meshes[i].visible = enable;
            this.meshes[i].visible = enable;

        }
    };


    this.shareParts = function (original) {

        this.animations = original.animations;
        this.walkSpeed = original.walkSpeed;
        this.crouchSpeed = original.crouchSpeed;

        this.skinsBody = original.skinsBody;
        this.skinsWeapon = original.skinsWeapon;

        // BODY

        var mesh = createPart(original.meshBody.geometry, this.skinsBody[0]);
        mesh.scale.set(this.scale, this.scale, this.scale);

        this.root.position.y = original.root.position.y;
        this.root.add(mesh);

        this.meshBody = mesh;

        this.meshes.push(mesh);

        // WEAPONS

        for (var i = 0; i < original.weapons.length; i++) {

            var meshWeapon = createPart(original.weapons[i].geometry, this.skinsWeapon[i]);
            meshWeapon.scale.set(this.scale, this.scale, this.scale);
            meshWeapon.visible = false;

            meshWeapon.name = original.weapons[i].name;

            this.root.add(meshWeapon);

            this.weapons[i] = meshWeapon;
            this.meshWeapon = meshWeapon;

            this.meshes.push(meshWeapon);

        }

    };

    this.loadParts = function (config) {

        this.animations = config.animations;
        this.walkSpeed = config.walkSpeed;
        this.crouchSpeed = config.crouchSpeed;

        this.loadCounter = config.weapons.length * 2 + config.skins.length + 1;

        var weaponsTextures = [];
        for (var i = 0; i < config.weapons.length; i++) weaponsTextures[i] = config.weapons[i][1];

        // SKINS

        this.skinsBody = loadTextures(config.baseUrl + "skins/", config.skins);
        this.skinsWeapon = loadTextures(config.baseUrl + "skins/", weaponsTextures);

        // BODY

        var loader = new THREE.MD2Loader();

        loader.load(config.baseUrl + config.body, function (geo) {

            geo.computeBoundingBox();
            scope.root.position.y = -scope.scale * geo.boundingBox.min.y;

            var mesh = createPart(geo, scope.skinsBody[0]);
            mesh.scale.set(scope.scale, scope.scale, scope.scale);

            scope.root.add(mesh);

            scope.meshBody = mesh;
            scope.meshes.push(mesh);

            checkLoadingComplete();

        });

        // WEAPONS

        var generateCallback = function (index, name) {

            return function (geo) {

                var mesh = createPart(geo, scope.skinsWeapon[index]);
                mesh.scale.set(scope.scale, scope.scale, scope.scale);
                mesh.visible = false;

                mesh.name = name;

                scope.root.add(mesh);

                scope.weapons[index] = mesh;
                scope.meshWeapon = mesh;
                scope.meshes.push(mesh);

                checkLoadingComplete();

            }

        };

        for (var i = 0; i < config.weapons.length; i++) {

            loader.load(config.baseUrl + config.weapons[i][0], generateCallback(i, config.weapons[i][0]));

        }

    };

    this.setPlaybackRate = function (rate) {

        if (this.meshBody) this.meshBody.duration = this.meshBody.baseDuration / rate;
        if (this.meshWeapon) this.meshWeapon.duration = this.meshWeapon.baseDuration / rate;

    };

    this.setWireframe = function (wireframeEnabled) {

        if (wireframeEnabled) {

            if (this.meshBody) this.meshBody.material = this.meshBody.materialWireframe;
            if (this.meshWeapon) this.meshWeapon.material = this.meshWeapon.materialWireframe;

        } else {

            if (this.meshBody) this.meshBody.material = this.meshBody.materialTexture;
            if (this.meshWeapon) this.meshWeapon.material = this.meshWeapon.materialTexture;

        }

    };

    this.setSkin = function (index) {

        if (this.meshBody && this.meshBody.material.wireframe === false) {

            this.meshBody.material.map = this.skinsBody[index];
            this.currentSkin = index;

        }

    };

    this.setWeapon = function (index) {

        for (var i = 0; i < this.weapons.length; i++) this.weapons[i].visible = false;

        var activeWeapon = this.weapons[index];

        if (activeWeapon) {

            activeWeapon.visible = true;
            this.meshWeapon = activeWeapon;

            if (this.activeAnimation) {

                activeWeapon.playAnimation(this.activeAnimation);
                this.meshWeapon.setAnimationTime(this.activeAnimation, this.meshBody.getAnimationTime(this.activeAnimation));

            }

        }

    };

    this.setAnimation = function (animationName) {

        if (animationName === this.activeAnimation || !animationName) return;

        if (this.meshBody) {

            this.meshBody.setAnimationWeight(animationName, 0);
            this.meshBody.playAnimation(animationName);

            this.oldAnimation = this.activeAnimation;
            this.activeAnimation = animationName;

            this.blendCounter = this.transitionFrames;

        }

        if (this.meshWeapon) {

            this.meshWeapon.setAnimationWeight(animationName, 0);
            this.meshWeapon.playAnimation(animationName);

        }


    };

    this.update = function (delta) {

        if (this.controls) this.updateMovementModel(delta);

        if (this.animations) {

            this.updateBehaviors(delta);
            this.updateAnimations(delta);

        }

    };

    this.updateAnimations = function (delta) {

        var mix = 1;

        if (this.blendCounter > 0) {

            mix = (this.transitionFrames - this.blendCounter) / this.transitionFrames;
            this.blendCounter -= 1;

        }

        if (this.meshBody) {

            this.meshBody.update(delta);

            this.meshBody.setAnimationWeight(this.activeAnimation, mix);
            this.meshBody.setAnimationWeight(this.oldAnimation, 1 - mix);

        }

        if (this.meshWeapon) {

            this.meshWeapon.update(delta);

            this.meshWeapon.setAnimationWeight(this.activeAnimation, mix);
            this.meshWeapon.setAnimationWeight(this.oldAnimation, 1 - mix);

        }

    };

    this.updateBehaviors = function (delta) {

        var controls = this.controls;
        var animations = this.animations;

        var moveAnimation, idleAnimation;

        // crouch vs stand

        if (controls.crouch) {

            moveAnimation = animations["crouchMove"];
            idleAnimation = animations["crouchIdle"];

        } else {

            moveAnimation = animations["move"];
            idleAnimation = animations["idle"];

        }

        // actions

        if (controls.jump) {

            moveAnimation = animations["jump"];
            idleAnimation = animations["jump"];

        }

        if (controls.attack) {

            if (controls.crouch) {

                moveAnimation = animations["crouchAttack"];
                idleAnimation = animations["crouchAttack"];

            } else {

                moveAnimation = animations["attack"];
                idleAnimation = animations["attack"];

            }

        }

        // set animations

        if (controls.moveForward || controls.moveBackward || controls.moveLeft || controls.moveRight) {

            if (this.activeAnimation !== moveAnimation) {

                this.setAnimation(moveAnimation);

            }

        }


        if (Math.abs(this.speed) < 0.2 * this.maxSpeed && !(controls.moveLeft || controls.moveRight || controls.moveForward || controls.moveBackward)) {

            if (this.activeAnimation !== idleAnimation) {

                this.setAnimation(idleAnimation);

            }

        }

        // set animation direction

        if (controls.moveForward) {

            if (this.meshBody) {

                this.meshBody.setAnimationDirectionForward(this.activeAnimation);
                this.meshBody.setAnimationDirectionForward(this.oldAnimation);

            }

            if (this.meshWeapon) {

                this.meshWeapon.setAnimationDirectionForward(this.activeAnimation);
                this.meshWeapon.setAnimationDirectionForward(this.oldAnimation);

            }

        }

        if (controls.moveBackward) {

            if (this.meshBody) {

                this.meshBody.setAnimationDirectionBackward(this.activeAnimation);
                this.meshBody.setAnimationDirectionBackward(this.oldAnimation);

            }

            if (this.meshWeapon) {

                this.meshWeapon.setAnimationDirectionBackward(this.activeAnimation);
                this.meshWeapon.setAnimationDirectionBackward(this.oldAnimation);

            }

        }

    };

    this.updateMovementModel = function (delta) {

        var controls = this.controls;

        // speed based on controls

        if (controls.crouch) this.maxSpeed = this.crouchSpeed;
        else this.maxSpeed = this.walkSpeed;

        this.maxReverseSpeed = -this.maxSpeed;

        if (controls.moveForward) this.speed = THREE.Math.clamp(this.speed + delta * this.frontAcceleration, this.maxReverseSpeed, this.maxSpeed);
        if (controls.moveBackward) this.speed = THREE.Math.clamp(this.speed - delta * this.backAcceleration, this.maxReverseSpeed, this.maxSpeed);

        // orientation based on controls
        // (don't just stand while turning)

        var dir = 1;

        if (controls.moveLeft) {

            this.bodyOrientation += delta * this.angularSpeed;
            this.speed = THREE.Math.clamp(this.speed + dir * delta * this.frontAcceleration, this.maxReverseSpeed, this.maxSpeed);

        }

        if (controls.moveRight) {

            this.bodyOrientation -= delta * this.angularSpeed;
            this.speed = THREE.Math.clamp(this.speed + dir * delta * this.frontAcceleration, this.maxReverseSpeed, this.maxSpeed);

        }

        // speed decay

        if (!(controls.moveForward || controls.moveBackward)) {

            if (this.speed > 0) {

                var k = exponentialEaseOut(this.speed / this.maxSpeed);
                this.speed = THREE.Math.clamp(this.speed - k * delta * this.frontDecceleration, 0, this.maxSpeed);

            } else {

                var k = exponentialEaseOut(this.speed / this.maxReverseSpeed);
                this.speed = THREE.Math.clamp(this.speed + k * delta * this.backAcceleration, this.maxReverseSpeed, 0);

            }

        }

        // displacement

        var forwardDelta = this.speed * delta;

        // condition of control - if out of map, don't move
        var newx = this.root.position.x + Math.sin(this.bodyOrientation) * forwardDelta;
        var newz = this.root.position.z + Math.cos(this.bodyOrientation) * forwardDelta;


        if (inMap(newx, newz)) {
            this.root.position.x = newx;
            this.root.position.z = newz;
        }

        // steering
        if (controls.moveF) {
            itemMap(newx, newz);
            console.log("x,y: " + newx + " " + newz);
        }

        this.root.rotation.y = this.bodyOrientation;

    };


    function itemMap(newx, newz) {

        if (newx > 40 && newx < 60 && newz > -65 && newz < -40) {
            door();
        }
    }

    window.alert = function (txt) {
        createCustomAlert(txt);
    }

    //desk
    function desk() {
        alert("I'm a pc desk");
    }

    //door
    function door() {
        alert("You win!");
    }

    //bed
    function bed() {
        alert("I'm a bed");
    }

    //cabinet
    function cabinet() {
        alert("I'm a cabinet");
    }

    //closet
    function closet() {
        alert("I'm a closet");
    }

    //clothing
    function clothing() {
        alert("I'm a clothing");
    }


    var ALERT_TITLE = "Check here!";
    var ALERT_BUTTON_TEXT = "Ok";

    //customized alert
    function createCustomAlert(txt) {
        d = document;
        if (d.getElementById("modalContainer")) return;

        mObj = d.getElementsByTagName("body")[0].appendChild(d.createElement("div"));
        mObj.id = "modalContainer";
        mObj.style.height = d.documentElement.scrollHeight + "px";

        alertObj = mObj.appendChild(d.createElement("div"));
        alertObj.id = "alertBox";
        if (d.all && !window.opera) alertObj.style.top = document.documentElement.scrollTop + "px";
        alertObj.style.left = (d.documentElement.scrollWidth - alertObj.offsetWidth) / 2 + "px";
        alertObj.style.visiblity = "visible";
        alertObj.style.width = 500 + "px";
        alertObj.style.height = 500 + "px";
        h1 = alertObj.appendChild(d.createElement("h1"));
        h1.appendChild(d.createTextNode(ALERT_TITLE));
        msg = alertObj.appendChild(d.createElement("p"));
        msg.innerHTML = txt;
        msg.style.visibility = "hidden";

        if (msg.innerHTML == "I'm a pc desk") {
            console.log(msg);
            btn = alertObj.appendChild(d.createElement("img"));
            btn.src = pcurl;
            btn.id = "closeBtn";
            btn.style.width = 100 + "%";
            btn.style.height = 100 + "%";
            btn.appendChild(d.createTextNode(ALERT_BUTTON_TEXT));
            testBtn = alertObj.appendChild(d.createElement("a"));
            testBtn.className = "modal-trigger";
            testBtn.id = "enterBtn2";
            testBtn.setAttribute("onclick", "$('#myModal1').modal('open')");
            var unique = ` 
                 <script src=` + picsurl + `></script>
                <link rel="stylesheet" href=` + myModalurl + `>
                <div id="puzzle_container">
                <div id="puzzle_header">
                    <h1>Puzzle Game</h1>
                <p>
                    Ready Go Go GO
                </p>
            <div>
                <h1 id="timeCount">0.0</h1>
            </div>
            </div>
                <div id="puzzle_body">
                <div class="puzzle-row">
                <div class="puzzleBox" id="1_puzzle"></div>
                <div class="puzzleBox" id="4_puzzle"></div>
                <div class="puzzleBox" id="7_puzzle"></div>
            </div>
            <div class="puzzle-row">
            <div class="puzzleBox" id="2_puzzle"></div>
            <div class="puzzleBox" id="5_puzzle"></div>
            <div class="puzzleBox" id="8_puzzle"></div>
            </div>
            <div class="puzzle-row">
            <div class="puzzleBox" id="3_puzzle"></div>
            <div class="puzzleBox" id="6_puzzle"></div>
            <div class="puzzleBox" id="9_puzzle"></div>
            </div>
            </div>

            <div id="footer">
            <button id = "startButton">START</button>
            <div id="img-section">
            </div>
            </div>
            </div>`;

            let test1 = unique;
            $("#myModal1").empty();
            $("#myModal1").append(test1);

        }

        else if (msg.innerHTML == "I'm a bed") {
            console.log(msg);
            btn = alertObj.appendChild(d.createElement("img"));
            btn.src = bedurl;
            btn.id = "closeBtn";
            btn.style.width = 100 + "%";
            btn.style.height = 100 + "%";
            testBtn = alertObj.appendChild(d.createElement("a"));
            testBtn.className = "modal-trigger";
            testBtn.id = "enterBtn";
            testBtn.setAttribute("onclick", "$('#myModal2').modal('open')");
        }
        else if (msg.innerHTML == "I'm a cabinet") {
            console.log(msg);
            btn = alertObj.appendChild(d.createElement("img"));
            btn.src = cabineturl;
            btn.id = "closeBtn";
            btn.style.width = 100 + "%";
            btn.style.height = 100 + "%";
            btn.appendChild(d.createTextNode(ALERT_BUTTON_TEXT));
            testBtn = alertObj.appendChild(d.createElement("a"));
            testBtn.className = "modal-trigger";
            testBtn.id = "enterBtn";
            testBtn.setAttribute("onclick", "$('#myModal3').modal('open')");
            let test = `<canvas id="world"></canvas>
            <script src=` + wordsurl + `></script>
            <script src=` + appurl + `></script>
            <link rel="stylesheet" href=` + styleurl + `>
  			<div id="start-screen" class="show">
                <pre id="pre_id">
        _____                       _   _            _____                                    _
       / ____|                     | | | |          |  __ \\                                 | |
      | |  __ _   _  ___  ___ ___  | |_| |__   ___  | |__) |_ _ ___ _____      _____  _ __ __| |
      | | |_ | | | |/ _ \\/ __/ __| | __| '_ \\ / _ \\ |  ___/ _\` / __/ __\\ \\ /\\ / / _ \\| '__/ _\` |
      | |__| | |_| |  __/\\__ \\__ \\ | |_| | | |  __/ | |  | (_| \\__ \\__ \\\\ V  V / (_) | | | (_| |
       \\_____|\\__,_|\\___||___/___/  \\__|_| |_|\\___| |_|   \\__,_|___/___/ \\_/\\_/ \\___/|_|  \\__,_|
   
                </pre>
                <p>Given a list of potential passwords, try to guess the correct one.</p>
                <p>If you're wrong, we'll tell you how many letters are correct.</p>
                <button id="start">Start</button>
            </div>
            <div id="game-screen" class="hide">
                <ul id="word-list"></ul>
                <p>Click on a word to make a guess.</p>
                <p id="guesses-remaining"></p>
                <p id="winner" class="hide">Congratulations! You win! <a class="modal-close" href="#">Exit</a></p>
                <p id="score-display"></p>
                <p id="loser" class="hide">Sorry, you lose. <a class="modal-close" href="#">Exit</a></p>
                <script>
                function sendMessage(index,path) { 
                    console.log("here");
                    var column1 = document.createElement("img");
                    var col = document.getElementById("col"+index);
                    column1.id = "column1";
                    console.log(path);
                    column1.setAttribute("src",path);
                    document.getElementsByClassName("col-content grey lighten-2")[index-1].appendChild(column1);
                }
                </script>
            </div>`;
            $("#myModal3").html(test);
        }
        else if (msg.innerHTML == "I'm a clothing") {
            console.log(msg);
            btn = alertObj.appendChild(d.createElement("img"));
            btn.src = clothesurl;
            btn.id = "closeBtn";
            btn.style.width = 100 + "%";
            btn.style.height = 100 + "%";
            btn.appendChild(d.createTextNode(ALERT_BUTTON_TEXT));
            testBtn = alertObj.appendChild(d.createElement("a"));
            testBtn.className = "modal-trigger";
            testBtn.id = "enterBtn";
            testBtn.setAttribute("onclick", "$('#myModal4').modal('open')");
        }
        else if (msg.innerHTML == "I'm a closet") {
            console.log(msg);
            btn = alertObj.appendChild(d.createElement("img"));
            btn.src = cabineturl;
            btn.id = "closeBtn";
            btn.style.width = 100 + "%";
            btn.style.height = 100 + "%";
            btn.appendChild(d.createTextNode(ALERT_BUTTON_TEXT));
            testBtn = alertObj.appendChild(d.createElement("a"));
            testBtn.className = "modal-trigger";
            testBtn.id = "enterBtn";
            testBtn.setAttribute("onclick", "$('#myModal5').modal('open')");

        }
        else if (msg.innerHTML == "You win!") {
            btn2 = alertObj.appendChild(d.createElement("img"));
            btn2.src = doorurl;
            btn2.id = "closeBtn";
            btn2.style.width = 100 + "%";
            btn2.style.height = 100 + "%";
            btn2.appendChild(d.createTextNode(ALERT_BUTTON_TEXT));
            btn2.onclick = function () {
                removeCustomAlert();
                console.log("win!!!!");
                //if(itemstatus[0]&&itemstatus[1]&&itemstatus[2]&&itemstatus[3]&&itemstatus[4])
                    sendwin();
            };
        }
        else if(msg.innerHTML=="win") {

                removeCustomAlert();
            testBtn2 = alertObj.appendChild(d.createElement("a"));
            testBtn2.className = "modal-trigger";
            testBtn2.id = "enterBtn";
            testBtn2.setAttribute("onclick", "$('#myModal6').modal('open')");
            testBtn2.onclick();
        }

        // btn.focus();
        if (typeof (btn)!=="undefined") {
            btn.onclick = function () {
                removeCustomAlert();
                testBtn.onclick();
                return false;
            };
        }

        alertObj.style.display = "block";

    }

    function removeCustomAlert() {
        document.getElementsByTagName("body")[0].removeChild(document.getElementById("modalContainer"));
    }

    // internal helpers

    function inMap(x, z) {
        //hardcode for room1
        if (x < -120 || x > 60 || z < -120 || z > 12) //0
            return false;
        if (x >-30 && z > 40) //3
            return false;
        if (x < -30 && z < -65) //5
            return false;
        else
            return true;
    }

    function loadTextures(baseUrl, textureUrls) {

        var textureLoader = new THREE.TextureLoader();
        var textures = [];

        for (var i = 0; i < textureUrls.length; i++) {

            textures[i] = textureLoader.load(baseUrl + textureUrls[i], checkLoadingComplete);
            textures[i].mapping = THREE.UVMapping;
            textures[i].name = textureUrls[i];

        }

        return textures;

    }

    function createPart(geometry, skinMap) {

        var materialWireframe = new THREE.MeshLambertMaterial({
            color: 0xffaa00,
            wireframe: true,
            morphTargets: true,
            morphNormals: true
        });
        var materialTexture = new THREE.MeshLambertMaterial({
            color: 0xffffff,
            wireframe: false,
            map: skinMap,
            morphTargets: true,
            morphNormals: true
        });

        //

        var mesh = new THREE.MorphBlendMesh(geometry, materialTexture);
        mesh.rotation.y = -Math.PI / 2;

        //

        mesh.materialTexture = materialTexture;
        mesh.materialWireframe = materialWireframe;

        //

        mesh.autoCreateAnimations(scope.animationFPS);

        return mesh;

    }

    function checkLoadingComplete() {

        scope.loadCounter -= 1;
        if (scope.loadCounter === 0) scope.onLoadComplete();

    }

    function exponentialEaseOut(k) {

        return k === 1 ? 1 : -Math.pow(2, -10 * k) + 1;

    }

    // function compareAnswer(){

    // }

};
