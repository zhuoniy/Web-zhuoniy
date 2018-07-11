var tid = 0;
var imgCorrect = [0,0,0,0,0,0,0,0,0];
var puzzleArray = document.getElementsByClassName("puzzleBox");
document.getElementById("startButton").addEventListener("click",start); 

// start() randomly generate 9 pictures and start counting
function start() {
  console.log("EEE");
  document.getElementById("startButton").disabled = true;
  var sort = [1,2,3,4,5,6,7,8,9];
  var randomSort = [];
  while (sort.length > 0) {
    var ra = Math.floor(Math.random()*sort.length);
    randomSort.push(sort.splice(Math.random()*sort.length,1)[0]);
  };

  for(var i = 0 ; i < 9 ; i++) {
    var img = document.createElement("img");
    img.src = imgurl +randomSort[i]+ ".jpg";
    img.id = randomSort[i] + "_img";
    img.draggable = "true";
    img.addEventListener("dragstart",drag);
    var div = document.createElement('div');
    div.className = 'image';
    div.appendChild(img);
    div.addEventListener("dragover",allowDrop);
    div.addEventListener("drop",drop);
    document.getElementById('img-section').appendChild(div);
    puzzleArray[i].addEventListener("drop",drop);
    puzzleArray[i].addEventListener("dragover",allowDrop);
    puzzleArray[i].addEventListener("dragstart",dropChange);
  };

  tid = setInterval(function() {
    var newtime = (parseFloat(document.getElementById('timeCount').innerHTML)+0.1).toFixed(1);
    document.getElementById('timeCount').innerHTML = newtime;
    var stopSum = 0;
    for (var j = 0; j < 9; j++) {
      stopSum += imgCorrect[j];
    };
    if (stopSum == 9) {
      clearInterval(tid);
      var gameTime = Number(document.getElementById('timeCount').innerHTML);
      var content = document.getElementById("puzzle_container");
      var bb = document.createElement("a");
      bb.className = "modal-close btn btn-primary";
      bb.innerHTML = 'Exit';
      bb.onclick = getItem(2);
      content.appendChild(bb);
      bb.id ="col3";
      $("#clo3").click(function(){
          $("#myModal1").hide();
      });
      return;
    };
  }, 100);
};

function drag (e) {
  e.dataTransfer.setData("text",e.target.id);
}

function allowDrop(e){
  e.preventDefault();
}

function drop(e){
  e.preventDefault();
  var data = e.dataTransfer.getData("text");
  if (e.target.tagName == "DIV") {
    e.target.appendChild(document.getElementById(data));
    if (parseInt(e.target.id) == parseInt(data)) {
      imgCorrect[parseInt(data)-1] = 1;
    };
  };
}

function dropChange(e){
  var data = e.dataTransfer.getData("text");
  imgCorrect[parseInt(data)-1] = 0;
}


