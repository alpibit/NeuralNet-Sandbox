<?php

class Database
{
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $conn;

    // Constructor to initialize connection details
    public function __construct($host = DB_HOST, $db_name = DB_NAME, $username = DB_USER, $password = DB_PASS)
    {
        $this->host = $host;
        $this->db_name = $db_name;
        $this->username = $username;
        $this->password = $password;
    }

    // Connect to the database and return the connection
    public function connect()
    {
        $this->conn = null;

        try {
            $dsn = 'mysql:host=' . $this->host . ';dbname=' . $this->db_name . ';charset=utf8mb4';
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];

            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
        } catch (PDOException $e) {
            error_log('Database Connection Error: ' . $e->getMessage());
            die('Failed to connect to the database. Please check the connection details.');
        }

        return $this->conn;
    }
}
