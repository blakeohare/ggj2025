const Api = (() => {

    let send = async (path, payload) => {
        let res = await fetch(path, {
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            method: 'POST',
        });
        let text = await res.text();
        try {
            let data = JSON.parse(text);
            return data;
        } catch (ex) {
            console.error(text);
            throw new Error("WAAHHHHH");
        }
    };

    let sendSync = async (arenaToken) => {
        return send('/api.php', {
            type: 'viewSync',
            arena: arenaToken,
        });
    };

    let sendControllerEvents = async (playerId, events) => {
        return send('/api.php', {
            type: 'controllerPump',
            playerId,
            events
        });
    };

    return Object.freeze({
        sendSync,
        sendControllerEvents,
    });
})();
