var canvas;
var ctx;
var fogx = new Array();
var fogy = new Array();
var xvel = new Array();
var yvel = new Array();
var num_particles = 1000;
var fade_in;

var intervalId;
var FPS = 20;



window.onload = function setup() {
    canvas = document.getElementById('fog');
    fade_in = 0;
    for (var i = 0; i < num_particles; i++) {
        console.log(screen.width);
        fogx[i] = Math.round(Math.random() * screen.width);
        fogy[i] = Math.round(Math.random() * screen.height);

        vel = Math.random() * 1 + .2;
        deg = Math.random() * 360;

        xvel[i] = vel * Math.cos(deg);
        yvel[i] = vel * Math.sin(deg);
    }
    if (canvas.getContext) {
        ctx = canvas.getContext('2d');
        // draw();
    }
    intervalId = setInterval(game_loop, 1000/FPS);

}

function game_loop() {
    update();
    draw();
}

function draw() {
    document.getElementById("fog").setAttribute("height",screen.height.toString());
    document.getElementById("fog").setAttribute("width",screen.width.toString());

    ctx.fillStyle="#01040f";
    ctx.fillRect(0,0,screen.width, screen.height);
    ctx.fillStyle="rgba(107,115,140,".concat(fade_in.toString());
    for (var i = 0; i < num_particles; i++) {
        ctx.fillRect(fogx[i]-.5,fogy[i]-.5,10,10);
    }
}

function update() {
    for (var i = 0; i < num_particles; i++) {
        fogx[i] += xvel[i];
        fogy[i] += yvel[i];
        if (fogx[i] > screen.width && xvel[i] > 0) {
            fogx[i] = -10;
        } else if (fogx[i] + 10 < 0 && xvel[i] < 0) {
            fogx[i] = screen.width;
        }

        if (fogy[i]> screen.height && yvel[i] > 0) {
            fogy[i] = -10;
        } else if (fogy[i] + 10 < 0 && yvel[i] < 0) {
            fogy[i] = screen.height;
        }
    }
    if (fade_in < .06)
        fade_in += .002;
}
