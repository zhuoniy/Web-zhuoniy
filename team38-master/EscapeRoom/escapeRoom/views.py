# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from django.contrib.auth import *
from django.shortcuts import render, redirect, get_object_or_404, HttpResponse
from escapeRoom.forms import *
from django.contrib import auth
from django.http import Http404
from django.urls import reverse
from mimetypes import guess_type
#Django transaction system so we can use @transaction.atomic
from django.db import transaction
from django.contrib.auth.decorators import login_required

# Used to send mail from within Django
from django.core.mail import send_mail

from channels import Group
# Used to generate a one-time-use token to verify a user's email address
from django.contrib.auth.tokens import default_token_generator
import json
roomstart = 10000

#jump to the main page select levels
def home(request):
    return redirect("main_page")


# login_page
def login(request):
    context = {"user": request.user, "form": LoginForm(), "message": [], "errors": []}
    try:
        if request.user.is_authenticated:
            return redirect("main_page")

        # as the first time we go the login in html it is the get request
        if request.method == "POST":
            form = LoginForm(request.POST)
            context["form"] = form
            if form.is_valid():
                username = form.cleaned_data.get("username")
                password = form.cleaned_data.get("password")
                user = authenticate(username=username, password=password)
                if user is not None:
                    auth.login(request, user)
                    # redirect to the main page
                    return redirect("main_page")

                else:
                    context["errors"].append("User does not exist or password is incorrect!")
            # the first time get
        else:
            context = {"user": request.user, "form": LoginForm(), "message": [], "errors": []}

    except Exception as e:
        context["form"] = LoginForm()
        context["errors"].append("Wrong Input! please check")
    return render(request, "login.html", context)


@transaction.atomic
def register(request):
    context = {"user": request.user, "form": RegisterForm(), "message": [], "errors": []}
    try:
        if request.method == "POST":
            form = RegisterForm(request.POST)
            context["form"] = form
            if form.is_valid():
                new_user = User.objects.create_user(username=form.cleaned_data.get("username"),
                                                    first_name=form.cleaned_data.get("first_name"),
                                                    last_name=form.cleaned_data.get("last_name"),
                                                    password=form.cleaned_data.get("password"),
                                                    email=form.cleaned_data.get("email"))
                #new_user.is_active = False
                new_user.save()
                new_user_profile = UserData(user=new_user)
                new_user_profile.save()
                '''
                token = default_token_generator.make_token(new_user)
                
                email_body = """ Please click the link  below to verify your email address and complete the registration of your account:
                                                 http://{host}{path}""".format(host=request.get_host(),
                                                                               path=reverse("confirm-email",
                                                                               args=(new_user.username, token)))
                ok = send_mail(subject="EscapeRoom email Verification", message=email_body,
                               from_email="wenxiaoz@andrew.cmu.edu", recipient_list=[new_user.email])
                '''
                context["message"].append("You have successfully registered! Please Login!")

                if len(context["message"]) >= 1:
                    auth.login(request, new_user)
                    return redirect("login")
            else:
                context["errors"].append("You should fill in all the information to register an account!")
        else:
            context = {"user": request.user, "form": RegisterForm(), "message": [], "errors": []}
    except Exception as e:
        raise Http404("Error Input!" + e.__str__())

    return render(request, "register.html", context)


@login_required
@transaction.atomic
# at every 20ms we need to update the position of the pos_x and pos_y
# Then the server will return the postion of the
def update_postition(request, mission_id, pos_x, pos_y):
    content = {"player": []}
    try:
        game = Mission.objects.filter(id=mission_id)
        mine = game.get_player(request.user.id)
        mine.set_pos(pos_x, pos_y)
        content["player"] = game.players.all()
        return HttpResponse(json.dumps(content), content_type="application/json")
    except Exception as e:
        raise Http404(e.__str__())


# when the player click the door then we need to check if
# they can get out of the door
@login_required
@transaction.atomic
def check_canout(request, mission_id):
    content = {"canout": None}
    try:
        if request.method != 'POST':
            raise Http404
        else:
            game = Mission.objects.filter(id=mission_id)
            if game.status == 0:
                content["canout"] = "failed"

            else:
                content["canout"] = "success"
                # Then we need to send the message to all user
                # Remove the game in the mission
                # send to all user
                Group("room-%s" % mission_id).send({
                    'text': json.dumps(content),
                })
                # change all the users level
                players = game.players.all()
                for player in players:
                    user = UserData.objects.filter(user=player.user)
                    user.set_levels(user.levels + 1)
                items = game.items.all()
                # change all item back to 0 state and set the player to None
                for item in items:
                    item.status = 0
                    item.player = None

    except Exception as e:
        raise Http404(e.__str__())


# this function is for init the level
'''
@login_required
@transaction.atomic

def start_game(request, level_num):
    context = {"players": [], "items": [], "message": [], "errors": []}
    name = "level-" + level_num + ".html"
    # create the game
    try:
        if request.method != "POST":
            pass
        else:
            new_game = Mission()
            new_player = Player(request.user)
            new_player.mission_id = new_game.id
            new_player.save()
            #load all the background

            #load all the items

            #load all the players
            new_game.add_player(new_player.user_id)
            new_game.save()

    except Exception as e:
        raise Http404(e.__str__())
    return render(request, name, context)
'''

@login_required
@transaction.atomic
# join or create a game
def join_game(request):
    content = {"messages": [],"errors":[]}
    try:
        if request.method != "POST":
            raise Http404
        else:
            # find the game from the database
            # Then add the new player the game
            if not 'input' in request.POST or not request.POST['input']:
                message = 'You must enter an game id to play.'
                json_error = '{ "error": "' + message + '" }'
                return HttpResponse(json_error, content_type='application/json')
            if not 'level' in request.POST or not request.POST['level']:
                message = "You must enter an level to play"
                json_error = '{ "error": "' + message + '" }'
                return HttpResponse(json_error, content_type='application/json')
            else:

                value = int(request.POST['input'])
                level_id = int(request.POST['level'])
                game_id = value * 10 + (level_id - 1)
                game = Mission.objects.filter(gameid=game_id)
                if len(game) == 0:
                    #cretae new item for the item
                    new_game = Mission(gameid=game_id)
                    new_game.save()

                    return redirect(reverse("room", kwargs={'userid': request.user.id, 'roomid':game_id}))
                game = get_object_or_404(Mission, gameid=game_id)
                if game.status == 1:
                    content['messages'].append("The game is already started!")
                    return render(request, "main_page.html", content)
                return redirect(reverse("room", kwargs={'userid': request.user.id,'roomid': game_id}))
    except Exception as e:
        raise Http404(e.__str__())


# this function is for init the level
@login_required
def room(request, userid, roomid):
    print(userid, roomid)
    level = (int (roomid)) % 10 + 1
    html = "room" + str(level) + ".html"
    # check if userid and roomid is in the user and room
    try:
        user = get_object_or_404(User, id =userid)
        mission = get_object_or_404(Mission, gameid=roomid)
        if(mission.gameid == 1):
            raise Http404("The game is already started")
        context = {}
        return render(request, html, context)
    except Exception as e:
        raise Http404(e.__str__())


@login_required
def single(request, level):
    global roomstart
    value = int(roomstart)
    game_id = value * 10 + (int(level) - 1)
    new_game = Mission(gameid=game_id)
    new_game.save()
    roomstart = roomstart + 1
    return redirect(reverse("room", kwargs={'userid': request.user.id, 'roomid': game_id}))


@login_required
@transaction.atomic
def main_page(request):
    context = {"current_level": 1}
    try:
        #if post it means the user hit the button
        if request.method == "POST":
            # get the number of the levels to jump to different  levels
            level_num = int(request.POST["n_bt"])
            return redirect("start-game", level_num)
        # if gets we should only show the result
        else:
            player = get_object_or_404(UserData, user=request.user)
            context["current_level"] = player.levels

    except Exception as e:
        raise Http404("No such user. " + e.__str__())
    return render(request, "main_page.html", context)


def get_media(request, media_name):
    try:
        if request.method == "GET":
            im = open(media_name, "rb").read()
            return HttpResponse(im, content_type=guess_type(media_name))
        else:
            raise HttpResponse('Only Get is acceptable!')

    except Exception as e:
        raise Http404("File Not Found" + e.__str__())


@transaction.atomic
def confirm_registration(request, username, token):
    user = get_object_or_404(User, username=username)
    # Send 404 error if token is invalid
    if not default_token_generator.check_token(user, token):
        raise Http404
    # Otherwise token was valid, activate the user.
    user.is_active = True
    user.save()
    return HttpResponse("Your email has been confirm!")


@login_required
def get_image(request, user_id):
    try:
        user = get_object_or_404(User, id=user_id)
        profile = get_object_or_404(UserData, user=user)
        if not profile.image:
            return Http404
        else:
            return HttpResponse(profile.image)
    except Exception as e:
        raise Http404(e.__str__())


@login_required
@transaction.atomic
def profile(request, user_id):
    # init
    context = {"user": request.user, "profile_owner": get_object_or_404(User, id=user_id), "profile": None,
               "palyings": []}
    try:
        context["profile"] = get_object_or_404(UserData, user=context["profile_owner"])
        # get all the following of profile_owner
        players = context["profile"].players.values_list("id", flat=True).distinct()
        items = UserData.objects.filter(id__in=players)
        context["palyings"] = items
    except Exception as e:
        raise Http404("No such user. " + e.__str__())

    return render(request, "profile.html", context)

@login_required
@transaction.atomic
def change_password(request):
    try:
        context = {"user": request.user, "messages": [], "errors": [], "form": None}
        if request.method == "POST":
            form = PasswordChangeForm(request.POST, user=request.user)
            if form.is_valid():
                new_password = form.cleaned_data.get("new_password")
                request.user.set_password(new_password)
                request.user.save()
                update_session_auth_hash(request, request.user)
                context["messages"].append("You have successfully changed your password!")
        else:
            form = PasswordChangeForm(user=request.user)
        context["form"] = form
        return render(request, "change-password.html", context)
    except Exception as e:
        raise Http404(e.__str__())


@login_required
@transaction.atomic
def edit_profile(request):
    context = {"user": request.user, "profile_edit_form1": None, "profile_edit_form2": None, "messages": [],
               "errors": []}

    try:
        if request.method == "POST":
            profile = get_object_or_404(UserData, user=request.user)
            # bind to instance and update
            name_form = ProfileEditFormNames(request.POST, instance=request.user)
            other_profile_form = ProfileEditFormOtherProfile(request.POST, request.FILES, instance=profile)
            if name_form.is_valid() and other_profile_form.is_valid():
                name_form.save()
                other_profile_form.save()
                context["messages"].append("Profile Update!")
            # for get request we need to get the initial
        cur_profile = get_object_or_404(UserData, user=request.user)
        context["profile_edit_form1"] = ProfileEditFormNames(initial={"first_name": request.user.first_name,
                                                                          "last_name": request.user.last_name})
        context["profile_edit_form2"] = ProfileEditFormOtherProfile(initial={"bio": cur_profile.bio,
                                                                             "image": cur_profile.image})
    except Exception as e:
        raise Http404(e.__str__())
    return render(request, "profile_edit.html", context)



