const express = require('express')
const app = express();
const cors = require('cors');
app.use(express.json());
const bodyParser = require('body-parser');
const path = require('path');

// ✅ Allow requests from your frontend
// app.use(cors({
//     origin: 'http://localhost:5174',  // Change this to match your frontend URL
//     credentials: true                 // Allow cookies and authentication headers
// }));

// OR allow all origins (for development only)
app.use(cors());

// Setup Environment Settings
require('dotenv').config({ path: path.join(__dirname, '.env') });

// DataBase
const connectDB = require('./config/dbConnection');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ limit: "50mb", extended: false }));

// parse application/json
app.use(bodyParser.json({ limit: "50mb" }));

// Routes
const usersRoutes = require('./routes/usersRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const authenticateUser = require('./middlewares/authentication');
const roleRoutes = require('./routes/roleRoutes');
const leaveRoutes = require('./routes/leaveRoutes');

// API Call
app.use('/user', usersRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/role', roleRoutes);
app.use('/leave', leaveRoutes);


const startApplication = async () => {
    try {
        await connectDB(process.env.mongoDbUrl);
        const port = process.env.PORT || 5000;
        app.listen(port, () => {
            console.log(`Server is running at http://localhost:${port}`);
        });
    } catch (error) {
        console.error("Error While Connecting The Application: ", error);
    }
};

startApplication();