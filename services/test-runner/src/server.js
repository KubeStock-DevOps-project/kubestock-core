const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const path = require('path');
const { getAccessToken } = require('./auth');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3007;

// Store actively running tests
const runningTests = {};

app.get('/health', (req, res) => {
    res.json({ status: 'UP', service: 'test-runner' });
});

app.post('/api/tests/run', async (req, res) => {
    const { testType = 'smoke', vus = 1, duration = '5s', targetUrl } = req.body;

    // Validate test type
    const scriptPath = path.join(__dirname, 'k6', `${testType}.js`);

    // Determine Base URL
    const baseUrl = targetUrl || process.env.GATEWAY_URL || 'http://host.docker.internal:5173';

    // Get Auth Token
    let accessToken = '';
    try {
        accessToken = await getAccessToken() || '';
    } catch (err) {
        return res.status(500).json({ error: 'Authentication failed', details: err.message });
    }

    // Construct k6 command
    // Pass params via environment variables to k6
    const cmd = `k6 run --vus ${vus} --duration ${duration} -e BASE_URL=${baseUrl} -e ACCESS_TOKEN=${accessToken} ${scriptPath}`;

    console.log(`🚀 Starting Test: ${cmd}`);

    const testId = Date.now().toString();
    runningTests[testId] = {
        id: testId,
        status: 'running',
        startTime: new Date(),
        logs: [],
        cmd
    };

    // Execute k6
    const child = exec(cmd);

    child.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
            if (line.trim()) runningTests[testId].logs.push(line);
        });
    });

    child.stderr.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
            if (line.trim()) runningTests[testId].logs.push(`[stderr] ${line}`);
        });
    });

    child.on('close', (code) => {
        console.log(`🏁 Test ${testId} completed with code ${code}`);
        runningTests[testId].status = code === 0 ? 'completed' : 'failed';
        runningTests[testId].exitCode = code;
        runningTests[testId].endTime = new Date();
    });

    res.json({
        message: 'Test started',
        testId,
        config: { testType, vus, duration, baseUrl }
    });
});

app.get('/api/tests/:id/status', (req, res) => {
    const test = runningTests[req.params.id];
    if (!test) {
        return res.status(404).json({ error: 'Test not found' });
    }
    res.json({
        id: test.id,
        status: test.status,
        exitCode: test.exitCode,
        startTime: test.startTime,
        endTime: test.endTime
    });
});

app.get('/api/tests/:id/logs', (req, res) => {
    const test = runningTests[req.params.id];
    if (!test) {
        return res.status(404).json({ error: 'Test not found' });
    }
    res.json({
        id: test.id,
        logs: test.logs
    });
});

app.listen(PORT, () => {
    console.log(`✅ Test Runner Service listening on port ${PORT}`);
});
