var fade;
var offset;

var l_fade;
var l_offset;

var p_fade;
var p_offset;

var FPS = 60;

var links = new Array(4);
var hover = new Array(4);
var exit = new Array(4)

var link_small_size = 1.3;
var link_large_size = 1.5;
var sizes = new Array(4);

var size;

function grow (element) {
    if (sizes[element.id] < link_large_size) {
        sizes[element.id] += 0.02;
        console.log("what');");
    } else {
        clearInterval(hover[element.id]);
        sizes[element.id] = link_large_size;
    }
    element.style.fontSize = sizes[element.id].toString().concat("em");
}

function shrink (element) {
    if (sizes[element.id] > link_small_size) {
        sizes[element.id] -= 0.02;
    } else {
        clearInterval(exit[element.id]);
        sizes[element.id] = link_small_size;
    }
    element.style.fontSize = sizes[element.id].toString().concat("em");
}

function l_hover(event) {
    sizes[event.target.id] = link_small_size;
    clearInterval(exit[event.target.id]);
    hover[event.target.id] = setInterval(function(){grow(event.target)}, 1000/FPS);
}

function l_exit(event) {
    size = link_large_size;
    clearInterval(hover[event.target.id]);
    exit[event.target.id] = setInterval(function(){shrink(event.target)}, 1000/FPS);

}

function fade_in_name() {
    document.getElementById("name").color = c_to_rgba(name_c,0);
    document.getElementById("name").innerHTML = "Victor Jiao";
}

function fade_in_links() {
    links = document.getElementsByTagName("a");
    var link_names = ["About", "Projects", "Blog", "Contact"];
    for (var i = 0; i < links.length; i++) {
        links[i].style.color = c_to_rgba(links_c,0);
        links[i].innerHTML = link_names[i];
        links[i].id = i.toString();
        links[i].onmouseover = l_hover;
        links[i].onmouseout = l_exit;
    }
}


function fade_in_text() {
    document.getElementById("middle").color= c_to_rgba(middle_c,0);
}

function layout_init() {
    fade = 0;
    offset = 60;
    l_fade = 0;
    l_offset = 12;
    p_offset = 32;
    p_fade = 0;
    fade_in_name();
    fade_in_links();
    fade_in_text();
}

function layout_update() {

    if (fade < 1) {
        fade += 0.04;
        document.getElementById("name").style.color = c_to_rgba(name_c,fade);//"rgba(51,105,147,".concat(fade.toString()).concat(")");
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
                links[i].style.color = c_to_rgba(links_c,l_fade);
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

    if (l_fade >= 1) {
        if (p_fade < .65) {
            p_fade += 0.026;
            document.getElementById("middle").style.backgroundColor = c_to_rgba(middle_c,p_fade);
            var ps = document.getElementsByTagName("p");
            for (var i = 0; i < ps.length; i++) {
                ps[i].style.color = c_to_rgba(gray_c,p_fade);
            }
            if (p_fade > 0.63) {
                p_fade = .65;
            }
        }
        if (p_offset > 0) {
            p_offset -= 1-p_fade * (4/2.6);
            document.getElementById("middle").style.marginTop = (250+p_offset).toString().concat("px");
            if (p_offset < 0.5) {
                p_offset = 0;
            }
        }
    }
}
