<!DOCTYPE html>
<html>

<head>
    <title>Password Scramble</title>
    <link rel="stylesheet" type="text/css" href="style.css" />
    <link rel="icon" type="image/png" href="images/favicon.png">
</head>
    
<body>    
    <canvas id="gameCanvas">Your browser is not compatible with this game. Please try a different browser.</canvas>
    <div style="font-size:10px;text-align:center;">enquiries@passwordscramble.com</div>    
    <div id="submit_score" class="popup_content">
    <form id="submit_score_form" method='post'>
        <h2>Record your score</h2>
        <h1><div id="score"></div></h1>
        <p>Initials<br><input id="initials" maxlength="3" size='5' type='text' title='Three initials' required /></p>
        <p>Email address<br><input id="email_address" maxlength="50" size='40' type='email' title='Email address' required /></p>
        <input type='submit' value='Submit' class="myButton" />&nbsp;&nbsp;<input id="no_submit" type='button' value='No thanks' class="myButton" />
    </form>
    </div>
    
    <div id="high_scores_popup" class="popup_content">
        <h2>High Scores</h2>
        <div id="high_score_table"></div>
        <br><input id="close_high_scores" type="button" value="Close" class="myButton" />
    </div>
    
    <div id="fade" class="black_overlay"></div>
    
    <img id="machineImage" src="images/machine.png" alt="Machine" style="display:none;">
    <img id="cloudsImage" src="images/clouds.png" alt="Clouds" style="display:none;">
    <img id="mineCarImage" src="images/mine-car.png" alt="Mine Car" style="display:none;">
    <img id="vanLeftImage" src="images/van-left.png" alt="Comcast Van" style="display:none;">
    <img id="vanRightImage" src="images/van-right.png" alt="Comcast Van" style="display:none;">
    <img id="explosionImage" src="images/explosion.png" alt="Explosion" style="display:none;">
    <img id="lobbyImage" src="images/comcast_center_lobby.jpg" alt="Lobby" style="display:none;">
    <img id="tweetImage" src="images/tweet.png" alt="Tweet" style="display:none;">
    <img id="janiceImage" src="images/janice.png" alt="Janice" style="display:none;">
    <img id="calendarImage" src="images/calendar.png" alt="Calendar" style="display:none;">
    <img id="successkidImage" src="images/successkid.png" alt="Success Kid" style="display:none;">

    <audio id="charCatchSound" preload="auto" controls="false" src="sounds/Pickup_Coin4.wav" style="display:none;" />
    <audio id="charDropSound" preload="auto" controls="false" src="sounds/Powerup3.wav" />
    <audio id="explosionSound" preload="auto" controls="false" src="sounds/Randomize9.wav" />
    <audio id="buzzerSound" preload="auto" controls="false" src="sounds/buzzer.wav" />
    
    <script src="./jquery-1.11.3.min.js"></script>
    <script src="scramble.js"></script>
    <script>
        (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
        (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
        m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
        })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
        ga('create', 'UA-70827568-1', 'auto');
        ga('send', 'pageview');
    </script>
</body>
    
</html>
