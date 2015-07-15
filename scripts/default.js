$(document).ready(function(){

    $('a').click(function(e) {
        var url = $(this).attr("href");
        $("html").fadeOut("fast",function() { window.location = url; });
        e.preventDefault();
    });

    $("html").hide();
    $("html").fadeIn("fast");


    $("a.click")

    $(window).bind('unload', function(){
    });
});

