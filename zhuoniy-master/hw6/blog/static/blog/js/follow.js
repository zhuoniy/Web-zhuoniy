//sends a new request to pk the posts list
//2
function f_getList() {
    $.ajax({
        url: "/blog/f_get_post",
        dataType: "json",
        success: function(response) {
            updateList(response);
        },
        error: function(XHR, textStatus, errorThrown) {
            console.log('error' + errorThrown);
        }
    });
    console.log("get list!");
}


function updateList(posts) {
    console.log("update!");
    //removes the old list items
    $("#postlist").empty();
  //  var username = $("#loginusername");
  //  var profile = $("#profilefollows");
  //  console.log(profile.val());
    var id = 1;
    //add each new list items to the list
    $(posts).each(function() {
        console.log(this.fields.user);
        $("#postlist").append(
"<div class='panel panel-default'>" +
      "<div class='panel-heading'>" +
         "<a href='/blog/profile/"+ this.fields.user +"'>" + this.fields.first_name + ":</a>" 
         + this.fields.date_created +
      "</div>" +
      "<div class='panel-body'> " +
        "<h5>" + this.fields.text + "</h5>" +
    "</div>" +


    "<div class='panel-footer'><input type='hidden' name='postid' id='post"+id+"' value='"+this.pk+"'/>" +
    "<div class='row'>" +
        "<div class='col-md-10'>"+
            "<input type='text' class='form-control' placeholder='Write a comment...' name='comment' id='comment"+id+"'/>"+
        "</div>"+
        "<div class='col-md-2'>"+
            "<button class='btn btn-default' onclick='f_addComment("+id+")'>Add comment</button>"+
        "</div>"+
    "</div>"+
    "</div>"+

    "<div class='panel-body'> " +
    "<h5>Comments:</h5> " +
       "<div id='commentlist"+id+"'> "+
      

      "</div>"+
    "</div> "
        );
            $("#postlist input").focus(function(){
                UpdateSet=window.clearInterval(UpdateSet);
            });
            $("#postlist input").blur(function(){
                UpdateSet=window.clearInterval(UpdateSet);
                UpdateSet=window.setInterval(f_getList, 5000);
            });

        $(this.comments).each(function() {
            console.log("comments!");
            $("#commentlist"+id).append(
                "<h5><a href='/blog/profile/"+ this.fields.user +"'>" + this.fields.first_name + "</a> (" +
                this.fields.date_created + "):  " +
                this.fields.text+"</h5>"
            );

        });
        id = id + 1;
    });
}

//
function sanitize(s) {
    return s.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
}

//
function displayError(message) {
    $("#error").html(message);
}

//
function getCSRFToken() {
    var cookies = document.cookie.split(";");


    for (var i = 0; i < cookies.length; i++) {
        if (cookies[i].trim().startsWith("csrftoken=")) {
            console.log("getCSRFToken="+cookies);
            return cookies[i].substring("csrftoken=".length+1, cookies[i].length);
        }
    }

    return "unknown";
}


function f_addComment(id) {
    console.log(id);
    var commentElement = $("#comment"+id);
    var postId = $("#post"+id);
    // var postId = $('[id="'+post+'"]');
    var commentValue = commentElement.val();
    console.log(commentValue)
    console.log(postId.val())
    commentElement.val('');
    displayError('');

    $.ajax({
        url: "/blog/f_add_comment",
        type: "POST",
        data: "comment="+commentValue+"&postid="+postId.val()+"&csrfmiddlewaretoken="+getCSRFToken(),
        dataType: "json",
        success: function(response) {
            if (Array.isArray(response)) {
                updateList(response);
            } else {
                displayError(response.error);
            }
        }
    });
}



window.onload = f_getList;

window.UpdateSet=setInterval(f_getList, 5000);