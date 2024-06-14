const images = []; let isPlay = false;



// GAME
class Background extends GameObject {
    constructor() { super(540, 960, 1080, 1920); }
    lateUpdate() { layers[0].context.fillStyle = "rgba(0, 0, 0, 0.1)"; layers[0].context.fillRect(0, 0, 1080, 1920); }
}


class Player extends GameObject {
    constructor() { super(540, 960, 100, 100); this.a = 0; this.speed = 0.4; this.dir = false; }

    update() {
        this.transform.position.x = 540 + 400 * Math.cos(this.a);
        this.transform.position.y = 960 + 400 * Math.sin(this.a);

        if (this.dir) { if(this.a < Math.PI) this.a += this.speed; }
        else { if(this.a > 0) this.a -= this.speed; }

        if(this.a > Math.PI) this.a = Math.PI;
        if(this.a < 0) this.a = 0;
    }

    tap() { this.dir = !this.dir; }

    lateUpdate() {
        layers[0].context.beginPath();
        layers[0].context.arc(this.transform.position.x, this.transform.position.y, this.transform.size.x / 2, 0, 2 * Math.PI, false);
        layers[0].context.fillStyle = "aqua";
        layers[0].context.fill();

        layers[0].context.beginPath();
        layers[0].context.moveTo(540, 960);
        layers[0].context.lineTo(this.transform.position.x, this.transform.position.y);
        layers[0].context.stroke();
    }
    
    collision(other) { if(other.constructor.name == "Bomb") scene_control.load("Menu"); }
}


class Control extends Button {
    constructor() { super(540, 960, 1080, 1920); }
    onPress() { objects[4].tap(); }
}


class LevelGenerator extends GameObject {
    constructor() { super(540, 960, 0, 0); this.time = 0; this.timeout = 1; this.confusion = 0; }

    update() {
        this.time++; if(this.time >= this.timeout * 60) { this.spawn(); this.time = 0; }
        this.confusion += 1/3600; if(this.confusion > 1) this.confusion = 1;
    }

    spawn() {
        let x = float2int(random() * 980) + 50; objects.push(new Bomb(x));
        this.timeout = float2int((1.7 + random() * 0.5 * (1 - this.confusion)) * 100) / 100 - this.confusion;
    }
}


class FallingObject extends GameObject {
    constructor(x) { super(x, -50, 100, 100); this.a = 0; this.m = 10; }

    update() {
        this.a += 1/60 * this.m; this.transform.position.y += this.a;
        if(this.transform.position.y > 1970) { this.destroyed = true; this.onDestroy(); }
    }

    lateUpdate() {
        layers[0].context.beginPath();
        layers[0].context.arc(this.transform.position.x, this.transform.position.y, this.transform.size.x / 2, 0, 2 * Math.PI, false);
        layers[0].context.fillStyle = "white";
        layers[0].context.fill();
    }

    onDestroy() { }

    collision() { }
}


class Bomb extends FallingObject {
    constructor(x) { super(x); }

    onDestroy() {
        super.onDestroy(); let sizeY = float2int(random() * 700 + 100);

        layers[1].context.beginPath();
        layers[1].context.arc(this.transform.position.x, 1920 - sizeY, this.transform.size.x / 2, 0, 2 * Math.PI, false);
        layers[1].context.rect(this.transform.position.x - this.transform.size.x / 2, 1920 - sizeY, 100, sizeY);
        layers[1].context.fill();
    }
}
// GAME



// MENU
class MenuButton extends Button {
    constructor(x, y, size, img, func) { super(x, y, size, size); this.func = func; this.img = img; this.render(); }

    render() { renderImage(images[this.img], this.transform, 2); }
    animate(value) {
        clearTransform(this.transform, 2);
        this.transform.size.x += value; this.transform.size.y += value;
        this.render();
    }

    onRelease() { this.animate(50); this.func.call(); }
    onInterrupt() { this.animate(50); }
    onPress() { this.animate(-50); }
}


class ScoreText extends GameObject {
    constructor() { super(100, 100, 150, 150); this.score = 0; this.highScore = localStorage.getItem("score") != null ? localStorage.getItem("score") : 0; }

    update() { if(isPlay) { this.score += 1/60; this.renderScore(); if(float2int(this.score) > float2int(this.highScore)) { this.highScore = float2int(this.score); localStorage.setItem("score", this.highScore) } } }

    renderScore() {
        clearTransform(new Vector4(540, this.transform.position.y, 1080, this.transform.size.y), 2); renderImage(images[2], this.transform, 2);
        layers[2].context.fillStyle = this.score <= this.highScore ? "white" : "yellow"; layers[2].context.fillText(float2int(this.score), this.transform.position.x + 80, this.transform.position.y + 5);
    }

    renderHighScore() {
        renderImage(images[3], new Vector4(this.transform.position.x, this.transform.position.y + 150, this.transform.size.x, this.transform.size.y), 2);
        layers[2].context.fillStyle = "yellow"; layers[2].context.fillText(float2int(this.highScore), this.transform.position.x + 80, this.transform.position.y + 155);
    }
}
// MENU



// ENGINE TOOLS
class SceneControl extends GameObject {
    constructor(scenes) { super(540, 960, 1080, 1920); this.move = false; this.scene = "Load"; this.scenes = scenes; }

    load(scene) { this.scene = scene; this.move = true; this.transform.position.y = 2880; }

    clearObjects() { for (let i = 3; i < objects.length; i++) { objects.splice(i, 1); i--; } for (let i = 2; i < layers.length; i++) clearTransform(this.transform, i); }

    update() {
        if (!this.move) return; clearTransform(this.transform, 3);
        this.transform.position.y -= 120; if(this.transform.position.y == 960) { this.clearObjects(); this.scenes[this.scene](); }
        if (this.transform.position.y == -960) this.move = false;
    }

    lateUpdate() { layers[3].context.fillRect(this.transform.position.x - this.transform.size.x / 2, this.transform.position.y - this.transform.size.y / 2, this.transform.size.x, this.transform.size.y); }
}


const scene_control = new SceneControl(
    {
        "Menu": () => {
            isPlay = false; objects[2].renderScore(); objects[2].renderHighScore();
            objects.push(new MenuButton(540, 960, 700, 0, () => { scene_control.load("Game"); }));
            objects.push(new MenuButton(950, 1820, 200, 1, () => { window.open("https://t.me/veins4u"); }));
        },
        "Game": () => {
            isPlay = true; objects[2].score = 0; clearTransform(new Vector4(540, 960, 1080, 1920), 1);
            objects.push(new Background()); objects.push(new Player()); objects.push(new Control()); objects.push(new LevelGenerator());
        },
    }
);


function start() {
    for (let i = 0; i < 4; i++) layers.push(new Layer());
    layers[0].context.lineWidth = 15; layers[0].context.lineCap = "round"; layers[0].context.strokeStyle = "aqua";
    layers[1].context.globalAlpha = 0.1; layers[1].context.fillStyle = "white";
    layers[2].context.font = "100px Monaco, monospace"; layers[2].context.fillStyle = "white";
    layers[2].context.textAlign = "left"; layers[2].context.textBaseline = "middle";
    layers[3].context.fillStyle = "white";

    seed = (new Date()).getMilliseconds();
    objects.push(scene_control); objects.push(new ScoreText()); scene_control.load("Menu");
}


class Loader {
    constructor(images_count) { this.images_count = images_count; this.progress = 0; }
    load() { for (let i = 0; i < this.images_count; i++) { images.push(new Image()); images[i].src = `resources/images/${i}.png`; images[i].onload = () => this.setLoadProgress(this.progress + 1); } }
    setLoadProgress(progress) { this.progress = progress; console.log(`loading: ${ float2int(this.progress / this.images_count * 100) }%`); if (this.progress === this.images_count) start(); }
}
// ENGINE TOOLS



const loader = new Loader(4); loader.load();
