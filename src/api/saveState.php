<?php

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

require_once '../../config/database.php';
require_once '../../src/classes/Database.php';
require_once '../../src/classes/NeuralNetworkState.php';

error_log("saveState.php script started");

// Assuming you have a PDO connection set up in your database.php
$db = new Database();
$conn = $db->connect();

$nnState = new NeuralNetworkState($conn);

// Check if the request is POST
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    error_log("Received POST request");
    $data = json_decode(file_get_contents("php://input"), true);
    error_log("Received data: " . print_r($data, true));

    if (isset($data['layer'], $data['type'], $data['data'])) {
        error_log("Data is valid, attempting to save state");
        $result = $nnState->saveState($data['layer'], $data['type'], $data['data']);

        if ($result) {
            error_log("State saved successfully");
            echo json_encode(['message' => 'State saved successfully']);
        } else {
            error_log("Error saving state");
            http_response_code(500);
            echo json_encode(['message' => 'Error saving state']);
        }
    } else {
        error_log("Invalid input data");
        http_response_code(400);
        echo json_encode(['message' => 'Invalid input']);
    }
} else {
    error_log("Method not allowed: " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
}

error_log("saveState.php script ended");
