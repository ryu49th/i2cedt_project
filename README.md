# WorkSync — AI Team Work Planner

A full-stack web application for project management and team collaboration

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (version 14.x or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [MongoDB Atlas](https://www.mongodb.com/atlas) account (or local MongoDB installation)
- [Git](https://git-scm.com/)

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/ryu49th/i2cedt_project.git
cd i2cedt_project
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install backend dependencies:

```bash
npm install
```

### 3. Frontend Setup

Navigate to the frontend directory:

```bash
cd ../frontend
```

Install frontend dependencies:

```bash
npm install
```

## 🔐 Environment Variables

### Backend Environment Setup

Create a `.env` file in the `backend` directory:

```bash
cd backend
touch .env
```

Add the following environment variables to your `.env` file:

```env
MONGO_URI=mongodb+srv://your_username:your_password@cluster0.xxxxx.mongodb.net/your_database_name?retryWrites=true&w=majority&appName=Cluster0
```

**⚠️ Important Security Notes:**
- Replace the MongoDB URI with your actual credentials
- Never commit the `.env` file to version control
- Add `.env` to your `.gitignore` file

### MongoDB Atlas Setup

1. Create a [MongoDB Atlas](https://www.mongodb.com/atlas) account
2. Create a new cluster
3. Create a database user with read/write permissions
4. Get your connection string from the "Connect" button
5. Replace the placeholder values in your `.env` file

## 🎯 Running the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```
The backend server will start on `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```
The frontend will start on `http://localhost:3001` (or next available port)


## 📁 Project Structure

```
i2cedt_project/
├── backend/
│   ├── src/
│   │   └── server.js
│   ├── .env
│   ├── package.json
│   └── node_modules/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── node_modules/
├── README.md
└── .gitignore
```
