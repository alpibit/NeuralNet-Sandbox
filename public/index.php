<?php
define('ACCESS_ALLOWED', true);
include 'public/templates/header.php';
?>

<main>
    <h2>Welcome to the Entity Simulation App</h2>
    <p>This is the main page of your simulation application.</p>

    <canvas id="simulationCanvas" width="1000" height="1000">
        Your browser does not support the canvas element.
    </canvas>

    <div id="aiMetrics">
        <h3>AI Metrics</h3>
        <pre id="metricsData">Loading metrics...</pre>
    </div>
    <div id="aiState">
        <h3>AI State</h3>
        <pre id="stateData">Loading state...</pre>
    </div>


</main>
<?php
include 'public/templates/footer.php';
?>