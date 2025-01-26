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

        $arena_info = sql_select_row("SELECT * FROM arena_instance WHERE `external_token` = " . sql_sanitize_quoted($arena_id) . " LIMIT 1");

        if ($arena_info === null) {
            return ['ok' => true, 'isActive' => false];
        }

        $arena_id = intval($arena_info['arena_id']);

        sql_mutate("
            DELETE FROM arena_event
            WHERE
                arena_id = $arena_id AND
                event_id <= $last_known_event_id
        ");

        $event_rows = sql_select_rows("
            SELECT *
            FROM arena_event
            WHERE
                arena_id = $arena_id
            ORDER BY
                event_id
            ");

        $events_out = [];
        foreach ($event_rows as $event) {
            array_push($events_out, [
                'id' => intval($event['event_id']),
                'type' => $event['event_type'],
                'data' => $event['data'],
            ]);
        }

        sql_mutate("
            UPDATE arena_instance
            SET
                last_sync_time = " . time() . "
            WHERE arena_id = $arena_id
            LIMIT 1
        ");

        return [
            'ok' => true,
            'isActive' => true,
            'events' => $events_out,
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