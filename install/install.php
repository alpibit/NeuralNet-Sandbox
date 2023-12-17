<?php

function setupTables($conn)
{
    // Create table for Neural Network State
    $neuralNetworkStateSQL = "
        CREATE TABLE neural_network_state (
            id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
            layer INT(11) NOT NULL,
            type ENUM('weight', 'bias') NOT NULL,
            data TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    ";

    // Create table for Monitoring Metrics
    $performanceMetricsSQL = "
        CREATE TABLE performance_metrics (
            id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
            metric_name VARCHAR(100) NOT NULL,
            value FLOAT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    ";

    // Create table for Entity Logs
    $entityLogsSQL = "
        CREATE TABLE entity_logs (
            id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
            log_type VARCHAR(100) NOT NULL,
            message TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    ";

    // Create table for Configuration Parameters
    $configParametersSQL = "
        CREATE TABLE config_parameters (
            id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
            parameter_name VARCHAR(100) NOT NULL,
            value TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    ";

    // Execute the SQL statements
    $conn->exec($neuralNetworkStateSQL);
    $conn->exec($performanceMetricsSQL);
    $conn->exec($entityLogsSQL);
    $conn->exec($configParametersSQL);
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $host = $_POST['db_host'];
    $dbName = $_POST['db_name'];
    $user = $_POST['db_user'];
    $pass = $_POST['db_pass'];

    // Prepare the database configuration content
    $configContent = "<?php\n\n";
    $configContent .= "define('DB_HOST', '{$host}');\n";
    $configContent .= "define('DB_NAME', '{$dbName}');\n";
    $configContent .= "define('DB_USER', '{$user}');\n";
    $configContent .= "define('DB_PASS', '{$pass}');\n";
    $configContent .= "?>";

    try {
        // Write the configuration to 'database.php'
        file_put_contents('../config/database.php', $configContent);

        // Require the newly created configuration file
        require '../config/database.php';

        // Connect to the database using the new configuration
        $conn = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Setup tables
        setupTables($conn);

        echo "Installation successful! The database and tables for the entity simulation have been created.";
    } catch (PDOException $e) {
        echo "Connection failed: " . $e->getMessage();
    }
} else {
?>
    <form method="post">
        DB Host: <input type="text" name="db_host" required><br>
        DB Name: <input type="text" name="db_name" required><br>
        DB User: <input type="text" name="db_user" required><br>
        DB Password: <input type="password" name="db_pass" required><br>
        <input type="submit" value="Install">
    </form>
<?php
}
