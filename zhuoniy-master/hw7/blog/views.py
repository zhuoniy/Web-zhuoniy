# -*- coding: utf-8 -*-
from __future__ import unicode_literals


from django.shortcuts import render
from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse, Http404

from django.db import transaction

# Create your views here.

# Helper function to guess a MIME type from a file name
from mimetypes import guess_type

from django.shortcuts import render, redirect
from django.core.urlresolvers import reverse
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib.auth import login, authenticate

from django.views.decorators.csrf import ensure_csrf_cookie

from django.core.exceptions import ObjectDoesNotExist
from django.core import serializers

from django.contrib.auth import update_session_auth_hash
from django.utils import timezone

from blog.forms import RegistrationForm


from blog.models import *
from blog.forms import *

import datetime
import json
import ast

# Used to generate a one-time-use token to verify a user's email address
from django.contrib.auth.tokens import default_token_generator

# Used to send mail from within Django
from django.core.mail import send_mail


@transaction.atomic
def register(request):
    context = {}

    # Just display the registration form if this is a GET request.
    if request.method == 'GET':
        context['form'] = RegistrationForm()
        return render(request, 'blog/register.html', context)

    # Creates a bound form from the request POST parameters and makes the 
    # form available in the request context dictionary.
    form = RegistrationForm(request.POST)
    context['form'] = form

    # Validates the form.
    if not form.is_valid():
        return render(request, 'blog/register.html', context)

    # At this point, the form data is valid.  Register and login the user.
    new_user = User.objects.create_user(username=form.cleaned_data['username'], 
                                        password=form.cleaned_data['password1'],
                                        email=form.cleaned_data['email'],
                                        first_name=form.cleaned_data['first_name'],
                                        last_name=form.cleaned_data['last_name'])

    # Mark the user as inactive to prevent login before email confirmation.
    new_user.is_active = False
    new_user.save()

    # Generate a one-time use token and an email message body
    token = default_token_generator.make_token(new_user)

    email_body = """
Please click the link below to verify your email address and
complete the registration of your account:

  http://{host}{path}
""".format(host=request.get_host(), 
           path=reverse('confirm', args=(new_user.username, token)))

    send_mail(subject="Verify your email address",
              message= email_body,
              from_email="YGBLOG@cmu.edu",
              recipient_list=[new_user.email])

    context['email'] = form.cleaned_data['email']

    return render(request, 'blog/needs-confirmation.html', context)

@transaction.atomic
def confirm_registration(request, username, token):
    user = get_object_or_404(User, username=username)

    # Send 404 error if token is invalid
    if not default_token_generator.check_token(user, token):
        raise Http404

    # Otherwise token was valid, activate the user.
    user.is_active = True
    user.save()

    user_profile = UserProfile(user=user)
    user_profile.save()

    return render(request, 'blog/confirmed.html', {})

@login_required
@transaction.atomic
@ensure_csrf_cookie
def globals(request):
    context = {}

    context['user'] = request.user
    context['posts'] = Post.objects.order_by('-date_created')

    return render(request, 'blog/global.html', context)



@login_required
@transaction.atomic
@ensure_csrf_cookie
def follower(request):
    context = {}
    context['user'] = request.user
    user_profile = get_object_or_404(UserProfile, user=request.user)
    if not user_profile:
        raise Http404("Nonexistent user.")
    following = user_profile.follows.order_by('-date_created')
    context['posts'] = Post.objects.filter(user__in=following)

    return render(request, 'blog/follower.html', context)


#@2
@login_required
@ensure_csrf_cookie
def get_post(request):
    posts = Post.objects.order_by('-date_created')
    response_text = serializers.serialize('json', posts)
    response_text = json.loads(response_text)
    response = "["
    for post in response_text:
        comment_list = serializers.serialize('json', Comment.objects.filter(post__id=post['pk']))
        comment_list = json.loads(comment_list)
        post['comments'] = comment_list
        post = json.dumps(post)
        response = response + post + ", "
    response = response[:-2] + "]"
    return HttpResponse(response, content_type='application/json')


@login_required
@ensure_csrf_cookie
@transaction.atomic
def f_get_post(request):
    user_profile = get_object_or_404(UserProfile, user=request.user)
    if not user_profile:
        raise Http404("Nonexistent user.")
    following = user_profile.follows.all()
    posts = Post.objects.filter(user__in=following).all()
    response_text = serializers.serialize('json', posts)
    response_text = json.loads(response_text)
    response = "["
    for post in response_text:
        comment_list = serializers.serialize('json', Comment.objects.filter(post__id=post['pk']))
        comment_list = json.loads(comment_list)
        post['comments'] = comment_list
        post = json.dumps(post)
        response = response + post + ", "
    response = response[:-2] + "]"
    return HttpResponse(response, content_type='application/json')


#@1
@login_required
@ensure_csrf_cookie
def add_post(request):
    if request.method != 'POST':
        raise Http404

    errors = []
    if not 'text' in request.POST or not request.POST['text']:
        message = 'Write a post.'
        json_error = '{"error":"'+message+'"}'
        return HttpResponse(json_error,content_type='application/json')

    new_post = Post(user=request.user, first_name=request.user.first_name,date_created=datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"), text=request.POST['text'])
    new_post.save()
    return redirect(reverse('getpost'))

@login_required
@ensure_csrf_cookie
def add_comment(request):
    errors = []
    if not 'comment' in request.POST or not request.POST['comment']:
        message = 'Write a comment.'
        json_error = '{"error":"'+message+'"}'
        return HttpResponse(json_error,content_type='application/json')
    print(request.POST['postid'])
    related_post=Post.objects.get(id=int(request.POST['postid']))
    new_comment = Comment(user=request.user, first_name=request.user.first_name, date_created=datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"), text=request.POST['comment'], post=related_post)
    new_comment.save()
    return redirect(reverse('getpost'))


# the 'user' returned by profile is the user of the page host
# but the 'user' returned by other functions is the loggin user
@login_required
@ensure_csrf_cookie
def profile(request, username):
    context = {}
    errors = []
    context['errors'] = errors

    if len(User.objects.filter(username=username)) <= 0:
        errors.append('User does not exist.')

    user = get_object_or_404(User, username=username)
    if not user:
        raise Http404("Nonexistent user.")
    user_profile = get_object_or_404(UserProfile, user=user)
    if not user_profile:
        raise Http404("Nonexistent user.")
    context = {'user':user, 'user_profile':user_profile, 'now_user':request.user}

    if username == request.user.username:
        followings = user_profile.follows.all()
        context['follows'] = followings
    else:
        now_user_profile = get_object_or_404(UserProfile, user=request.user)
        if not now_user_profile:
            raise Http404("Nonexistent user.")
        now_user_follows = now_user_profile.follows.all()
        if user in now_user_follows:
            context['if_follow'] = "Unfollow"
        else:
            context['if_follow'] = "Follow"

    return render(request, 'blog/profile.html', context)

@login_required
@ensure_csrf_cookie
def follow(request, username):
    context = {}
    user = get_object_or_404(User, username=username)
    if not user:
        raise Http404("Nonexistent user.")
    user_profile = get_object_or_404(UserProfile, user=user)
    if not user_profile:
        raise Http404("Nonexistent user.")
    context = {'user':user, 'user_profile':user_profile, 'now_user':request.user}

    if username == request.user.username:
        followings = user_profile.follows.all()
        context['follows'] = followings
    else:
        now_user_profile = get_object_or_404(UserProfile, user=request.user)
        if not now_user_profile:
            raise Http404("Nonexistent user.")
        now_user_follows = now_user_profile.follows.all()
        if user in now_user_follows:
            now_user_profile.follows.remove(user)
            context['if_follow'] = "Follow"
        else:
            now_user_profile.follows.add(user)
            context['if_follow'] = "Unfollow"

    return render(request, 'blog/profile.html', context)

@login_required
@transaction.atomic
@ensure_csrf_cookie
def edit_profile(request):
    context = {}
    # errors = []
    user = request.user
    user_profile = get_object_or_404(UserProfile, user=user)
    if not user_profile:
        raise Http404("Nonexistent user.")

    # context['errors'] = errors
    context['user'] = user
    context['user_profile'] = user_profile

    context['picture-src'] = ''

    initial_user = {
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'username': user.username,
                    'email': user.email,
                    'Bio': user_profile.bio,
                }

    if request.method == 'GET':
        context['form'] = UserProfileForm(initial=initial_user)
        return render(request, 'blog/edit_profile.html', context)

    form = UserProfileForm(request.POST, request.FILES, initial=initial_user)
    context['form'] = form

    if not form.is_valid():
        return render(request, 'blog/edit_profile.html', context)

    form.save(user_instance=request.user, user_profile_instance=user_profile)
    update_session_auth_hash(request, user)

    return redirect(reverse('profile', kwargs={'username':user.username}))


@login_required
@ensure_csrf_cookie
def get_photo(request, id):
    user_profile = get_object_or_404(UserProfile, id=id)

    # Probably don't need this check as form validation requires a picture be uploaded.
    if not user_profile.picture:
        raise Http404

    content_type = guess_type(user_profile.picture.name)
    return HttpResponse(user_profile.picture, content_type=content_type)