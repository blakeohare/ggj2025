const Gfx2D = (() => {

    let newScreen = (width, height) => {
        let canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        let host = document.getElementById('host');
        while (host.firstChild) host.remove(host.firstChild);
        host.append(canvas);
        let ctx = canvas.getContext('2d');

        let rgb2Css = (r, g, b, a) => {
            return (a === undefined || a > 255)
                ? ('rgb(' + r + ',' + g + ',' + b + ')')
                : ('rgba(' + r + ',' + g + ',' + b + ',' + (a / 255) + ')');
        };
        let gfx = {
            fill: (r, g, b) => {
                gfx.drawRect(0, 0, width, height, r, g, b);
            },
            drawRect: (x, y, width, height, r, g, b, a) => {
                ctx.fillStyle = rgb2Css(r, g, b, a);
                ctx.fillRect(x, y, width, height);
            },
            drawImageScaled: (img, x, y, w, h) => {
                ctx.drawImage(img, x, y, w, h);
            },
            getDomElement: () => canvas,
            getWidth: () => width,
            getHeight: () => height,
        };

        return Object.freeze(gfx);
    };

    return Object.freeze({
        newScreen,
    });
})();
