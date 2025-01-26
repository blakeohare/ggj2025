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

    let createQrCode = async url => {
        let response = await fetch('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + url);
        let qrBody = await response.arrayBuffer();
        let b64 = Base64.bytesToBase64(new Uint8Array(qrBody));
        let img = document.createElement('img');
        img.src = 'data:image/png;base64,' + b64;
        img.style.width = '250px';
        img.style.height = '250px';
        img.style.imageRendering = 'pixelated';
        img.style.position = 'absolute';
        img.style.right = '10px';
        img.style.top = '10px';
        document.body.append(img);
    };

    // TEMP DEBUG SETUP

    let playersById = {};

    let createPlayer = (dbId, num, colorHex) => {
        let player = {
            databaseId: dbId,
            num,
            colorHex,
            color: Util.hexToRgb(colorHex),
            x: (Math.random() * 2 + 2) * (Math.random() < 0.5 ? -1 : 1) + 5, // 5-9 or 1-3
            y: Math.random() * 11,
            z: 7,
            vx: 0,
            vy: 0,
            vz: 0,
            moveQueue: [],
            replayingSince: 0,
            immuneTo: {},
        };
        playersById[dbId] = player;
        return player;
    };

    players.forEach(p => { p.sortKey = p.x + p.y});

    let poll = async (arenaToken) => {
        let lastKnownId = 0;
        while (true) {

            let response = await Api.sendSync(arenaToken, lastKnownId);
            if (!response.isActive) {
                throw new Error('arena is no longer active');
            }

            let { events } = response;
            for (let ev of events) {
                lastKnownId = Math.max(lastKnownId, ev.id);
                switch (ev.type) {
                    case 'JOIN':
                        let [dbId, num, colorHex] = ev.data.split(',');
                        players.push(createPlayer(parseInt(dbId), num, colorHex));
                        break;
                    case 'MOVE':
                        let [dbIdRaw, movesEnc] = ev.data.split(':');
                        let player = playersById[dbIdRaw];
                        if (player) {
                            let moves = movesEnc ? movesEnc.split(',') : [];
                            for (let i = 0; i + 1 < moves.length; i += 2) {
                                let dir = moves[i];
                                let amt = moves[i + 1];
                                for (let j = 0; j < amt; j++){
                                    if (dir !== 'O') {
                                        player.moveQueue.push([dir, dir === 'O' ? 25 : 50]);
                                    }
                                }
                            }
                        }
                        break;
                }
            }

            await Util.pause(0.15);
        }
    };

    let ensureInRange = (val, a, b) => {
        if (val < a) return a;
        if (val > b) return b;
        return val;
    };

    let DIAGONAL_MAGNITUDE = Math.sqrt(2) / 2;
    let applyDirs = (player, dirs) => {
        let dx = 0;
        let dy = 0;
        switch (dirs) {
            case 'W':
                dx = -DIAGONAL_MAGNITUDE;
                dy = -DIAGONAL_MAGNITUDE;
                break;
            case 'S':
                dx = DIAGONAL_MAGNITUDE;
                dy = DIAGONAL_MAGNITUDE;
                break;
            case 'A':
                dx = -DIAGONAL_MAGNITUDE;
                dy = DIAGONAL_MAGNITUDE;
                break;
            case 'D':
                dx = DIAGONAL_MAGNITUDE;
                dy = -DIAGONAL_MAGNITUDE;
                break;
            case 'WA':
            case 'AW':
                dx = -1;
                break;
            case 'WD':
            case 'DW':
                dy = -1;
                break;
            case 'AS':
            case 'SA':
                dy = 1;
                break;
            case 'SD':
            case 'DS':
                dx = 1;
                break;
        }
        let accel = 0.01;
        let maxV = 0.08;
        player.vx = ensureInRange(player.vx + accel * dx, -maxV, maxV);
        player.vy = ensureInRange(player.vy + accel * dy, -maxV, maxV);
    };

    let update = () => {

        for (let player of players) {

            if (player.moveQueue.length) {
                let slot = player.moveQueue[0];
                slot[1] -= 1000 / 30;
                let dirs = slot[0];
                applyDirs(player, dirs);
                if (slot[1] < 0) {
                    player.moveQueue.splice(0, 1);
                }
            }

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

            if (player.z < -60) {
                player.isDead = true;
                players.push(createPlayer(player.databaseId, player.num, player.colorHex));
            }

            player.vx *= 0.97;
            player.vy *= 0.97;
        }
        players = players.filter(p => !p.isDead);

        applyCollisions();
    };

    let bucketTemplate = [];
    for (let i = 0; i < 7 * 7; i++) {
        bucketTemplate.push(null);
    }
    let neighborOffsets = [-1, 1, 7, -7];
    let applyCollisions = () => {
        let buckets = [...bucketTemplate];
        for (let player of players) {
            if (player.z !== 0) continue;
            let x = Math.floor(player.x / COLS * 7);
            let y = Math.floor(player.y / ROWS * 7);
            let i = y * 7 + x;
            for (let neighborOffset of neighborOffsets) {
                let index = i + neighborOffset;
                buckets[index] = buckets[index] || [];
                buckets[index].push(player);
            }
        }

        let collisions = {};

        let uniqueCollisionKey = (p1, p2) => {
            let keys = [p1.num, p2.num];
            keys.sort();
            return keys.join('_');
        };

        let now = Util.getCurrentTime();
        for (let bucket of buckets) {
            if (bucket) {
                for (let i = 0; i < bucket.length; i++) {
                    let player1 = bucket[i];
                    for (let j = i + 1; j < bucket.length; j++) {
                        let player2 = bucket[j];

                        let dx = player1.x - player2.x;
                        let dy = player1.y - player2.y;
                        let dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < 0.4) {
                            let key = uniqueCollisionKey(player1, player2);
                            if (now - (player1.immuneTo[player2.num] || 0) > 2.5) {
                                collisions[key] = [player1, player2];
                                player1.immuneTo[player2.num] = now;
                                player2.immuneTo[player1.num] = now;
                            }
                        }
                    }
                }
            }
        }

        for (let collision of Object.values(collisions)) {
            console.log(collision)

            let [p1, p2] = collision;
            let fastX = 0;
            let fastY = 0;
            let p1V = Math.max(0.0001, Math.sqrt(p1.vx * p1.vx + p1.vy * p1.vy));
            let p2V = Math.max(0.0001, Math.sqrt(p2.vx * p2.vx + p2.vy * p2.vy));
            if (p1V < 0.0001 && p2V < 0.0001) {
                console.log("NO");
                continue;
            }

            if (p1V < p2V) {
                fastX = p2.vx / p2V * (p1V + p2V);
                fastY = p2.vy / p2V * (p1V + p2V);
                p2.vx = 0;
                p2.vy = 0;
                p1.vx = fastX;
                p1.vy = fastY;
            } else {
                fastX = p1.vx / p1V * (p1V + p2V);
                fastY = p1.vy / p1V * (p1V + p2V);
                p1.vx = 0;
                p1.vy = 0;
                p2.vx = fastX;
                p2.vy = fastY;
            }
        }
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

        players.forEach(p => { p.sortKey = p.x + p.y; });
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

            let justAbove = which === 'ABOVE';

            // Render players
            const PLAYER_WIDTH = Math.floor(TILE_WIDTH / 2);
            const PLAYER_HALF_WIDTH = PLAYER_WIDTH >> 1;
            const PLAYER_HEIGHT = PLAYER_WIDTH;
            for (let player of players) {
                let playerIsAbove = player.z >= 0;
                let playerInHole = Math.floor(player.x) === HOLE_COL && Math.floor(player.y) === HOLE_ROW;
                let shouldRender = false;
                if (playerInHole) {
                    shouldRender = which === 'HOLE';
                } else {
                    shouldRender = playerIsAbove === justAbove;
                }
                if (shouldRender) {
                    let px = CAMERA_X_OFFSET + player.x * TILE_WIDTH / 2 - player.y * TILE_WIDTH / 2;
                    let py = CAMERA_Y_OFFSET + player.x * TILE_HEIGHT / 2 + player.y * TILE_HEIGHT / 2;

                    if (justAbove) {
                        // draw a shadow for those above and over ground
                        gfx.drawEllipse(px - PLAYER_HALF_WIDTH, py - PLAYER_HEIGHT / 6, PLAYER_WIDTH, PLAYER_HEIGHT / 3, 0, 0, 0, 70);
                    }

                    py -= player.z * TILE_HEIGHT / 2;
                    gfx.drawEllipse(px - PLAYER_HALF_WIDTH - 2, py - PLAYER_HEIGHT - 2, PLAYER_WIDTH + 4, PLAYER_HEIGHT + 4, 0, 0, 0);
                    gfx.drawEllipse(px - PLAYER_HALF_WIDTH, py - PLAYER_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT, ...player.color);

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

        poll(tokenId);

        createQrCode('https://bubblerumble.fun/join/' + tokenId);

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
