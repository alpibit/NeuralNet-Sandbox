<?php

header('Access-Control-Allow-Origin: *');
require_once '../../config/database.php';
require_once '../../src/classes/Database.php';
require_once '../../src/classes/NeuralNetworkState.php';

$db = new Database();
$conn = $db->connect();

$nnState = new NeuralNetworkState($conn);
$stateRecords = $nnState->loadState();

if (!empty($stateRecords)) {
    $formattedState = [
        'weights' => [],
        'biases' => []
    ];

    foreach ($stateRecords as $record) {
        if ($record['type'] == 'weight') {
            $formattedState['weights'][$record['layer']] = json_decode($record['data'], true);
        } elseif ($record['type'] == 'bias') {
            $formattedState['biases'][$record['layer']] = json_decode($record['data'], true);
        }
    }

    header('Content-Type: application/json');
    echo json_encode($formattedState);
} else {
    http_response_code(404);
    echo json_encode(['message' => 'No state found']);
}
