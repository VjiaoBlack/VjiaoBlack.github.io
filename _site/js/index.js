var fadeToDoc;
var opacity;
document.getElementById("leader").onmouseover = function() {
    document.getElementById("leader").onmouseover = function() {};
    opacity = 1;
    var fadeToDoc = setInterval(function() {
        document.getElementsByTagName("body")[0].style.opacity = opacity;
        opacity -= 0.04;
        if (opacity < 0) {
            opacity = 0;
            window.location = "/home.html";
            clearInterval(fadeToDoc);
        }
    }, 100/6);
}
