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
            img.style.imageRendering = 'pixelated';
            img.addEventListener('load', () => {
                let canvas = document.createElement('canvas');
                canvas.style.imageRendering = 'pixelated';
                canvas.width = img.width;
                canvas.height = img.height;
                let ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                res(canvas);
            });
            img.src = path;
        });
    };

    let padNum = (n, sz) => {
        let v = '' + n;
        while (v.length < sz) v = '0' + v;
        return v;
    };


    return Object.freeze({
        pause,
        padNum,
        getCurrentTime,
        hexToRgb,
        isColorDark,
        loadImage,
    });
})();

const Base64 = (() => {

  let letters = 'abcdefghijklmnopqrstuvwxyz';
  let b64 = (letters.toUpperCase() + letters + '0123456789+/').split('');
  let b64Lookup = {};
  b64.forEach((c, i) => { b64Lookup[c] = i; });

  let bytesToBase64 = bytes => {
    let pairs = [];
    let b;
    for (let i = 0; i < bytes.length; i++) {
      b = bytes[i];
      pairs.push((b >> 6) & 3, (b >> 4) & 3, (b >> 2) & 3, b & 3);
    }
    while (pairs.length % 3 !== 0) pairs.push(0);
    let sb = '';
    for (let i = 0; i < pairs.length; i += 3) {
      b = (pairs[i] << 4) | (pairs[i + 1] << 2) | pairs[i + 2];
      sb += b64[b];
    }
    while (sb.length % 4 !== 0) sb += '=';
    return sb;
  };

  let base64ToBytes = b64 => {
    let pairs = [];
    let chars = b64.split('');
    while (chars.length && chars[chars.length - 1] === '=') chars.pop();
    let b;
    for (let c of chars) {
      b = b64Lookup[c] || 0;
      pairs.push((b >> 4) & 3, (b >> 2) & 3, b & 3);
    }
    while (pairs.length % 4) pairs.pop();
    let bytes = [];
    let len = pairs.length;

    for (let i = 0; i < len; i += 4) {
      bytes.push((pairs[i] << 6) | (pairs[i + 1] << 4) | (pairs[i + 2] << 2) | pairs[i + 3]);
    }
    return new Uint8Array(bytes);
  };

  return Object.freeze({ base64ToBytes, bytesToBase64 });

})();
