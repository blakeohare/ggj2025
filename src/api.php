<?php

    require 'util/sql.php';
    require 'util/util.php';

    function api_main() {

        $method = trim($_SERVER['REQUEST_METHOD']);
        if ($method !== 'POST') return 'Error: only POST requests allowed';
        $content = file_get_contents('php://input');
        $payload = json_decode($content, true);
        $output = api_handle($payload);
        return json_encode($output);
    }

    function api_handle($payload) {

        if (!is_array($payload)) {
            return ['ok' => false, 'error' => 'BAD_REQUEST'];
        }

        switch ($payload['type'] ?? '') {
            case 'viewSync':
                return api_view_sync(
                    $payload['arena'] ?? '',
                    $payload['lastKnownEventId'] ?? 0);
            case 'controllerPump':
                return api_controller_pump(
                    $payload['playerId'] ?? '',
                    ensure_array($payload['events'] ?? null));
        }

        return [
            'ok' => false,
            'error' => 'NOT_IMPLEMENTED',
        ];
    }

    function api_view_sync($arena_id, $last_known_event_id) {
        return [
            'ok' => false,
            'error' => "the view sync is not done yet!",
        ];
    }

    function api_controller_pump($player_token, $events) {
        $player_info = sql_select_row("
            SELECT *
            FROM arena_player
            WHERE
                `external_token` = " . sql_sanitize_quoted($player_token) . "
            LIMIT 1
        ");
        if ($player_info === null) {
            return ['ok' => true, 'isActive' => false];
        }
        $player_id = intval($player_info['player_id']);
        $arena_id = intval($player_info['arena_id']);

        sql_mutate("
            UPDATE arena_player
            SET
                last_ping_time = " . time() . "
            WHERE
                player_id = $player_id
            LIMIT 1");

        sql_insert('arena_event', [
            'arena_id' => $arena_id,
            'event_type' => 'MOVE',
            'data' => $player_id . ':' . implode(',', $events),
            'time_millis' => current_time_float()
        ]);

        return ['ok' => true, 'isActive' => true];
    }

    echo api_main();
?>