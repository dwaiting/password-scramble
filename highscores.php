<?php
    $servername = "localhost";
    $username = "scramble_user";
    $password = "scramble_pass";
    $db = "scramble_db";

    $conn = new mysqli($servername, $username, $password, $db);

    if ($conn->connect_error) {
        die("Oops - something went wrong: " . $conn->connect_error);
    } 

    $score = $_POST['score'];
    $level = $_POST['level'];
    $initials = $_POST['initials'];
    $email_address = $_POST['email_address'];
    $ip = $_SERVER['REMOTE_ADDR'];
    $time_stamp = date("c");

    // Using prepared statement to prevent SQL injection
    if ($stmt = $conn->prepare("INSERT INTO high_scores (score, level, initials, email_address, ip_address, time_stamp) VALUES (?, ?, ?, ?, ?, ?)")) {

        $stmt->bind_param("ssssss", $score, $level, $initials, $email_address, $ip, $time_stamp);
        $stmt->execute();
    }

    $sql = "SELECT initials, score FROM high_scores ORDER BY score DESC LIMIT 10";
    $result = $conn->query($sql);

    echo "<table>";
    while($row = $result->fetch_assoc()) {
        echo "<tr><td>" . $row["initials"] . "</td><td>" . $row["score"] . "</td></tr>";
    }
    echo "</table>";

    $conn->close();
?>
