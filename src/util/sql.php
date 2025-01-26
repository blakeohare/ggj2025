<?php
    $_DB_CONNECTION = null;

    require_once 'env.php';

    function sql_get() {
        global $_DB_CONNECTION;
        if ($_DB_CONNECTION === null) {
            $_DB_CONNECTION = sql_new_connection();
        }
        return $_DB_CONNECTION;
    }

    function sql_new_connection() {
        global $_CONFIG;
        $mysql = $_CONFIG['mysql'];
        return mysqli_connect(
            $mysql['host'],
            $mysql['user'],
            $mysql['password'],
            $mysql['database']);
    }

    function sql_select_rows($query) {
        $db = sql_get();
        $result = $db->query($query);
        $output = [];
        $sz = $result->num_rows;
        for ($i = 0; $i < $sz; $i++) {
            array_push($output, $result->fetch_assoc());
        }
        return $output;
    }

    function sql_select_row($query) {
        $output = sql_select_rows($query);
        if (count($output) === 0) return null;
        return $output[0];
    }

    function sql_mutate($query) {
        $db = sql_get();
        $db->query($query);
        return $db->affected_rows;
    }

    function sql_insert($table, $arr) {
        $sb = ["INSERT INTO `" . $table . "` ("];
        $key_arr = [];
        $val_arr = [];
        foreach ($arr as $k => $v) {
            array_push($key_arr, $k);
            array_push($val_arr, sql_sanitize_unquoted($v));
        }

        $sql = implode('', [
            'INSERT INTO `', $table, '` (`',
            implode("`, `", $key_arr),
            '`) VALUES (',
            "'", implode("', '", $val_arr), "')"
        ]);

        $db = sql_get();
        $db->query($sql);

        return $db->insert_id;
    }

    function sql_sanitize_unquoted($str) {
        $db = sql_get();
        return $db->real_escape_string($str);
    }

    function sql_sanitize_quoted($str) {
        $db = sql_get();
        return "'" . $db->real_escape_string($str) . "'";
    }

?>