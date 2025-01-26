<?php

    function html_emit_header($title, $extra_head_stuff) {
        return implode("\n", [
            '<!DOCTYPE html>',
            '<html lang="en">',
            '  <head>',
            '    <meta charset="utf-8">',
            '    <meta name="viewport" content="width=device-width, initial-scale=1">',
            '    <title>' . htmlspecialchars($title) . '</title>',
            '    <style>',
            '      * { margin: 0; padding: 0; box-sizing: border-box; }',
            '      body { font-family: sans-serif; }',
            '    </style>',
            '    ' . $extra_head_stuff,
            '  </head>',
            '  <body>',
            '']);
    }

    function html_emit_footer() {
        return "\n</body>\n</html>\n";
    }

    function html_set_404_status() {
        header($_SERVER['SERVER_PROTOCOL'] . ' 404 Not Found', true, 404);
    }

?>