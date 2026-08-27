import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Enable CORS and body parsers (JSON, urlencoded, and raw text fallback)
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.text({ limit: '50mb', type: '*/*' }));

// Middleware to parse body if received as text
app.use((req, res, next) => {
  if (typeof req.body === 'string' && req.body.trim().startsWith('{')) {
    try {
      req.body = JSON.parse(req.body);
    } catch {
      // ignore
    }
  }
  next();
});

// In-memory data storage
let gpsConfig = {
  lat: 0,
  lng: 0,
  radius: 0 // 0 means no restriction by default
};

const knownFaces = [];
const attendanceLogs = [];

// API Router
app.get('/api', (req, res) => {
  const action = req.query.action;
  if (action === 'getConfig') {
    return res.json(gpsConfig);
  }
  if (action === 'getKnownFaces') {
    return res.json(knownFaces);
  }
  if (action === 'getAttendanceLogs') {
    return res.json(attendanceLogs);
  }
  return res.json({ error: 'Unknown action: ' + action });
});

app.post('/api', (req, res) => {
  const data = typeof req.body === 'object' && req.body !== null ? req.body : {};
  const action = data.action;

  if (action === 'registerUser') {
    const { name, faceDescriptor } = data;
    if (!name || !faceDescriptor) {
      return res.status(400).json({ error: 'Missing name or faceDescriptor' });
    }
    knownFaces.push({
      label: name,
      descriptor: faceDescriptor,
      createdAt: new Date().toISOString()
    });
    return res.json({ success: true, message: 'บันทึกข้อมูลหน้าเรียบร้อย' });
  }

  if (action === 'logAttendance') {
    const { name, lat, lng } = data;
    const now = new Date();
    const mapLink = (lat && lng) ? `https://www.google.com/maps?q=${lat},${lng}` : '';
    const dateStr = now.toLocaleDateString('th-TH');
    const timeStr = now.toLocaleTimeString('th-TH');

    const logEntry = {
      name,
      time: timeStr,
      date: dateStr,
      lat: lat || '-',
      lng: lng || '-',
      mapLink,
      timestamp: now.toISOString()
    };
    attendanceLogs.push(logEntry);
    console.log(`[Attendance] ${name} logged at ${timeStr} ${dateStr}`);
    return res.json({ success: true, message: 'บันทึกเวลาสำเร็จ' });
  }

  if (action === 'saveConfig') {
    const { lat, lng, radius } = data;
    gpsConfig = {
      lat: parseFloat(lat) || 0,
      lng: parseFloat(lng) || 0,
      radius: parseFloat(radius) || 0
    };
    return res.json({ success: true, message: 'บันทึกการตั้งค่าเรียบร้อย' });
  }

  return res.status(400).json({ error: 'Unknown action: ' + action });
});

// Serve static assets from root directory
app.use(express.static(__dirname));

// Fallback for HTML5 navigation
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Face Recognition & GPS Attendance server running on http://0.0.0.0:${PORT}`);
});
