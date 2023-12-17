<?php

header('Access-Control-Allow-Origin: *');

require_once '../../config/database.php';
require_once '../../src/classes/Database.php';
require_once '../../src/classes/NeuralNetworkState.php';

// Assuming you have a PDO connection set up in your database.php
$db = new Database();
$conn = $db->connect();

$nnState = new NeuralNetworkState($conn);

// Check if the request is POST
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    if (isset($data['layer'], $data['type'], $data['data'])) {
        $result = $nnState->saveState($data['layer'], $data['type'], $data['data']);

        if ($result) {
            echo json_encode(['message' => 'State saved successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Error saving state']);
        }
    } else {
        http_response_code(400);
        echo json_encode(['message' => 'Invalid input']);
    }
} else {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
}
