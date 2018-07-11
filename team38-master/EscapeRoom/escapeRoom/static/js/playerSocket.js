var player_socket;
window.onload = function load() {
    var url=GetRequest();
    userId=url['userid'];
    roomId=url['roomid'];
    createSocket();
}

function GetRequest() {
   var url = location.href;
   console.log(url);
   var theRequest = new Object();

   if (url.lastIndexOf('/')) {
      var str = url.substr(url.lastIndexOf('/')+1);
      console.log(str);
      strs = str.split('&');
      for(var i = 0; i < strs.length; i ++) {
         theRequest[strs[i].split("=")[0]] = strs[i].split("=")[1];
      }
   }
   console.log(theRequest);
   return theRequest;
}
	function createSocket() {
        console.log(roomId);
        console.log(userId);
		player_socket = new WebSocket("ws://128.237.201.4:8000/room/?roomid="+roomId + "&userid="+userId);
		player_socket.onopen = function() {
			//console.log(event);
			//var msg = JSON.parse(event.data);
            //start button

            var butt=document.createElement("button");
            var node=document.createTextNode("START");
            butt.className = "btn-primary btn";
            butt.appendChild(node);
            butt.setAttribute("onclick", "startGame('"+roomId+"')");

            var element=document.getElementById("playBar");
            element.appendChild(butt);
		};

		player_socket.onmessage = function(event) {
			console.log(event); // reveived message, handle control

			var msg = JSON.parse(event.data);
			switch(msg.type){
                case 'connect':

                    var html2 = 'RoomId:'+roomId/10 +' ';
					$("#playInfo").append(html2);
			        $("#playerList").empty();

                    //show playerList
			        playerList=msg.playerList; //desfine playerList
                    var html = '';

                    //nSkins=playerList.length;
                    //playerNo=playerList.length+1;

                    for(var i=0,pLen=playerList.length;i<pLen;i++) {
	                    html+= '<li>'+
                            '<h4>'+ playerList[i] +'</h4>'+
  			            '</li>';
                    }
                    $('#playerList').append(html);
                    break;
			    case "keydown":
			    	if (msg.keyCode==70&&msg.playerNo!=playerNo)
			    		break;
			        controlKeyDown(msg.keyCode,msg.playerNo);
			        break;
			    case "keyup":
			        controlKeyUp(msg.keyCode,msg.playerNo);
			        characters[msg.playerNo].root.position.x=msg.px;
			        characters[msg.playerNo].root.position.z=msg.pz;
			        characters[msg.playerNo].bodyOrientation=msg.ori;
			        break;
			    case 'start':
			        nSkins = msg.allNum;
                    playerNo = msg.playerNo;
			        init();
			        animate();

			        $("#playerList").empty();

			        $("#playBar").empty();

			        $('#playInfo').append(
			'EscapeRoom Level 1<br />' +
			'Use arrows or "W" "S" "A" "D" to control characters, mouse for camera)');
                    break;
                case 'addPlayer':
                    player=msg.player; //desfine playerList
			        $("#playerList").empty();

			        $("#playBar").empty();

                    $('#playerList').append(
                        '<li>' +
                        '<img src="'+ player.playerImg +'">'+
                        '<h4>'+ player.playerName +'</h4>'+
  			            '</li>');
			        break;
				case 'getItem':
					if(!itemstatus[msg.itemId-1]) {
                        itemstatus[msg.itemId - 1] = true;
                        sendMessage(msg.itemId, parchmenturls[msg.itemId - 1]);
                    }
					break;
				case 'win':
					win();
					break;
            }
		};
		player_socket.onclose = function(event) {
			console.log(event);
		}

	}
	function keyDownMessage(keyCode) {
		var msg = {type: 'keydown',userId: userId,roomId: roomId, playerNo:playerNo, keyCode: keyCode};
		player_socket.send(JSON.stringify(msg));
	}

	function keyUpMessage(keyCode) {
		var px=characters[playerNo].root.position.x;
		var pz=characters[playerNo].root.position.z;
		var ori=characters[playerNo].bodyOrientation;
		var msg = {type: 'keyup',userId: userId,roomId: roomId, playerNo:playerNo, keyCode:keyCode,px:px, pz:pz,ori:ori};
		player_socket.send(JSON.stringify(msg));
	}

	function startGame(roomId){
		var msg = {type: 'startGame',userId: userId, roomId: roomId};
		player_socket.send(JSON.stringify(msg));
    }
	function Closesocket() {
		player_socket.close();
	}

	function getItem(itemId) {
		var msg = {type: 'getItem',userId: userId, roomId: roomId,itemId:itemId};
		player_socket.send(JSON.stringify(msg));
	}

	function sendwin() {
		var msg = {type: 'win',userId: userId, roomId: roomId};
		player_socket.send(JSON.stringify(msg));
	}


	/*function win() {
            testBtn2 = alertObj.appendChild(d.createElement("a"));
            testBtn2.className = "modal-trigger";
            testBtn2.id = "enterBtn";
            testBtn2.setAttribute("onclick", "$('#myModal6').modal('open')");
            testBtn2.onclick();
	}
*/
	function win() {
        alert("win");
    }