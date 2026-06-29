# Fulbito Backend API

Backend application for "Fulbito", built with Node.js, Express, and MongoDB. The API provides endpoints to manage football (soccer) matches, players, and in-game events like goals, yellow cards, and red cards.
## Integrantes. 
* Leonel Alejandro Torres Pérez
* Santiago Ronaldo Chavez Piñón
* César Fernando González Ávalos

## Grupo
* GIDS6093

## Objetivo
* Crear una aplicación para el sistema operativo wearOS el cuál sea capaz de hacer el registro de goles, tarjetas amarillas y rojas dentro de un partido de fútbol

##  Technologies

*   **Node.js**: JavaScript runtime environment.
*   **Express.js**: Web framework for Node.js.
*   **MongoDB**: NoSQL database used to store application data.
*   **Mongoose**: Object Data Modeling (ODM) library for MongoDB and Node.js.
*   **dotenv**: Module to load environment variables from a `.env` file.
*   **cors**: Middleware to enable Cross-Origin Resource Sharing.

##  Prerequisites

Before running this project, make sure you have installed:
*   [Node.js](https://nodejs.org/)
*   [MongoDB](https://www.mongodb.com/) (Local or Atlas)

##  Installation & Setup

1. **Clone the repository** (if applicable):
   ```bash
   git clone <repository_url>
   cd fulbito-backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root of the project with the following structure:
   ```env
   PORT=3000
   MONGODB_URI=your_mongodb_connection_string
   ```

4. **Run the server**:
   *   For development (uses `nodemon` for hot-reloading):
       ```bash
       npm run dev
       ```
   *   For production:
       ```bash
       npm start
       ```

##  API Endpoints

###  Matches (`/api/matches`)
*   `GET /`: Retrieve all matches.
*   `GET /:id`: Retrieve details of a specific match.
*   `POST /`: Create a new match.
*   `PUT /:id`: Update the status of a match.
*   `POST /events`: Register an event within a match.

###  Players (`/api/players`)
*   `GET /match/:matchId`: Retrieve players associated with a specific match.
*   `POST /`: Create a single player.
*   `POST /bulk`: Create multiple players at once.
*   `POST /sync`: Sync a manual player entry.
*   `PUT /:id`: Update player details.
*   `DELETE /:id`: Delete a player.

###  Events (`/api/events`)
*   `GET /match/:matchId`: Retrieve the event history (goals, cards) of a specific match.
*   `POST /`: Register a new event (Goal, Yellow Card, Red Card).
*   `PUT /:id`: Update an event (e.g., correct a player's dorsal number).
*   `DELETE /:id`: Delete an event (e.g., annul a goal and update the score).

##  Database Models

*   **Match**: Contains match information, home/away scores, and match status.
*   **Player**: Contains player information, including their dorsal, team assignment, and associated match.
*   **Event**: Records in-game actions (`GOAL`, `YELLOW_CARD`, `RED_CARD`) linked to a match and a specific player.
