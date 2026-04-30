const request = require('supertest');
const express = require('express');

// Mock Auth Middleware
jest.mock('../src/middleware/auth', () => ({
    requireAuth: (req, res, next) => next(),
}));

// Mock Socket Service
const socketService = require('../src/services/socket.service');
jest.mock('../src/services/socket.service', () => ({
    emitClinicalAlert: jest.fn(),
    emitNewOrder: jest.fn()
}));

// Mock PostgreSQL Pool
const { pool } = require('../../db_postgres'); // Note: The path depends on where it is, let's mock the whole pg
jest.mock('pg', () => {
    const mPool = {
        query: jest.fn()
    };
    return { Pool: jest.fn(() => mPool) };
});

// Since the app uses dotenv and complex DB, it's easier to just mock the routes directly with an Express wrapper
const nursingRoutes = require('../src/routes/nursing.routes');
const app = express();
app.use(express.json());
app.use(nursingRoutes);

describe('Nursing Execution Loop API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('PATCH /api/nursing/tasks/:id/status should emit clinical_alert on Completion', async () => {
        // Mock DB query to return the updated task
        const requirePg = require('pg');
        const poolInst = new requirePg.Pool();
        poolInst.query.mockResolvedValueOnce({
            rows: [{
                task_id: 1,
                patient_id: 42,
                task_name: 'Troponin Draw',
                status: 'Completed'
            }]
        });

        const res = await request(app)
            .patch('/api/nursing/tasks/1/status')
            .send({ status: 'Completed' });

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.task.status).toBe('Completed');

        // Check if Socket.io emitted to the doctor
        expect(socketService.emitClinicalAlert).toHaveBeenCalledTimes(1);
        expect(socketService.emitClinicalAlert).toHaveBeenCalledWith(42, expect.objectContaining({
            type: 'success',
            text: expect.stringContaining('تم إنجاز المهمة')
        }));
    });
});
