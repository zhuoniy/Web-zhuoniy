# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models

# Create your models here.
from django.utils import timezone
from datetime import datetime
from django.contrib.auth.models import User

class UserProfile(models.Model):
	user = models.OneToOneField(User)
	bio = models.TextField(max_length=20000, blank=True)
	picture = models.ImageField(upload_to='images', blank=True)
	follows = models.ManyToManyField(User, related_name='followees', symmetrical=False)
	def __unicode__(self):
		return self.user


class Post(models.Model):
	user = models.ForeignKey(User)
	text = models.TextField(max_length=20000)
	date_created = models.DateTimeField(auto_now_add=True)

	def __unicode__(self):
		return self.text
