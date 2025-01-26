<?php

    require 'util/util.php';
    require 'util/html.php';
    require 'util/sql.php';

    function view_not_found() {
        html_set_404_status();
        echo html_emit_header('Arena not found', '');
        echo "That arena is no longer active.";
        echo html_emit_footer();

    }

    function view_main() {
        $url_parts = get_url_parts();
        if (count($url_parts) !== 2 || $url_parts[0] !== 'view') {
            view_not_found();
            return;
        }

        $token = substr(trim($url_parts[1]), 0, 100);
        $row = sql_select_row("SELECT * FROM `arena_instance` WHERE `external_token` = " . sql_sanitize_quoted($token) . " LIMIT 1");
        if ($row === null) {
            view_not_found();
            return;
        }

        echo html_emit_header('Bubble Rumble Arena', implode("\n", [
            '<style>',
            ' body { background-color: #333; color: #fff; }',
            '</style>',
            '<script src="/js/util.js"></script>',
            '<script src="/js/gfx2d.js"></script>',
            '<script src="/js/api.js"></script>',
            '<script src="/js/main.js"></script>',
            '<script>',
            "  window.addEventListener('load', () => { main('" . $token . "'); });",
            '</script>',
        ]));
        echo '<div id="host"></div>';
        echo html_emit_footer();
    }

    view_main();

?>