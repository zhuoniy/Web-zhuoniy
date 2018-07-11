            if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

			var SCREEN_WIDTH = window.innerWidth;
			var SCREEN_HEIGHT = window.innerHeight;

			var container, stats, row;
			var col1, col2, col3, col4, col5;
			var colContent1, colContent2, colContent3, colContent4, colContent5;
			var camera, scene, renderer;

			var characters = [];
			var nCharacters = 0;

			var cameraControls;

			var control = {

				moveForward: false,
				moveBackward: false,
				moveLeft: false,
				moveRight: false

			};

            var nSkins = 1;
			var controls = [];

			var centerpointx=50;
			var centerpointz=-50;

			var clock = new THREE.Clock();
            var playerNo;
            var userId;
            var roomId;
            var itemstatus = [false, false,false,false,false];


			function init() {
				// dynamically create the top 5 columns to store hints/items
				container = document.createElement( 'div' );
				container.id = 'container';
				document.body.appendChild( container );

				// ROW
	    		row = document.createElement( 'div' );
	    		row.id = 'row';
	    		row.className = 'row eventresults';
	    		// create five colunms
	    		col1 = document.createElement( 'div' );
		   		col1.id = "col1";
	    		col2 = document.createElement( 'div' );
		   		col2.id = "col2";
	    		col2.className = "col s12 m2 l2 grey lighten-4";
	    		col3 = document.createElement( 'div' );
		   		col3.id = "col3";
	    		col3.className = "col s12 m2 l2 grey lighten-4";
	    		col4 = document.createElement( 'div' );
		   		col4.id = "col4";
	    		col4.className = "col s12 m2 l2 grey lighten-4";
	    		col5 = document.createElement( 'div' );
		   		col5.id = "col5";
	    		col5.className = "col s12 m2 l2 grey lighten-4";
				// placeholder for columns
	    		colContent1 = document.createElement( 'div' );
	    		colContent1.className = "col-content grey lighten-2";
	    		colContent2 = document.createElement( 'div' );
	    		colContent2.className = "col-content grey lighten-2";
	    		colContent3 = document.createElement( 'div' );
	    		colContent3.className = "col-content grey lighten-2";
	    		colContent4 = document.createElement( 'div' );
	    		colContent4.className = "col-content grey lighten-2";
	    		colContent5 = document.createElement( 'div' );
	    		colContent5.className = "col-content grey lighten-2";
	    		col1.className = "col s12 m2 l2 grey lighten-4";
	    		// append to row div
	    		document.getElementById("container").appendChild(row);
	    		document.getElementById("row").appendChild(col1);
	    		document.getElementById("row").appendChild(col2);
	    		document.getElementById("row").appendChild(col3);
	    		document.getElementById("row").appendChild(col4);
	    		document.getElementById("row").appendChild(col5);
	    		document.getElementById("col1").appendChild(colContent1);
	    		document.getElementById("col2").appendChild(colContent2);
	    		document.getElementById("col3").appendChild(colContent3);
	    		document.getElementById("col4").appendChild(colContent4);
	    		document.getElementById("col5").appendChild(colContent5);


				// CAMERA

				camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 1, 4000 );
				camera.position.set( -50, 230, -50 );

				// SCENE

				scene = new THREE.Scene();
				scene.background = new THREE.Color( 0xffffff );
				scene.fog = new THREE.Fog( 0xffffff, 1000, 4000 );

				scene.add( camera );

				// LIGHTS

				scene.add( new THREE.AmbientLight( 0x222222 ) );

				var light = new THREE.DirectionalLight( 0xffffff, 2.25 );
				light.position.set( 200, 450, 500 );

				light.castShadow = true;

				light.shadow.mapSize.width = 1024;
				light.shadow.mapSize.height = 512;

				light.shadow.camera.near = 100;
				light.shadow.camera.far = 1200;

				light.shadow.camera.left = -1000;
				light.shadow.camera.right = 1000;
				light.shadow.camera.top = 350;
				light.shadow.camera.bottom = -350;

				scene.add( light );
				// scene.add( new THREE.CameraHelper( light.shadow.camera ) );


				// MODEL

				var onProgress = function ( xhr ) {
					if ( xhr.lengthComputable ) {
						var percentComplete = xhr.loaded / xhr.total * 100;
						console.log( Math.round(percentComplete, 2) + '% downloaded' );
					}
				};

				var onError = function ( xhr ) { };

				THREE.Loader.Handlers.add( /\.dds$/i, new THREE.DDSLoader() );

				var mtlLoader = new THREE.MTLLoader();
				//mtlLoader.setPath( "{% static '/media/models/obj/male02/'  %}");
				mtlLoader.load( mtl, function( materials ) {

					materials.preload();

					var objLoader = new THREE.OBJLoader();
					objLoader.setMaterials( materials );
					//objLoader.setPath( "{% static 'models/obj/male02/'  %}");
					objLoader.load( obj, function ( object ) {

						object.position.y = 0;
						scene.add( object );

					}, onProgress, onError );

				});


				// RENDERER
				renderer = new THREE.WebGLRenderer( { antialias: true } );
				renderer.setPixelRatio( window.devicePixelRatio );
				renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
				container.appendChild( renderer.domElement );

				//

				renderer.gammaInput = true;
				renderer.gammaOutput = true;

				renderer.shadowMap.enabled = true;
				renderer.shadowMap.type = THREE.PCFSoftShadowMap;

				// STATS

				stats = new Stats();
				container.appendChild( stats.dom );

				// EVENTS

				window.addEventListener( 'resize', onWindowResize, false );
				document.addEventListener( 'keydown', onKeyDown, false );
				document.addEventListener( 'keyup', onKeyUp, false );

				// CONTROLS

				//cameraControls = new THREE.OrbitControls( camera, renderer.domElement );
				//cameraControls.target.set( centerpointx, 50, centerpointz );
				//cameraControls.update();
                camera.lookAt(50, -200, -50 );

				// CHARACTER

				var configOgro = {

					baseUrl: base,

					body: "ogro.md2",
					skins: [ "2.jpg", "ogrobase.png", "arboshak.png", "ctf_r.png", "ctf_b.png", "darkam.png", "freedom.png",
							 "gib.png", "gordogh.png", "igdosh.png", "khorne.png", "nabogro.png",
							 "sharokh.png" ],
					weapons:  [ [ "weapon.md2", "weapon.jpg" ] ],
					animations: {
						move: "run",
						idle: "stand",
						jump: "jump",
						attack: "attack",
						crouchMove: "cwalk",
						crouchIdle: "cstand",
						crouchAttach: "crattack"
					},

					walkSpeed: 75,
					crouchSpeed: 175

				};

				var nRows = 1;
				//var nSkins = 1;

				nCharacters = nSkins * nRows;

				for (var i=0; i< nCharacters; i++) {
				    controls[i]={

				        moveForward: false,
			        	moveBackward: false,
			        	moveLeft: false,
			        	moveRight: false,
                        moveF: false

			        };
                }

				for ( var i = 0; i < nCharacters; i ++ ) {

					var character = new THREE.MD2CharacterComplex();
					character.scale = 1;
					character.controls = controls[i];
					characters.push( character );

				}

				var baseCharacter = new THREE.MD2CharacterComplex();
				baseCharacter.scale = 1;

				baseCharacter.onLoadComplete = function () {

					var k = 0;

					for ( var j = 0; j < nRows; j ++ ) {

						for ( var i = 0; i < nSkins; i ++ ) {

							var cloneCharacter = characters[ k ];

							cloneCharacter.shareParts( baseCharacter );

							// cast and receive shadows
							cloneCharacter.enableShadows( true );

							//cloneCharacter.setWeapon( 0 );
							cloneCharacter.setSkin( i );

							cloneCharacter.root.position.x = -25;
							cloneCharacter.root.position.z = j * 90 - 50;

							scene.add( cloneCharacter.root );

							k ++;

						}

					}

					var gyro = new THREE.Gyroscope();
					//gyro.add( camera );  //camero does not focus on the character
					gyro.add( light, light.target );

					characters[ Math.floor( nSkins / 2 ) ].root.add( gyro );

				};

				baseCharacter.loadParts( configOgro );



			}

			// EVENT HANDLERS

			function onWindowResize( event ) {

				SCREEN_WIDTH = window.innerWidth;
				SCREEN_HEIGHT = window.innerHeight;

				renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );

				camera.aspect = SCREEN_WIDTH/ SCREEN_HEIGHT;
				camera.updateProjectionMatrix();

			}
            function onKeyDown ( event ) {

				event.stopPropagation();
			    keyDownMessage(event.keyCode, playerNo);
            }

			function controlKeyDown ( keyCode, i ) {


		//		if (characters[0].root.position.x > -78 && characters[0].root.position.x < 197 && characters[0].root.position.z > -180 && characters[0].root.position.z < 95)
		//		{
					switch( keyCode ) {

					case 38: /*up*/
					case 87: /*W*/ 	controls[i].moveForward = true; break;

					case 40: /*down*/
					case 83: /*S*/ 	 controls[i].moveBackward = true; break;

					case 37: /*left*/
					case 65: /*A*/   controls[i].moveLeft = true; break;

					case 39: /*right*/
					case 68: /*D*/    controls[i].moveRight = true; break;

					//case 67: /*C*/     controls.crouch = true; break;
					//case 32: /*space*/ controls.jump = true; break;
					//case 17: /*ctrl*/  controls.attack = true; break;
					case 32: /*space*/
					case 70: /*F*/
						controls[i].moveF = true; break;

					}
		//		}
			}

			function onKeyUp ( event ) {

                event.stopPropagation();
			    keyUpMessage(event.keyCode, playerNo);
            }

            function controlKeyUp ( keyCode,i ) {
				switch( keyCode ) {

					case 38: /*up*/
					case 87: /*W*/ controls[i].moveForward = false; break;

					case 40: /*down*/
					case 83: /*S*/ 	 controls[i].moveBackward = false; break;

					case 37: /*left*/
					case 65: /*A*/ 	 controls[i].moveLeft = false; break;

					case 39: /*right*/
					case 68: /*D*/ 	  controls[i].moveRight = false; break;

					//case 67: /*C*/     controls.crouch = false; break;
					//case 32: /*space*/ controls.jump = false; break;
					//case 17: /*ctrl*/  controls.attack = false; break;
					case 32: /*space*/
					case 70: /*F*/
						controls[i].moveF = false; break;

				}

			}

			function animate() {

				requestAnimationFrame( animate );
				render();

				stats.update();

			}

			function render() {

				var delta = clock.getDelta();

				for ( var i = 0; i < nCharacters; i ++ ) {

					characters[ i ].update( delta );

				}

				renderer.render( scene, camera );

			}
			// Answer for BED
			function compareAnswer2() {
	        var answer = $('#answer').val();
	        var given =  $('#input_value').val();
	        console.log("selected "+ given);
	        console.log("answer "+ answer);
	        if(given === answer) {
	            console.log("you win");
	            let congrats = `<p id="winner" class="">Congratulations! You win! </p><a  id = "clo" class="modal-close btn-primary btn" onclick="getItem(3)">Exit</a>`
	            $("#myModal2").html(congrats);
	            $("#clo").click(function(){
	            	$("#myModal2").hide();
	            });
	        	}
	    	};
	    	// Answer for cabinet
			function compareAnswer() {
	        var answer = $('#answer2').val();
	        var given =  $('#input_value2').val();
	        console.log("selected "+ given);
	        console.log("answer "+ answer);
	        if(given === answer) {
	            console.log("you win");
	            let congrats = `<p id="winner" class="">Congratulations! You win! </p><a id = "clo1" class="modal-close btn-primary btn" onclick="getItem(1)">Exit</a>`
	            $("#myModal4").html(congrats);
	            $("#clo1").click(function(){
	            	$("#myModal4").hide();
	            });
	        	}
	    	};

	    	/* item match chart:
	    	clothing 1
	    	desk 2
	    	bed 3
	    	bed cabnet 4
	    	cabinet 5*/

	    	/*
			Send message to the back end and when receive feedback, append picture to
			the corresponding column.
	    	*/
	    	function sendMessage(index,path) {
	    		console.log("here");
	    		var column1 = document.createElement("img");
	    		var col = document.getElementById("col"+index);
	    		column1.id = "column1";
	    		column1.setAttribute("src",path);
	    		document.getElementsByClassName("col-content grey lighten-2")[index-1].innerHTML="";
	    		document.getElementsByClassName("col-content grey lighten-2")[index-1].appendChild(column1);
	    	}
