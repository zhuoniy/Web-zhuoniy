from django import forms
from django.utils.translation import gettext_lazy as _

from django.contrib.auth.models import User
from blog.models import *
MAX_UPLOAD_SIZE = 2500000

class RegistrationForm(forms.Form):
    first_name = forms.CharField(max_length=20)
    last_name  = forms.CharField(max_length=20)
    email      = forms.CharField(max_length=50,
                                 widget = forms.EmailInput())
    username   = forms.CharField(max_length = 20)
    password1  = forms.CharField(max_length = 200, 
                                 label='Password', 
                                 widget = forms.PasswordInput())
    password2  = forms.CharField(max_length = 200, 
                                 label='Confirm password',  
                                 widget = forms.PasswordInput())


    # Customizes form validation for properties that apply to more
    # than one field.  Overrides the forms.Form.clean function.
    def clean(self):
        # Calls our parent (forms.Form) .clean function, gets a dictionary
        # of cleaned data as a result
        cleaned_data = super(RegistrationForm, self).clean()

        # Confirms that the two password fields match
        password1 = cleaned_data.get('password1')
        password2 = cleaned_data.get('password2')
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Passwords did not match.")

        # We must return the cleaned data we got from our parent.
        return cleaned_data


    # Customizes form validation for the username field.
    def clean_username(self):
        # Confirms that the username is not already present in the
        # User model database.
        username = self.cleaned_data.get('username')
        if User.objects.filter(username__exact=username):
            raise forms.ValidationError("Username is already taken.")

        # We must return the cleaned data we got from the cleaned_data
        # dictionary
        return username

class PostForm(forms.ModelForm):
    class Meta:
        model = Post
        fields = ( 'text',)
        labels = {
            'text': _('Creat a new Post'),
        }
        widgets = {
            'text': forms.Textarea(attrs={'placeholder': 'Write something...', 'class': 'form-control'})
        }        
        help_texts = {
            'text': _('Post successfully! Write a new post...'),
        }
        error_messages = {
            'text': {
                'required': 'You must write something in your post!'
            }
        }
    
    def clean(self):
        cleaned_data = super(PostForm, self).clean()
        return cleaned_data




class UserProfileForm(forms.Form):
    picture = forms.FileField(label='Profile Picture', required=False)
    bio = forms.CharField(max_length=200, label='Bio', required=False)


    def clean(self):
        cleaned_data = super(UserProfileForm, self).clean()
        return cleaned_data

    def save(self, user_instance, user_profile_instance):
        if self.cleaned_data.get('bio'):
            user_profile_instance.bio = self.cleaned_data.get('bio')
        
        if self.cleaned_data.get('picture'):
            user_profile_instance.picture = self.cleaned_data.get('picture')

        user_instance.save()
        user_profile_instance.save()
        
        return user_instance