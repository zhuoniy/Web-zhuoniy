var newvalue=0;
var prevalue=0;
var operator=0;

function ClickNum(num){
	if(operator==4){
		prevalue=0;
		operator=0;
	}
	newvalue=newvalue*10+num;
	document.getElementById("screen").innerHTML=newvalue;
}

function ClickOp(op){
	switch(operator){
		case 0:
			prevalue=newvalue+prevalue;
			break;
		case 1:
			prevalue=prevalue-newvalue;
			break;
		case 2:
			prevalue=prevalue*newvalue;
			break;
		case 3:
			if(newvalue==0){
				prevalue=0;
				alert("ERROR!" + "\n" + "Divisor cannot be zero." + "\n" + "Reset your calculator.")
			}
			else{
				prevalue=Math.round(prevalue/newvalue);
			}
			break;
	}	
	document.getElementById("screen").innerHTML=prevalue;

	operator=op;
	newvalue=0;
}

