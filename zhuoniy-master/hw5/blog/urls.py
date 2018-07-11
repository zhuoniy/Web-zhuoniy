from django.conf.urls import include, url
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    url(r'^$', views.globals, name='home'),
    url(r'^global$', views.globals, name='global'),
    url(r'^follower$', views.follower, name='follower'),
    url(r'^profile/(?P<username>[-\w]+)/$', views.profile, name='profile'),
    url(r'^register$', views.register, name='register'),
    # Route for built-in authentication with our own custom login page
    url(r'^login$', auth_views.login, {'template_name':'blog/login.html'}, name='login'),
    # Route to logout a user and send them back to the login page
    url(r'^logout$', auth_views.logout_then_login, name='logout'),
    url(r'^global_post$', views.global_post, name='global_post'),
    url(r'^follow_post$', views.follow_post, name='follow_post'),    
    url(r'^picture/(?P<id>\d+)$', views.get_photo, name='picture'),
    url(r'^follow/(?P<username>[-\w]+)/$', views.follow, name='follow'),
    url(r'^edit_profile$', views.edit_profile, name='edit_profile'),
]

