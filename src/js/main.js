const main = (() => {

    const HOLE_COL = 5;
    const HOLE_ROW = 5;
    const TILE_MAP_RAW = [
        'RRRRR4GGGGG',
        'RRRRR4GGGGG',
        'RRRRR4GGGGG',
        'RRRRR4GGGGG',
        'RRRRR4GGGGG',
        '33333 11111',
        'YYYYY2BBBBB',
        'YYYYY2BBBBB',
        'YYYYY2BBBBB',
        'YYYYY2BBBBB',
        'YYYYY2BBBBB',
    ];
    const COLS = TILE_MAP_RAW[0].length;
    const ROWS = TILE_MAP_RAW.length;

    let players = [];
    let lastSyncId = 0;
    let lastSyncTime = Util.getCurrentTime();

    // TEMP DEBUG SETUP

    for (let i = 0; i < 3; i++) {

        let theta = Math.random() * 3.14159 * 2;

        let player = {
            x: (Math.random() * 2 + 2) * (Math.random() < 0.5 ? -1 : 1) + 5, // 5-9 or 1-3
            y: Math.random() * 11,
            z: 0,
            vx: Math.cos(theta) / 30 * 0.99,
            vy: Math.sin(theta) / 30 * 0.99,
            vz: 0,
            color: Util.hexToRgb('ffffff'),
            num: '' + Util.padNum(Math.floor(Math.random() * 1000), 3),
        };

        players.push(player);
    }
    players.forEach(p => { p.sortKey = p.x + p.y});


    let update = () => {

        for (let player of players) {
            let nx = player.x + player.vx;
            let ny = player.y + player.vy;
            if (nx > 0 && ny > 0 && nx < COLS && ny < ROWS) {
                player.x = nx;
                player.y = ny;
            }

            if (player.z === 0) {
                if (player.x > HOLE_COL && player.y > HOLE_ROW && player.x < HOLE_COL + 1 && player.y < HOLE_ROW + 1) {
                    // Fall!
                    player.z = -0.01;
                }
            } else if (player.z < 0) {
                player.z += player.vz;
                player.vz -= 0.1;
            } else {
                player.z += player.vz;
                player.vz -= 0.1;
                if (player.z < 0) {
                    player.z = 0;
                    player.vz = 0;
                }
            }

            if (player.z > 100) {
                player.isDead = true;
            }
        }
        players = players.filter(p => !p.isDead);
    };

    let render = (gfx) => {
        gfx.fill(0, 0, 0);
        // gfx.drawRect(x, y, 10, 10, 255, 0, 0);

        const WIDTH = gfx.getWidth();
        const HEIGHT = gfx.getHeight();
        const CAMERA_X_OFFSET = WIDTH >> 1;
        const CAMERA_Y_OFFSET = HEIGHT >> 2;

        const TOTAL_FILES = COLS + ROWS - 1;
        const SIZE_RATIO = 2;
        const TILE_WIDTH = IMAGES.R.width * SIZE_RATIO;
        const TILE_HEIGHT = Math.floor(IMAGES.R.height * SIZE_RATIO * 2 / 3);


        players.sort((a, b) => a.sortKey - b.sortKey);
        let playerBuckets = {};
        for (let player of players) {
            let k = Math.floor(player.x) + ':' + Math.floor(player.y);
            let bucket = playerBuckets[k] || [];
            playerBuckets[k] = bucket;
            bucket.push(player);
        }

        // which: { ABOVE | BELOW | HOLE }
        let renderPlayers = (which) => {

            // Render players
            const PLAYER_WIDTH = Math.floor(TILE_WIDTH / 3);
            const PLAYER_HALF_WIDTH = PLAYER_WIDTH >> 1;
            const PLAYER_HEIGHT = PLAYER_WIDTH;
            for (let player of players) {
                let playerIsAbove = player.z >= 0;
                let playerInHole = Math.floor(player.x) === HOLE_COL && Math.floor(player.y) === HOLE_ROW;
                let shouldRender = false;
                if (playerInHole) {
                    shouldRender = which === 'HOLE';
                } else {
                    shouldRender = playerIsAbove === (which === 'ABOVE');
                }
                if (shouldRender) {
                    let px = CAMERA_X_OFFSET + player.x * TILE_WIDTH / 2 - player.y * TILE_WIDTH / 2;
                    let py = CAMERA_Y_OFFSET + player.x * TILE_HEIGHT / 2 + player.y * TILE_HEIGHT / 2;
                    py -= player.z * TILE_HEIGHT / 2;
                    gfx.drawRect(px - PLAYER_HALF_WIDTH, py - PLAYER_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT, ...player.color);
                    gfx.drawText(player.num, px - PLAYER_HALF_WIDTH, py - PLAYER_HEIGHT * 1.3, 24, 255, 255, 255);
                }
            }
        };

        renderPlayers('BELOW');

        for (let file = 0; file < TOTAL_FILES; file++) {
            let y = 0;
            let x = file;
            let px = CAMERA_X_OFFSET + ((TILE_WIDTH * file) >> 1);
            let py = CAMERA_Y_OFFSET + ((TILE_HEIGHT * file) >> 1);
            while (x >= 0) {
                if (x < COLS && y < ROWS) {
                    let tile = TILE_MAP[x][y];
                    if (tile) {
                        gfx.drawImageScaled(tile, px - (TILE_WIDTH >> 1), py, tile.width * SIZE_RATIO, tile.height * SIZE_RATIO);
                    } else {
                        
                        renderPlayers('HOLE');
                    }
                }
                y++;
                x--;
                px -= TILE_WIDTH;
            }
        }

        renderPlayers('ABOVE');

    };

    const TILE_MAP = [];
    const IMAGES = {};

    let main = async (tokenId) => {
        console.log("Load game: " + tokenId);

        let images = await Promise.all(
            [
                ...'arrow-ne:2 arrow-nw:1 arrow-se:3 arrow-sw:4'.split(' '),
                ...'red:R green:G yellow:Y blue:B'.split(' '),
            ].map(async v => {
                let [name, id] = v.split(':');
                return {
                    name,
                    id,
                    image: await Util.loadImage('/images/tiles/' + name + '.png'),
                };
            }));

        images.reduce((lu, img) => {
            IMAGES[img.name] = img.image;
            IMAGES[img.id] = img.image;
        }, {});

        for (let x = 0; x < COLS; x++) {
            let col = [];
            for (let y = 0; y < ROWS; y++) {
                col.push(IMAGES[TILE_MAP_RAW[y][x]] ?? null);
            }
            TILE_MAP.push(col);
        }

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
