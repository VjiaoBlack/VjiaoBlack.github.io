var canvas_c = new Array(3); // r, g, b
var gray_c = new Array(3);
var name_c = new Array(3);
var links_c = new Array(3);
var middle_c = new Array(3);

var minutes;
var hours;


window.onload = function setup() {

    color_init();


    setup_fog();
    layout_init();
}

function color_init() {
    var d = new Date();
    hours = d.getHours;
    m = d.getMinutes;




    // canvas_c = [8,16,45];
    canvas_c = [220,220,255];
    // gray_c = [107,115,140];
    gray_c = [0,0,0];
    name_c = [51,105,147];
    links_c = [35,73,99];
    // middle_c = [20,32,72];
    middle_c = [150,162,222];
}

function c_to_rgb(c) {
    return "rgb(".concat(c[0].toString().concat(",").concat(c[1].toString().concat(",".concat(c[2].toString().concat(")")))));
}

function c_to_rgba(c,a) {
    return "rgba(".concat(c[0].toString().concat(",").concat(c[1].toString().concat(",".concat(c[2].toString().concat(",".concat(a.toString().concat(")")))))));
}
