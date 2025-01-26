const playerControllerMain = (() => {

    const TIME_SINCE_FLUSH_EXPIRE = 0.5;
    const TIME_SINCE_FLUSH_INVALIDATE = 5.0;

    let lastSendTime = 0;

    const TWO_PI = Math.PI * 2;
    let convertDirToCardinal = (dx, dy) => {
        let pizzaSlice = 16 * ((TWO_PI + Math.atan2(dy, dx)) % TWO_PI) / TWO_PI;
        let right = pizzaSlice >= 13 || pizzaSlice < 3;
        let left = pizzaSlice > 5 && pizzaSlice < 11;
        let up = pizzaSlice > 9 && pizzaSlice < 15;
        let down = pizzaSlice > 1 && pizzaSlice < 7;
        return { up, down, left, right };
    };

    let loadImages = async () => {
        let imageData = await Promise.all([
            ...'0123456789'.split('').map(c => '/images/digits/' + c + '.png'),
            ...'left up down right'.split(' ').map(d => '/images/dpad/' + d + '.png'),
        ].map(async f => ({ name: f.split('/').pop().split('.')[0], img: await Util.loadImage(f) }))
        );
        let output = {};
        for (let image of imageData) {
            output[image.name] = image.img;
        }
        return output;
    };

    let render = (g, jerseyNum, color) => {
        let rgb = Util.hexToRgb(color);
        g.fill(rgb[0], rgb[1], rgb[2]);

        const WIDTH = g.getWidth();
        const HEIGHT = g.getHeight();
        const LEFT_SECTION_WIDTH = Math.floor(WIDTH * 0.6);
        const LEFT_SECTION_MARGIN = Math.floor(LEFT_SECTION_WIDTH * 0.1);
        const LETTER_WIDTH = (LEFT_SECTION_WIDTH - LEFT_SECTION_MARGIN) / 3;
        const LETTER_HEIGHT = Math.floor(LETTER_WIDTH * imageLookup['0'].height / imageLookup['0'].width);
        const LETTER_TOP = (HEIGHT - LETTER_HEIGHT) >> 1;

        const DPAD_FULL_WIDTH = WIDTH - LEFT_SECTION_WIDTH;
        const DPAD_MARGIN = Math.floor(DPAD_FULL_WIDTH / 8);
        const DPAD_WIDTH = (DPAD_FULL_WIDTH - DPAD_MARGIN * 2);
        const DPAD_LEFT = LEFT_SECTION_WIDTH + DPAD_MARGIN;
        const DPAD_TOP = Math.floor(HEIGHT / 2 - DPAD_WIDTH / 2);
        const DPAD_HEIGHT = DPAD_WIDTH;
        const DPAD_BUTTON_LENGTH = Math.floor(DPAD_WIDTH / 2 * 0.9);
        const DPAD_BUTTON_BREADTH = Math.floor(DPAD_BUTTON_LENGTH * imageLookup.up.width / imageLookup.up.height);
        const DPAD_MID_X = Math.floor(LEFT_SECTION_WIDTH + DPAD_WIDTH / 2 - DPAD_BUTTON_BREADTH / 2 + DPAD_MARGIN);
        const DPAD_MID_Y = Math.floor(HEIGHT / 2 - DPAD_BUTTON_BREADTH / 2);
        const DPAD_FAR_X = WIDTH - DPAD_MARGIN - DPAD_BUTTON_LENGTH;
        const DPAD_FAR_Y = Math.floor(HEIGHT / 2 + DPAD_HEIGHT / 2 - DPAD_BUTTON_LENGTH);

        for (let i = 0; i < 3; i++) {
            let img = imageLookup[jerseyNum[i]]
            g.drawImageScaled(img, LEFT_SECTION_MARGIN + i * LETTER_WIDTH, LETTER_TOP, LETTER_WIDTH, LETTER_HEIGHT);
        }

        g.drawImageScaled(imageLookup.up, DPAD_MID_X, DPAD_TOP, DPAD_BUTTON_BREADTH, DPAD_BUTTON_LENGTH);
        g.drawImageScaled(imageLookup.down, DPAD_MID_X, DPAD_FAR_Y, DPAD_BUTTON_BREADTH, DPAD_BUTTON_LENGTH);
        g.drawImageScaled(imageLookup.left, DPAD_LEFT, DPAD_MID_Y, DPAD_BUTTON_LENGTH, DPAD_BUTTON_BREADTH);
        g.drawImageScaled(imageLookup.right, DPAD_FAR_X, DPAD_MID_Y, DPAD_BUTTON_LENGTH, DPAD_BUTTON_BREADTH);

        return [
            DPAD_LEFT / WIDTH,
            DPAD_TOP / HEIGHT,
            DPAD_WIDTH / WIDTH,
            DPAD_HEIGHT / HEIGHT,
        ];

    };

    let imageLookup;
    let main = async (jerseyNum, color, playerToken) => {

        let updateSize = (canvas) => {
            let availWidth = Math.max(1, Math.floor(window.innerWidth));
            let availHeight = Math.max(1, Math.floor(window.innerHeight));
            let r = availWidth / availHeight;
            let x = 0;
            let y = 0;
            let w;
            let h;
            if (r > 2) {
                // screen is wider, need vertical bars
                h = availHeight;
                w = h * 2;
                x = (availWidth - w) >> 1;
                y = 0;
            } else {
                // screen is taller, need horizontal bars
                w = availWidth;
                h = Math.floor(w / 2);
                x = 0;
                y = (availHeight - h) >> 1;
            }
            canvas.style.left = x + 'px';
            canvas.style.top = y + 'px';
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';
        };

        imageLookup = await loadImages();
        let screen = Gfx2D.newScreen(1200, 600);
        let canvas = screen.getDomElement();
        let host = document.getElementById('host');
        while (host.firstChild) host.removeChild(host.firstChild);
        host.append(canvas);
        canvas.style.position = 'absolute';
        canvas.style.userSelect = 'none';
        canvas.classList.add('notouch');
        document.body.classList.add('notouch');
        window.addEventListener('resize', () => updateSize(canvas));
        updateSize(canvas);
        document.body.append()

        let bounds = render(screen, jerseyNum, color);

        let pointerPressed = false;
        let pointerLoc = [0, 0];

        let getPointerLocation = () => {
            if (pointerPressed) {
                let [x, y] = pointerLoc;
                if (x < -1 || x > 1) return null;
                if (y < -1 || y > 1) return null;
                return [x, y];
            }
            return null;
        };

        let handlePointerEvent = (e, evType) => {
            e.preventDefault();
            e.stopPropagation();
            let rect = canvas.getBoundingClientRect();

            let x = e.touches ? e.touches[0].clientX : e.clientX;
            let y = e.touches ? e.touches[0].clientY : e.clientY;

            // normalize to canvas
            let ux = (x - rect.left) / rect.width;
            let uy = (y - rect.top) / rect.height;

            // normalize to dpad
            ux = (ux - bounds[0]) / bounds[2];
            uy = (uy - bounds[1]) / bounds[3];

            // normalize to -1 to 1 range
            ux = ux * 2 - 1;
            uy = uy * 2 - 1;

            pointerLoc[0] = ux;
            pointerLoc[1] = uy;
            switch (evType) {
                case 'down':
                    pointerPressed = true;
                    break;
                case 'up':
                    pointerPressed = false;
                    break;
            }
        };

        canvas.addEventListener('pointerdown', e => handlePointerEvent(e, 'down'));
        canvas.addEventListener('pointerup', e => handlePointerEvent(e, 'up'));
        canvas.addEventListener('pointermove', e => handlePointerEvent(e, 'move'));
        canvas.addEventListener('touchmove', e => handlePointerEvent(e, 'move'));

        let inputQueue = [];
        let queueHasStuff = false;
        let captureInputIntoQueue = dirs => {
            let dirSnapshot = (dirs.up ? 'W' : '') +
                (dirs.left ? 'A' : '') +
                (dirs.down ? 'S' : '') +
                (dirs.right ? 'D' : '');
            inputQueue.push(dirSnapshot || 'O');
        };

        window.setInterval(() => {
            maybePumpQueue();
            let senderLed = 1 - Math.min(1, Math.max(0, (Util.getCurrentTime() - lastSendTime)));
            screen.drawEllipse(5, 5, 15, 15, Math.floor(senderLed * 255), 0, 0);
        }, 20);

        window.setInterval(() => {
            let pt = getPointerLocation();
            if (!pt) {
                captureInputIntoQueue({});
            } else {
                let dir = convertDirToCardinal(...pt);
                captureInputIntoQueue(dir);
                queueHasStuff = true;
            }
        }, 100);

        let lastFlush = 0;
        let nextFlushingId = 1;
        let activeFlushId = 0;
        let disconnected = false;
        let maybePumpQueue = () => {
            let now = Util.getCurrentTime();
            let timeSinceFlush = now - lastFlush;
            let shouldDoFlush = false;
            if (!queueHasStuff) {
                // no need!
            } else if (activeFlushId) {
                if (timeSinceFlush > TIME_SINCE_FLUSH_INVALIDATE) shouldDoFlush = true;
            } else {
                if (timeSinceFlush > TIME_SINCE_FLUSH_EXPIRE) shouldDoFlush = true;
            }
            if (shouldDoFlush) {
                lastFlush = now;
                let flushThis = [...inputQueue];
                inputQueue = [];
                queueHasStuff = false;
                activeFlushId = ++nextFlushingId;

                doFlush(flushThis).then(isActive => {
                    if (activeFlushId === nextFlushingId) {
                        activeFlushId = 0;
                    }
                    if (!isActive) {
                        disconnected = true;
                    }
                    lastSendTime = Util.getCurrentTime();
                });
            }
        };

        let doFlush = async (itemsToFlush) => {
            let arr = [];
            let lastItem = '(invalid)';
            for (let item of itemsToFlush) {
                if (item === lastItem) {
                    arr[arr.length - 1]++;
                } else {
                    arr.push(item, 1);
                    lastItem = item;
                }
            }
            arr = arr.filter(v => v !== 1);
            let response = await Api.sendControllerEvents(playerToken, arr);
            return response.isActive;
        };

    };

    return main;
})();
