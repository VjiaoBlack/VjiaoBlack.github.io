var fade;
var offset;

var l_fade;
var l_offset;

var FPS = 60;

var links = new Array(4);
var hover = new Array(4);
var exit = new Array(4)

var link_small_size = 1.3;
var link_large_size = 1.5;
var padding_small = 2;
var padding_large = 1.6;
var padding;
var size;

function grow (element) {
    if (size < link_large_size) {
        size += 0.02;
    } else {
        clearInterval(hover[element.id]);
        size = link_large_size;
    }
    element.style.fontSize = size.toString().concat("em");

    if (padding > padding_large) {
        padding -= 0.04;
    } else {
        clearInterval(hover[element.id]);
        padding = padding_large;
    }
    console.log(padding);
    console.log("size ".concat(size.toString()));
    element.style.paddingLeft = padding.toString().concat("em");
    element.style.paddingRight = padding.toString().concat("em");
}

function shrink (element) {
    if (size > link_small_size) {
        size -= 0.02;
    } else {
        clearInterval(exit[element.id]);
        size = link_small_size;
    }
    element.style.fontSize = size.toString().concat("em");

    if (padding < padding_small) {
        padding += 0.04;
    } else {
        clearInterval(exit[element.id]);
        padding = padding_small;
    }

    console.log(padding);
    console.log("size ".concat(size.toString()));
    element.style.paddingLeft = padding.toString().concat("em");
    element.style.paddingRight = padding.toString().concat("em");

}

function l_hover(event) {
    size = link_small_size;
    clearInterval(exit[event.target.id]);
    hover[event.target.id] = setInterval(function(){grow(event.target)}, 1000/FPS); // problem with the function within setInterval.
}

function l_exit(event) {
    size = link_large_size;
    clearInterval(hover[event.target.id]);
    exit[event.target.id] = setInterval(function(){shrink(event.target)}, 1000/FPS);
    intervalId = setInterval(function(){fog_loop()}, 1000/FPS_fog);
}


function fade_in_name() {
    document.getElementById("name").color = "rgba(51,105,147,0)";
    document.getElementById("name").innerHTML="Victor Jiao";
}

function fade_in_links() {
    links = document.getElementsByTagName("a");
    var link_names = ["About", "Projects", "Blog", "Contact"];
    for (var i = 0; i < links.length; i++) {
        links[i].style.color = "rgba(35,73,99,0)";
        links[i].innerHTML = link_names[i];
        links[i].id = i.toString();
        links[i].onmouseover = l_hover;
        links[i].onmouseout = l_exit;
    }
}

function layout_init() {
    fade = 0;
    offset = 60;
    l_fade = 0;
    l_offset = 12;
    fade_in_name();
    fade_in_links();
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
    if (fade >= 1 && offset <= 0) {
        if (l_fade < 1) {
            l_fade += 0.04;
            var links = document.getElementsByTagName("a");
            for (var i = 0; i < links.length; i++) {
                links[i].style.color = "rgba(35,73,99,".concat(l_fade.toString()).concat(")");
            }
            if (l_fade > .97) {
                l_fade = 1;
            }
        }
        if (l_offset > 0) {
            l_offset -= (1- l_fade) ;
            var link_holder = document.getElementById("top");
            link_holder.style.paddingTop = l_offset.toString().concat("px");
            if (l_offset < .5) {
                l_offset = 0;
            }
        }
    }
}
