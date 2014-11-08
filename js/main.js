var fadeToDoc;
var opacity;
window.onload = function() {
    opacity = 0;
    var fadeToDoc = setInterval(function() {

        opacity += 0.06;
        if (opacity > 1) {
        document.getElementsByTagName("body")[0].style.opacity = opacity;
            opacity = 1;
            clearInterval(fadeToDoc);
        }
        document.getElementsByTagName("body")[0].style.opacity = opacity;

    }, 100/6);
}
