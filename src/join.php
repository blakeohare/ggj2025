<?php

    require 'util/util.php';
    require 'util/html.php';
    require 'util/sql.php';

    function join_main() {
        $parts = get_url_parts();
        if (count($parts) !== 2 || $parts[0] !== 'join') {
            html_set_404_status();
            echo "Page not found!";
            return;
        }

        $arena_token = substr($parts[1], 0, 100);

        $row = sql_select_row("
            SELECT *
            FROM `arena_instance`
            WHERE
                `external_token` = " . sql_sanitize_quoted($arena_token) . "
            LIMIT 1
        ");

        if ($row === null) {
            html_set_404_status();
            echo "That arena is no longer active.";
            return;
        }

        $arena_id = intval($row['arena_id']);
        $player_token = generate_gibberish(10);
        $jersey_num = try_get_new_jersey_num($arena_id);
        $player_color = generate_pleasant_color();
        if ($jersey_num === null) {
            echo "The arena is currently full. Please wait for some of the players to die.";
            return;
        }

        $player_id = sql_insert('arena_player', [
            'arena_id' => $arena_id,
            'external_token' => $player_token,
            'color_rgb' => $player_color,
            'player_data' => '',
            'last_ping_time' => time(),
            'jersey_num' => $jersey_num,
        ]);

        sql_insert('arena_event', [
            'arena_id' => $arena_id,
            'event_type' => 'JOIN',
            'data' => $player_id . ',' . $jersey_num . ',' . $player_color,
            'time_millis' => current_time_float(),
        ]);

        header("Location: /play/" . $player_token, true, 307);
    }
    
    function try_get_new_jersey_num($arena_id) {

        $other_players = sql_select_rows("SELECT jersey_num FROM arena_player WHERE arena_id = $arena_id");
        $jersey_num = random_int(0, 999);
        if (count($other_players) > 200) {
            return null;
        }

        $jersey_lookup = array();
        foreach ($other_players as $op) {
            $jersey_lookup['j' . $op['jersey_num']] = true;
        }
        for ($i = 0; $i < 1000; $i++) {
            $test = ($i + $jersey_num) % 1000;
            if (!isset($jersey_lookup['j' . $test])) {
                return pad_zeroes($test, 3);
            }
        }
        return null;
    }

    join_main();

?>