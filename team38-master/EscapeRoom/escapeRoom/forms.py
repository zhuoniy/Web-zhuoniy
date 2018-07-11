from django import forms
from escapeRoom.models import *


class LoginForm(forms.Form):
    username = forms.CharField(max_length=50, widget=forms.TextInput(attrs= {'class': "form-control",
                                                                                 'placeholder': u"User Name"}))
    password = forms.CharField(max_length=50, widget=forms.PasswordInput(attrs= {'class': "form-control",
                                                                                     'placeholder': u"Password"}))


class RegisterForm(forms.Form):
    username = forms.CharField(max_length=50, widget=forms.TextInput(attrs={'class': "form-control",
                                                                            'placeholder': u"User Name"}))
    first_name = forms.CharField(max_length=50, widget=forms.TextInput(attrs={'class': "form-control",
                                                                              'placeholder': u"First Name"}))
    last_name = forms.CharField(max_length=50, widget=forms.TextInput(attrs={'class': "form-control",
                                                                             'placeholder': u"Last Name"}))
    email = forms.EmailField(widget=forms.TextInput(attrs={'class': "form-control",
                                                           'placeholder': u"Email Address"}))
    password = forms.CharField(max_length=50, widget=forms.PasswordInput(attrs={'class': "form-control",
                                                                                'placeholder': u"Password"}))

    password_confirm = forms.CharField(max_length=50, widget=forms.PasswordInput(attrs={'class': "form-control",
                                                                                        'placeholder': u"Repeat Password"}))

    def clean_username(self):
        username = self.cleaned_data.get("username")
        users = User.objects.filter(username=username).count()
        if users:
            raise forms.ValidationError("Username has already been token.")
        else:
            return username

    def clean_password_confirm(self):
        password = self.cleaned_data.get("password")
        password_confirm = self.cleaned_data.get("password_confirm")
        if password != password_confirm:
            raise forms.ValidationError("Passwords did not match.")
        else:
            return password_confirm

    def clean_email(self):
        email = self.cleaned_data.get("email")
        email_num = User.objects.filter(email=email).count()
        if email_num:
            raise forms.ValidationError("This email has already been registered")
        else:
            return email


class PasswordChangeForm(forms.Form):
    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop("user")
        super(PasswordChangeForm, self).__init__(*args, **kwargs)

    old_password = forms.CharField(max_length=100, widget=forms.PasswordInput(attrs={'class': "form-control",
                                                                            'placeholder': u"Old Password"}))
    new_password = forms.CharField(max_length=100, widget=forms.PasswordInput(attrs={'class': "form-control",
                                                                            'placeholder': u"New Password"}))
    new_password_confirm = forms.CharField(max_length=100, widget=forms.PasswordInput(attrs={'class': "form-control",
                                                                            'placeholder': u"Repeat New Password"}))

    def clean_old_password(self):
        old_password = self.cleaned_data.get("old_password")
        if self.user.check_password(old_password):
            return old_password

        else:
            raise forms.ValidationError("Old Password is not correct!")

    def clean_new_password_confirm(self):
        new_password = self.cleaned_data.get("new_password")
        new_password_confirm = self.cleaned_data.get("new_password_confirm")
        if new_password != new_password_confirm:
            raise forms.ValidationError("New Passwords are not the same!")
        else:
            return new_password_confirm


class ProfileEditFormNames(forms.ModelForm):
    class Meta:
        model = User
        fields = ["first_name", "last_name"]
        widgets = {
            'first_name': forms.TextInput(attrs={'class': "form-control",'placeholder': u"First Name"}),
            'last_name': forms.TextInput(attrs={'class': "form-control", 'placeholder': u"Last Name"})
        }

class ProfileEditFormOtherProfile(forms.ModelForm):
    class Meta:
        model = UserData
        fields = ["bio", "image"]
        widgets = {
            'bio': forms.Textarea(attrs={'cols': 30, 'rows': 6})
        }