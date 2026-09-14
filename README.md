Smart University Campus Security System
1. Project Overview

A microservices-based security system for monitoring a university campus.
The system simulates sensors and detects security-related events such as fire, water leaks, and sensor failures.

2. Architecture

The system follows a microservices architecture with asynchronous communication through RabbitMQ.
MongoDB is used for persistent storage, while the Web API connects the backend services with the Web UI.

3. Microservices

The system consists of Sensor Simulator, Sensor Ingestion, Fire Detection, Water Leak Detection, Alarm Service, Status Service, Web API, and Web UI.
Each service is responsible for a specific function of the security system.

4. Technologies
Node.js
JavaScript
MongoDB
RabbitMQ
Docker
Kubernetes
HTML, CSS, JavaScript
AdminLTE
5. How to Run the System

Clone the repository and navigate to the infrastructure directory.
Run the system with Docker Compose using:

docker compose up -d --build
6. Docker Deployment

All services are containerized using Docker.
Docker Compose is used to build, configure, network, and run the complete system.

7. Kubernetes Deployment

Kubernetes can be used as an alternative deployment platform for the system.
It provides container orchestration, service management, scaling, and improved fault tolerance.

8. Repository Structure

The repository is organized into separate directories for services and infrastructure.
Each microservice contains its own source code and Docker configuration.

9. Thesis Context

This project was developed as part of an undergraduate thesis on smart university campus security.
The thesis studies microservices, containerization, asynchronous communication, and scalable system architectures.