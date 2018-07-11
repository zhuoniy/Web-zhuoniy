$(document).ready(function(){
    // get the number of the the
    var cur_level = $("#current_l").val();
    // set the to disabled
    for (var i = parseInt(cur_level) + 1; i <= 9; i++) {
        var temp = "#level_" + i.toString();
        $(temp).css("background", "#DCDCDC");
        $(temp).attr("disabled", "true");
    }

});

