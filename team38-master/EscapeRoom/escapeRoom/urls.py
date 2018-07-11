from django.conf.urls import url, include
from django.contrib import admin
import escapeRoom.views
from django.contrib.auth import views as auth_views

urlpatterns = [
    url(r"^register$", escapeRoom.views.register, name="register"),
    url(r"^login$", escapeRoom.views.login, name="login"),
    url(r"^logout$", auth_views.LogoutView.as_view(), name="logout"),
    url(r"^main_page$", escapeRoom.views.main_page, name="main_page"),
    url(r'^confirm-email/(?P<username>[a-zA-Z0-9]+)/(?P<token>[a-z0-9\-]+)$',
        escapeRoom.views.confirm_registration, name='confirm-email'),
    url(r"^change-password$", escapeRoom.views.change_password, name="change-password"),
    url(r"^profile/edit$", escapeRoom.views.edit_profile, name="user-profile-edit"),
    url(r"^profile/(?P<user_id>[0-9]+)$", escapeRoom.views.profile, name="user-profile"),
    url(r"^profile/image/(?P<user_id>[0-9]+)$", escapeRoom.views.get_image, name="get-image"),
    url(r"^create_join_game$", escapeRoom.views.join_game, name="create_join_game"),
    url("^room/userid=(?P<userid>[0-9]+)&roomid=(?P<roomid>[0-9]+)$", escapeRoom.views.room, name="room"),
    url(r"^single/(?P<level>[0-9])$", escapeRoom.views.single, name="single"),
]