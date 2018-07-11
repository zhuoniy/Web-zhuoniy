from channels import Group
from channels import Channel
from urllib.parse import parse_qs
import json
from escapeRoom.models import *
from django.shortcuts import get_object_or_404

#Connected to websocket.connect
#this is for websocket connection
rooms = {}
room_connections = {}
room_channel_user = {}


def ws_add(message):
    print("New user added into the mission")
    print(message.content)
    params = parse_qs(message.content['query_string'])
    roomId = ""
    userId = ""
    userList = []
    msg = {}

    if b"roomid" in params:
        roomId = params[b"roomid"][0].decode("utf8")
    if b"userid" in params:
        userId = params[b"userid"][0].decode("utf8")
    print(userId)
    print(roomId)
    msg['type'] = 'connect'
    msg['id'] = roomId

    if not rooms.get(roomId):
        msg['state'] = "create_success"
        rooms[roomId] = userList
        rooms[roomId].append(userId)
        Group("room-%s" % roomId).add(message.reply_channel)
        room_connections[message.reply_channel.name] = roomId
        room_channel_user[message.reply_channel.name] = userId

    elif userId in rooms.get(roomId):
        msg['state'] = 'join_success'

    else:
        msg['state'] = 'join_success'
        rooms[roomId].append(userId)
        room_connections[message.reply_channel.name] = roomId
        room_channel_user[message.reply_channel.name] = userId
        Group("room-%s" % roomId).add(message.reply_channel)

    # Then add the player into
    new_user = get_object_or_404(User, id=int(userId))
    new_player = Player(user=new_user)
    new_player.save()
    game = get_object_or_404(Mission, gameid=int(roomId))
    game.add_player(new_player)
    game.save()
    msg['playerList']= list(User.objects.filter(id__in=rooms[roomId]).values_list('username', flat=True).all())

    Group("room-%s" % roomId).send({"accept": True,
                                    "text": json.dumps(msg)})



# this is for message received from the server
def ws_message(message):
    print("Receive an message, user click the button")
    msg = {}
    roomId = ""
    userId = ""

    print(message.content)
    params = json.loads(message.content['text'])

    print(params)

    if params['type'] == "startGame":
        # start game
        msg['type'] = 'start'
        roomId = params['roomId']
        userId = params['userId']
        msg['allNum'] = len(rooms[roomId])

        msg['userId'] = userId
        msg['roomId'] = roomId
        # change game status to 1
        value = int(roomId)
        game = get_object_or_404(Mission, gameid=value)
        game.status = 1
        game.save()
        # send message to all user to indicate the game is start
        print("sending" , msg)
        # tranverse to get all channel
        for channel in Group("room-%s" % roomId).channel_layer.group_channels("room-%s" % roomId):
            for i in range(len(rooms[roomId])):
                if rooms[roomId][i] ==  room_channel_user[Channel(channel).name]:
                    msg['playerNo'] = i
                    break

            msg['playerNo'] = i
            Channel(channel).send({"accept": True,

                                "text": json.dumps(msg)})

    elif params['type'] == 'keyup':
        roomId = params['roomId']
        userId = params['userId']

        msg['type'] = 'keyup'

        msg['roomId'] = roomId
        msg['userId'] = userId
        msg['playerNo'] = params['playerNo']
        msg['keyCode'] = params['keyCode']
        msg['px'] = params['px']
        msg['pz'] = params['pz']
        msg['ori'] = params['ori']
        Group('room-%s'% roomId).send({"accept": True,
                                        "text": json.dumps(msg)})

    elif params['type'] == 'keydown':
        roomId = params['roomId']
        userId = params['userId']

        msg['type'] = 'keydown'
        msg['roomId'] = roomId
        msg['userId'] = userId
        msg['playerNo'] = params['playerNo']
        msg['keyCode'] = params['keyCode']
        Group('room-%s' % roomId).send({"accept": True,
                                        "text": json.dumps(msg)})

    elif params['type'] == 'getItem':
        roomId = params['roomId']
        userId = params['userId']
        itemId = params['itemId']
        msg['type'] = 'getItem'
        msg['itemId'] = itemId
        msg['userId'] = userId
        msg['roomId'] = roomId
        Group('room-%s' % roomId).send({"accept": True,
                                        "text": json.dumps(msg)})
    elif params['type'] == 'win':

        msg['type'] = 'win'
        roomId = params['roomId']
        userId = params['userId']
        msg['userId'] = userId
        msg['roomId'] = roomId
        print(msg)
        Group('room-%s' % roomId).send({"accept": True,
                                        "text": json.dumps(msg)})

# this is for connection close
def ws_disconnect(message):
    print(message.content)
    roomId = room_connections.get(message.reply_channel.name)
    userId = room_channel_user.get(message.reply_channel.name)
    print(roomId)
    print(userId)
    msg = {}
    msg['type'] = 'offline'
    msg['userId'] = userId
    if (rooms.get(roomId)):
        # delete for the list
        userList = rooms[roomId]
        userList.remove(userId)
        user = get_object_or_404(User, id=int(userId))
        msg['username'] = user.username
        player = get_object_or_404(Player, user=user)
        player.delete()
        game = get_object_or_404(Mission, gameid=int(roomId))
        if len(game.players.all()) == 0:
            game.status = 0
            game.save()
        Group("room-%s" % roomId).send({
            "text": json.dumps(msg),
        })
        Group("room-%s" % roomId).discard(message.reply_channel)