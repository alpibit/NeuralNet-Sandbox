# NeuralNet-Sandbox

NeuralNet-Sandbox is an interactive neural network simulation environment where you can observe and experiment with reinforcement learning in real-time. The project demonstrates how neural networks can be used to teach an AI agent to navigate environments, avoid obstacles, and perform goal-oriented tasks.

## Project Overview

This project implements a complete reinforcement learning system from scratch using pure JavaScript and PHP. You can watch as an AI-controlled entity learns to:

- Navigate through a complex environment
- Avoid obstacles using sensor data
- Locate and "farm" beacon resources
- Develop increasingly efficient pathfinding strategies
- Adapt to changing environments

## Key Features

### Neural Network Implementation
- Custom-built neural network with configurable layer architecture
- Supports both feedforward and backpropagation algorithms
- Multiple activation functions (ReLU, sigmoid)
- No external ML libraries - built from first principles!

### Reinforcement Learning System
- Reward-based learning with positive reinforcement for:
  - Successfully reaching beacons
  - Efficient navigation
  - Environmental exploration
- Negative reinforcement for:
  - Collisions with walls
  - Repetitive behavior
  - Staying stationary
- Epsilon-greedy exploration strategy that adapts based on performance

### Sensor and Decision Systems
- Simulated sensors that detect walls and beacons at various distances
- Neural network-based decision making with confidence visualization
- Entity control system that translates decisions into movement

### Persistence and Analysis
- Ability to save and load neural network states
- Performance metrics tracking (collisions, beacons reached, rewards)
- Real-time visualization of AI decision-making process

### Interactive Simulation Environment
- Real-time 2D canvas-based visualization
- Dynamic beacon placement for continuous learning challenges
- Manual control option for comparison with AI behavior

## Technical Implementation

The project is built using:
- Frontend: Pure JavaScript with HTML5 Canvas for rendering
- Backend: PHP for state persistence
- Database: MySQL for storing neural network weights and performance metrics

## Learning Process

The entity learns through a process of trial and error:

1. It starts with random movements and exploration
2. Receives rewards when successfully finding and "farming" beacons
3. Experiences penalties when colliding with walls or exhibiting unproductive behavior
4. Gradually improves pathfinding and obstacle avoidance through neural network training
5. Adapts to environmental changes as beacons relocate

## Installation

### Prerequisites:
- PHP (version 8.2 or higher) and MySQL server
- Web server (Apache, Nginx, etc.)
- Git for version control

### Database Setup:
1. Create a MySQL database for the project
2. Run the provided install.php script by navigating to /install/install.php in your web browser
3. Enter your database credentials when prompted

### Launch the Application:
- Access the project in your web browser through your local server

## Usage

Once launched, you'll see the simulation canvas with:
- The AI-controlled entity (with visible sensors)
- Beacons that relocate after being "farmed"
- Real-time metrics displaying neural network performance
- Decision confidence visualization

You can also use the arrow keys to manually control the entity for comparison.

## Contributing

Contributions are welcome! Feel free to fork this project and experiment with:
- Different neural network architectures
- Alternative reward strategies
- New environmental challenges
- Performance optimizations

## License

NeuralNet-Sandbox is open-sourced under the MIT License. See the `LICENSE` file for more details.

## Future Plans

- Enhanced reinforcement learning algorithms
- More complex environments and challenges
- Multi-agent interaction scenarios
- Improved visualization and analysis tools