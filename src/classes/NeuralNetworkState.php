<?php

class NeuralNetworkState
{
    private $conn;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    public function saveState($layer, $type, $data)
    {
        error_log("Attempting to save state: layer=$layer, type=$type");
        $query = "INSERT INTO neural_network_state (layer, type, data) VALUES (:layer, :type, :data)";
        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(':layer', $layer);
        $stmt->bindParam(':type', $type);
        $stmt->bindParam(':data', $data);

        try {
            $result = $stmt->execute();
            error_log("Query executed. Result: " . ($result ? "true" : "false"));
            return $result;
        } catch (PDOException $e) {
            error_log("Database error: " . $e->getMessage());
            return false;
        }
    }

    public function loadState()
    {
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
