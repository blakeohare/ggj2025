<?php

    $LETTERS = 'abcdefghijklmnopqrstuvwxyz';
    $GIBBERISH_ALPHABET = $LETTERS . strtoupper($LETTERS) . '0123456789';

    function generate_gibberish($length) {
        global $GIBBERISH_ALPHABET;
        $alpha_max_index = strlen($GIBBERISH_ALPHABET) - 1;
        $sb = [];
        for ($i = 0; $i < $length; $i++) {
            $j = random_int(0, $alpha_max_index);
            array_push($sb, $GIBBERISH_ALPHABET[$j]);
        }
        return implode('', $sb);
    }

    function get_url_parts() {
        $uri = ($_SERVER['REQUEST_URI'] ?? '');
        $t = explode('?', $uri);
        $path = $t[0];
        $parts = explode('/', $path);
        $output = [];
        for ($i = 1; $i < count($parts); $i++) {
            array_push($output, $parts[$i]);
        }
        return $output;
    }

    function current_time_float() {
        return microtime(true);
    }

    function pad_zeroes($n, $size) {
        $t = '' . $n;
        while (strlen($t) < $size) $t = '0' . $t;
        return $t;
    }

    function generate_pleasant_color() {
        $c1 = random_int(0, 255);
        $c2 = min(255, random_int(0, 400));
        if ($c1 < 128 && $c2 < 128) {
            $c2 += 128;
        }
        $rgb = [random_int(0, 30), $c1, $c2];
        shuffle($rgb);

        $sb = [];
        $hex = '0123456789abcdef';
        foreach ($rgb as $color) {
            $a = $hex[$color >> 4];
            $b = $hex[$color & 15];
            array_push($sb, $a, $b);
        }
        return implode('', $sb);
    }

    function ensure_array($obj) {
        if (is_array($obj)) return $obj;
        return [];
    }

    function ensure_string($obj) {
        if (is_string($obj)) return $obj;
        if (is_array($obj)) return 'Array';
        if ($obj === null) return ''; 
        return '' . $obj;
    }

?>