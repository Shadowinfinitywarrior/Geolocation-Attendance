const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

// Create the uploads folder if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Set up multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // Directory to save uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Use timestamp to avoid name collision
    }
});

const upload = multer({ storage: storage });

// Middleware to parse JSON requests
app.use(bodyParser.json());
app.use(express.static('public'));

// Store server details and generated code
let serverDetails = {
    latitude: null,
    longitude: null,
    code: null
};

// Store attendance logs
let attendanceLogs = [];  // Store attendance logs

// Generate a random 6-digit code
function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Endpoint to start the server
app.post('/start-server', (req, res) => {
    const { eventName, latitude, longitude, range } = req.body;
    const code = generateCode();
    serverDetails = { eventName, latitude, longitude, range, code };

    console.log(`Server started with code: ${code} at latitude: ${latitude}, longitude: ${longitude}, range: ${range}`);
    res.json({ code });  // Send the generated code to the client
});

// Endpoint to mark attendance based on code and geolocation
app.post('/mark-attendance', upload.single('photo'), (req, res) => {
    const { name, position, code, latitude, longitude } = req.body;

    // Check if the code matches the server's code
    if (code === serverDetails.code) {
        // Save the uploaded photo's path
        const photoPath = req.file ? req.file.path : 'No photo uploaded';

        // Create a log entry
        const timestamp = new Date().toLocaleString();
        const logEntry = { name, position, timestamp, latitude, longitude, photoPath };
        attendanceLogs.push(logEntry);  // Save the log entry to the array

        console.log(`Attendance marked for ${name} (${position})`);
        console.log(`Photo saved at: ${photoPath}`);
        console.log(`Location: Latitude: ${latitude}, Longitude: ${longitude}`);

        res.json({ message: "Attendance successfully marked!", logEntry });
    } else {
        res.json({ message: "Invalid code. Attendance not marked." });
    }
});

// Endpoint to get attendance logs
app.get('/attendance-logs', (req, res) => {
    console.log("Logs being fetched:", attendanceLogs);  // Check if logs are fetched correctly
    res.json({ logs: attendanceLogs });
});

// Endpoint to clear the attendance logs
app.post('/clear-logs', (req, res) => {
    attendanceLogs = [];  // Clear the attendance logs
    console.log('Attendance logs have been cleared.');
    res.json({ success: true });  // Respond with success
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
