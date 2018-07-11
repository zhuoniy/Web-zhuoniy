# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models
from django.contrib.auth.models import User
from datetime import datetime


class UserData(models.Model):
    def __unicode__(self):
        return self.user.username

    def __str__(self):
        return self.__unicode__()

    user = models.ForeignKey(User, default=None, on_delete=models.CASCADE)
    image = models.ImageField(upload_to="image", default="image/default.jpeg")
    creation_time = models.DateTimeField(default=datetime.now, blank=True)
    bio = models.CharField(max_length=430, blank=True)
    # this to record which level the players is in
    levels = models.IntegerField(default=0, blank=True)
    players = models.ManyToManyField(User, related_name="palyed_with")

    def set_levels(self, level_num):
        self.levels = level_num


class Player(models.Model):

    def __unicode__(self):
        return self.user.username

    def __str__(self):
        return self.__unicode__()
    def __repr__(self):
        return self.__unicode__()

    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    mission_id = models.IntegerField(default=-1)
    point_x = models.FloatField(default=0.0, blank=True)
    point_y = models.FloatField(default=0.0, blank=True)

    def set_pos(self, pos_x, pos_y):
        self.point_x = pos_x
        self.point_y = pos_y

class Item(models.Model):
    def __unicode__(self):
        return  str(self.item_id) + " " + self.description

    def __str__(self):
        return self.__unicode__()

    item_id = models.IntegerField()
    content = models.ImageField(default=None, blank=True)
    status = models.IntegerField(default=0, blank=True)     # 0 means not acquired 1 means acquired
    description = models.TextField(max_length=100, blank=True)
    point_x = models.FloatField(default=0.0, blank=True)
    point_y = models.FloatField(default=0.0, blank=True)


class Mission(models.Model):
    def __unicode__(self):
        return str(self.gameid)

    def __str__(self):
        return self.__unicode__()

    gameid = models.IntegerField(default=0, blank=True)
    items = models.ManyToManyField(Item, related_name="items", default=None)
    players = models.ManyToManyField(Player, related_name="players", default=None)
    status = models.IntegerField(default=0, blank=True)  # 0 means not start 1 means playing

    def add_player(self, player):
        self.players.add(player)

    def get_player(self, username):
        return self.players.filter(user__username=username)

    def remove_player(self, username):
        player = self.players.filter(user__username=username)
        if player.count() == 1:
            self.players.remove(player)

    def add_item(self, item):
        self.items.add(item)

    def get_item(self, item_id):
        self.items.filter(item_id=item_id)

    def remove_item(self, item_id):
        item = self.items.filter(item_id=item_id)
        if item:
            self.items.remove(item)

    def change_status(self):
        if self.status == 0:
            self.status = 1

