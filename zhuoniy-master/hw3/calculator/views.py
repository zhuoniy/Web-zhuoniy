# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.shortcuts import render
from django.http import HttpResponse
from django.contrib import messages

# Create your views here.

newvalue=0
prevalue=0
operator=0

def home(request):
    global operator
    global prevalue
    global newvalue
    newvalue=0
    prevalue=0
    operator=0

    return render(request, 'calculator/calculator.html', {})


def cal_click(request):
    context={}

    global operator
    global prevalue
    global newvalue

    if 'num' in request.GET:
        num=int(request.GET['num'])
        if (operator==4):
            prevalue=0
            operator=0
        newvalue=newvalue*10+num
        context['cal_result']=newvalue

    else:
        if operator==0:
            prevalue=prevalue+newvalue
        elif operator==1:
            prevalue=prevalue-newvalue
        elif operator==2: 
            prevalue=prevalue*newvalue
        elif operator==3:
            if newvalue==0:
                prevalue=0;
                messages.error(request, 'ERROR! Divisor cannot be zero. Reset your calculator.')
            else:
                prevalue=prevalue/newvalue

        if 'plus' in request.GET:
            op=0
        elif 'minus' in request.GET:
            op=1
        elif 'times' in request.GET:
            op=2
        elif 'divide' in request.GET:
            op=3
        else:
            op=4

        context['cal_result']=prevalue
        operator=op
        newvalue=0

    return render(request, 'calculator/calculator.html', context)
