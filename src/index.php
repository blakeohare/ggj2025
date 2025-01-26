<?php
    require 'util/html.php';

    echo html_emit_header(
        'バブル・ランブル',
        '<style>
            body {
                background-color: #333;
                color: #fff;
                font-family: sans-serif;
            }
            h1 { text-align: center; }
            div.step-cell {
                width: 270px;
                display: block;
                float: left;
                border: 1px solid #555;
                border-radius: 8px;
                padding: 30px;
                margin-right: 20px;
                height: 250px;
                position: relative;
            }
            h1.smaller {
                font-size: 14pt;
            }
            .centerer {
                margin: 0 auto;
                width: 900px;
                position: relative;
            }
            .step-cell input[type="submit"] {
                padding: 8px;
                background-color: #03f;
                color: #fff;
                border-radius: 8px;
                font-size: 18pt;
                font-weight: bold;
                border: 3px solid #08f;
                cursor: pointer;
            }
        </style>');

?>
        <h1>バブル・ランブル</h1>
        <h1 class="smaller">Bubble・Rumble</h1>

        <div class="centerer">
            <div class="step-cell">
                <h2>Step 1</h2>
                <h3>Create a new arena</h3>
                <div>
                    <form action="/create" method="POST">
                        <input type="submit" name="createbtn" value="Create!"/>
                    </form>
                </div>
                Show the arena to a crowd of people
            </div>

            <div class="step-cell">
                <h2>Step 2</h2>
                <h3>Scan the QR code</h3>
                Scan the QR code in the arena on your Smart Telephone.
            </div>
            <div class="step-cell">
                <h2>Step 3</h2>
                <h3>Carnage</h3>
                Roll and push your friends into the hole.
            </div>
        </div>

<?php
    echo html_emit_footer();
?>