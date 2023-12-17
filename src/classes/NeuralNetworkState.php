<?php

class NeuralNetworkState
{
    private $conn;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    // Function to save the state of the neural network
    public function saveState($layer, $type, $data)
    {
        $query = "INSERT INTO neural_network_state (layer, type, data) VALUES (:layer, :type, :data)";
        $stmt = $this->conn->prepare($query);

        $jsonData = json_encode($data); // Assign to a variable

        $stmt->bindParam(':layer', $layer);
        $stmt->bindParam(':type', $type);
        $stmt->bindParam(':data', $jsonData); // Bind the variable

        if ($stmt->execute()) {
            return true;
        } else {
            return false;
        }
    }

    // Function to load the most recent state of the neural network
    public function loadState()
    {
        // Query to select the latest record for each layer and type
        $query = "SELECT * FROM (
                    SELECT *, ROW_NUMBER() OVER (PARTITION BY layer, type ORDER BY id DESC) as rn 
                    FROM neural_network_state
                  ) as sub
                  WHERE rn = 1";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        $results = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $results[] = $row;
        }

        return $results;
    }
}
?>
