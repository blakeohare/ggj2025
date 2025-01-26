<?php

    require 'util/sql.php';
    require 'util/html.php';
    require 'util/util.php';

    function create_main() {

        $method = strtoupper(trim($_SERVER['REQUEST_METHOD'] ?? ''));
        if ($method === 'POST' && isset($_POST['createbtn'])) {
            $token = generate_gibberish(8);
            $arena_id = sql_insert('arena_instance', [
                'external_token' => $token,
                'rollup_state' => '{}',
                'rollup_till_event_id' => 0,
                'last_sync_time' => time(),
            ]);
            header("Location: /view/" . $token, true, 307);
            return;
        }

        html_set_404_status();
        echo "Page not found.";
    }

    create_main();

?>