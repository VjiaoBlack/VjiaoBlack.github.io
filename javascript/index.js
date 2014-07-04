var fade;
var offset;

function fade_in_name() {
    document.getElementById("name").color = "rgba(51,105,147,0)";
    document.getElementById("name").innerHTML="Victor Jiao";
}

function layout_init() {
    fade = 0;
    offset = 60;
    fade_in_name();
}

function layout_update() {
    if (fade < 1) {
        fade += 0.04;
        document.getElementById("name").style.color = "rgba(51,105,147,".concat(fade.toString()).concat(")");
        if (fade > .97) {
            fade = 1;
        }
    }
    if (offset > 0) {
        offset -= (1- fade) * 5;
        document.getElementById("name").style.paddingTop = offset.toString().concat("px");
        if (offset < .5) {
            offset = 0;
        }
    }
    console.log(offset);
}
