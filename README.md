# WorkSync — AI Team Work Planner
A full-stack web application for project management and team collaboration, enhanced with AI features powered by the Gemini API.

## 📋 Prerequisites
Before running this application, make sure you have the following installed:
-   [Node.js](https://nodejs.org/) (version 14.x or higher)
-   [npm](https://www.npmjs.com/) (comes with Node.js)
-   [MongoDB Atlas](https://www.mongodb.com/atlas) account (or local MongoDB installation)
-   [Git](https://git-scm.com/)
-   [Google AI Studio](https://aistudio.google.com/) account for a Gemini API Key
-   [PM2](https://pm2.keymetrics.io/) (for production deployment)

---

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone -b API https://github.com/ryu49th/i2cedt_project.git
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

---

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
GEMINI_API_KEY=your_gemini_api_key
NODE_ENV=production
PORT=3000
```

**⚠️ Important Security Notes:**
- Replace the placeholders with your actual credentials and API key.
- **Never** commit the `.env` file to version control.
- Ensure `.env` is listed in your `.gitignore` file.

---

### Getting Your API Keys & Connection String

#### MongoDB Atlas Setup
1. Create a [MongoDB Atlas](https://www.mongodb.com/atlas) account.
2. Create a new cluster.
3. Create a database user with read/write permissions.
4. Get your connection string from the "Connect" button.
5. Replace the placeholder `MONGO_URI` value in your `.env` file with this string.

#### Gemini API Key Setup
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Click on the "**Get API key**" button.
4. Click "**Create API key in new project**".
5. Copy the generated API key.
6. Paste it as the value for `GEMINI_API_KEY` in your `.env` file.

---

## 🎯 Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```
The backend server will start on `http://localhost:3000`.

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```
The frontend will start on `http://localhost:3001` (or the next available port).

---

## 🚀 Production Deployment with PM2

### Install PM2 and Start Applications
```bash
npm install -g pm2

cd backend
pm2 start npm --name backend -- run start

cd ../frontend
pm2 start npm --name frontend -- run start
```

### Basic PM2 Commands
```bash
# View running processes
pm2 list

# View logs
pm2 logs

# Restart applications
pm2 restart backend
pm2 restart frontend

# Stop applications
pm2 stop backend
pm2 stop frontend
```

---

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
