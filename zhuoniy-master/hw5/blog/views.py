# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.shortcuts import render
from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse, Http404

# Create your views here.

# Helper function to guess a MIME type from a file name
from mimetypes import guess_type

from django.shortcuts import render, redirect
from django.core.urlresolvers import reverse
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib.auth import login, authenticate

from django.contrib.auth import update_session_auth_hash
from django.utils import timezone

from blog.forms import RegistrationForm


from blog.models import *
from blog.forms import *



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
    new_user.save()

    # Logs in the new user and redirects to his/her todo list
    new_user = authenticate(username=form.cleaned_data['username'],
                            password=form.cleaned_data['password1'])
    login(request, new_user)

    user_profile = UserProfile(user=new_user)
    user_profile.save()

    return redirect(reverse('home'))

@login_required
def globals(request):
    context = {}
    context['user'] = request.user
    context['posts'] = Post.objects.order_by('-date_created')

    return render(request, 'blog/global.html', context)

@login_required
def global_post(request):
    errors = []

    if 'post' not in request.POST or not request.POST['post']:
        errors.append('You must post something...')
    else:
        new_post = Post(user=request.user, text=request.POST['post'])
        new_post.save()

    posts = Post.objects.order_by('-date_created')
    context = {'posts':posts, 'errors':errors}
    return render(request, 'blog/global.html', context)

@login_required
def follower(request):
    context = {}
    context['user'] = request.user
    user_profile = UserProfile.objects.get(user=request.user)
    following = user_profile.follows.all()
    context['posts'] = Post.objects.filter(user__in=following).order_by('-date_created')

    return render(request, 'blog/follower.html', context)

@login_required
def follow_post(request):
    errors = []

    if 'post' not in request.POST or not request.POST['post']:
        errors.append('You must post something...')
    else:
        new_post = Post(user=request.user, text=request.POST['post'])
        new_post.save()

    context = {'user':request.user, 'errors':errors}
    user_profile = UserProfile.objects.get(user=request.user)
    following = user_profile.follows.all()
    context['posts'] = Post.objects.filter(user__in=following).order_by('-date_created')

    posts = Post.objects.order_by('-date_created')
    return render(request, 'blog/follower.html', context)

# the 'user' returned by profile is the user of the page host
# but the 'user' returned by other functions is the loggin user
@login_required
def profile(request, username):
    context = {}
    errors = []
    context['errors'] = errors

    if len(User.objects.filter(username=username)) <= 0:
        errors.append('User does not exist.')

    user = User.objects.get(username=username)
    user_profile = UserProfile.objects.get(user=user)
    context = {'user':user, 'user_profile':user_profile, 'now_user':request.user}

    if username == request.user.username:
        followings = user_profile.follows.all()
        context['follows'] = followings
    else:
        now_user_profile = UserProfile.objects.get(user=request.user)
        now_user_follows = now_user_profile.follows.all()
        if user in now_user_follows:
            context['if_follow'] = "Unfollow"
        else:
            context['if_follow'] = "Follow"

    return render(request, 'blog/profile.html', context)

@login_required
def follow(request, username):
    context = {}
    user = User.objects.get(username=username)
    user_profile = UserProfile.objects.get(user=user)
    context = {'user':user, 'user_profile':user_profile, 'now_user':request.user}

    if username == request.user.username:
        followings = user_profile.follows.all()
        context['follows'] = followings
    else:
        now_user_profile = UserProfile.objects.get(user=request.user)
        now_user_follows = now_user_profile.follows.all()
        if user in now_user_follows:
            now_user_profile.follows.remove(user)
            context['if_follow'] = "Follow"
        else:
            now_user_profile.follows.add(user)
            context['if_follow'] = "Unfollow"

    return render(request, 'blog/profile.html', context)

@login_required
def edit_profile(request):
    context = {}
    # errors = []
    user = request.user
    user_profile = UserProfile.objects.get(user=user)

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
def get_photo(request, id):
    user_profile = get_object_or_404(UserProfile, id=id)

    # Probably don't need this check as form validation requires a picture be uploaded.
    if not user_profile.picture:
        raise Http404

    content_type = guess_type(user_profile.picture.name)
    return HttpResponse(user_profile.picture, content_type=content_type)