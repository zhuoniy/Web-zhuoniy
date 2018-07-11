
createSocket() {
	this.gamesocket = new WebSocket("ws://localhost:8000/game/?join=True&roomId=" + this.roomId + 
									"&userId=" + this.user_id);
	this.gamesocket.onopen = function (message) {
    	var msg = JSON.parse(message.data);
    	if (this.room_socket != null) {
    		switch (msg.state) {
    			case 'room_not_exist':
    				// do something 
    				break;
    			case 'join_success':
    				// do something
    				break;
    			case 'create_success':
    				// do something
    				break;
    			case  'room_exist':
    				break;
    		}
    }
    if (this.gamesocket != null) {
    	// Call back function for send message 
    	this.gamesocket.onmessage = function (message) {
    		var msg = JSON.parse(message.data);
    		switch (msg.state) {
    			case 'already_open':
    				// do something 
    				break;
    			case 'cannot_open':
    				// do something
    				break;

    			case 'acquire_it':
    				// do something
    				break;
    		}
    	}

    }
    this.gamesocket.onclose = function(event) {
    	 console.log("Socket close successfully!")
    }
}

// when sending message from the socket to server
// for example, when you click a item
var msg = {
	type: 'message',
    action: 'join',
    userId: '' + self.user_id,
    roomId: self.roomId,
    itemId: self.itemId,
}
this.gamesocket.send(JSON.stringify(msg));

// close 
this.gamesocket.close();