const main = (() => {

    let x = 0;
    let y = 0;

    let update = () => {
        x += 2;
        y += 1;
    };

    let render = (gfx) => {
        gfx.fill(0, 0, 0);
        gfx.drawRect(x, y, 10, 10, 255, 0, 0);
    };

    let main = async (tokenId) => {
        console.log("Load game: " + tokenId);

        const gfx = Gfx2D.newScreen(800, 600);

        const FPS = 30;
        while (true) {
            let start = Util.getCurrentTime();
            update();
            render(gfx);
            let end = Util.getCurrentTime();
            let totalTime = end - start;
            let diff = 1.0 / FPS - totalTime;
            let delay = Math.max(diff, 0.001);
            await Util.pause(delay);
        }
    };

    return main;
})();
