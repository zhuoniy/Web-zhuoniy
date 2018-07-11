# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models

# Create your models here.
from django.utils import timezone
from datetime import datetime
from django.contrib.auth.models import User

class UserProfile(models.Model):
	user = models.ForeignKey(User, default=None, on_delete=models.DO_NOTHING, to_field='username')
	bio = models.CharField(max_length=2000, blank=True)
	picture = models.ImageField(upload_to='images', blank=True)
	follows = models.ManyToManyField(User, related_name='followees', symmetrical=False)
	def __unicode__(self):
		return self.user


class Post(models.Model):
	user = models.ForeignKey(User, default=None, on_delete=models.DO_NOTHING, to_field='username')
	first_name = models.CharField(max_length=20, blank=True)
	text = models.CharField(max_length=2000, blank=True)
	date_created = models.DateTimeField(auto_now_add=True)

	def __unicode__(self):
		return self.text

class Comment(models.Model):
	user = models.ForeignKey(User, default=None, on_delete=models.DO_NOTHING, to_field='username')
	first_name = models.CharField(max_length=20, blank=True)
	text = models.CharField(max_length=100, blank=True)
	date_created = models.DateTimeField(auto_now_add=True)
	post = models.ForeignKey(Post, default=None, on_delete=models.CASCADE)

	def __unicode__(self):
		return self.text
