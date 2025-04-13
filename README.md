# WatchTower

A modern website monitoring application that helps you track your website uptime and performance in real-time.

Demo Video - [Click here](https://www.loom.com/share/279daec5b1694a21b64c2b2a1c144622?sid=4b702532-ec09-461b-a0c5-9798e14f863a)

## Features

- Real-time Monitoring: Track website status and response times
- Dashboard Interface: Easy-to-use UI to manage monitored sites
- Detailed Analytics: View performance metrics and uptime statistics
- User Authentication: Secure account system for your monitoring data

## Tech Stack

### Frontend

- React
- Tailwind CSS for styling
- Recharts for data visualization
- Vite build system

### Backend

- Express.js REST API
- MongoDB with Mongoose
- JWT authentication
- Node-cron for scheduled monitoring

### DevOps

- Docker and Docker Compose for containerization
- Nginx for serving the frontend

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js (v18 or later) for local development

### Running with Docker

- Clone the repository

```
  git clone https://github.com/amilpa/watchtower.git
  cd watchtower
```

- Start the containers

```
docker-compose up --build
```

The application will be available at:

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Local Development

- Needs local mongoDB server and .env file setup for backend to function
- Install dependencies

```
npm run install:all
```

- Run the development servers

```
npm run dev
```

- Demo Data :
  To seed the database with sample data (update mongo URL in seedscript if not using docker for deployment):

```
cd backend
npm run seed
```

#### Sample login credentials:

- Email: demo@example.com
- Password: amil1234

### Project Structure

```
watchtower/
├── frontend/
│ ├── src/
│ │ ├── components/
│ │ └── pages/
│ └── public/
├── backend/
│ ├── controllers/
│ ├── models/
│ ├── routes/
│ └── middlewares/
└── docker-compose.yml
```

### API Documentation

API endpoints are documented in postman.json

License
ISC
