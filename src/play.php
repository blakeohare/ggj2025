<?php

    require 'util/html.php';
    require 'util/util.php';
    require 'util/sql.php';

    function play_main() {
        $url = get_url_parts();
        if (count($url) !== 2 || $url[0] !== 'play') {
            html_set_404_status();
            echo "Page not found";
            return;
        }

        $player_token = substr($url[1], 0, 100);

        $player_info = sql_select_row("
            SELECT *
            FROM `arena_player`
            WHERE
                `external_token` = " . sql_sanitize_quoted($player_token) . "
            LIMIT 1
        ");
        if ($player_info === null) {
            html_set_404_status();
            echo "That player or arena is no longer active.";
            return;
        }

        $color = $player_info['color_rgb'];
        $jersey_num = $player_info['jersey_num'];

        $invalidator = '?v=' . time();

        echo html_emit_header('Bubble Rumble', implode("\n", [
            '<script src="/js/util.js' . $invalidator . '"></script>',
            '<script src="/js/api.js' . $invalidator . '"></script>',
            '<script src="/js/gfx2d.js' . $invalidator . '"></script>',
            '<script src="/js/playercontroller.js' . $invalidator . '"></script>',
            '<script>',
            "  window.addEventListener('load', () => { playerControllerMain('" . $jersey_num . "', '" . $color . "', '" . $player_token . "'); });",
            '</script>',
            '<style>',
            '  html, body { position: relative; width: 100%; height: 100%; overflow-y: hidden; overflow-x: hidden; }',
            '  #host { position: absolute; width: 100%; height: 100%; background-color: #000; }',
            '  .notouch {', 
            '    -webkit-user-select: none;',
            '  }',
            '</style>',
        ]));

        echo '<div id="host"></div>';
        echo html_emit_footer();
    }

    play_main();

?>