const Util = (() => {

    let pause = async (seconds) => {
        return new Promise(res => {
            setTimeout(() => res(true), Math.floor(seconds * 1000));
        });
    };

    let getCurrentTime = () => new Date().getTime() / 1000.0;

    let isColorDark = (hexOrR, g, b) => {
        let r = hexOrR;
        if (g === undefined) {
            let t = hexToRgb(hexOrR);
            r = t[0];
            g = t[1];
            b = t[2];
        }

        return (r + g + b) < 128 * 3;
    }

    let hexToRgb = hex => {
        let val = parseInt(`${hex}`.trim().toLowerCase(), 16);
        if (isNaN(val) || !isFinite(val)) return [0, 0, 0];
        return [
            (val >> 16) & 255,
            (val >> 8) & 255,
            val & 255,
        ];
    };

    let loadImage = async path => {
        return new Promise(res => {
            let img = document.createElement('img');
            img.addEventListener('load', () => {
                let canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                let ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                res(canvas);
            });
            img.src = path;
        });
    };

    return Object.freeze({
        pause,
        getCurrentTime,
        hexToRgb,
        isColorDark,
        loadImage,
    });
})();
