/**
 * Socket.io Real-time Notification Service
 * Replaces HTTP polling for alerts, notifications, and live updates
 */
const { Server } = require('socket.io');
const { pool } = require('../../db_postgres');

let io = null;
const connectedUsers = new Map(); // userId → Set of socket IDs

function setupSocketIO(httpServer) {
    io = new Server(httpServer, {
        cors: { origin: '*', methods: ['GET', 'POST'] },
        pingInterval: 25000,
        pingTimeout: 20000
    });

    io.on('connection', (socket) => {
        console.log(`  🔌 Socket connected: ${socket.id}`);

        // Authenticate socket with userId
        socket.on('auth', (userId) => {
            socket.userId = userId;
            if (!connectedUsers.has(userId)) connectedUsers.set(userId, new Set());
            connectedUsers.get(userId).add(socket.id);
            socket.join(`user:${userId}`);
            socket.join('all-staff');
            console.log(`  👤 User ${userId} linked to socket ${socket.id}`);
        });

        // Join patient room (for patient-specific updates)
        socket.on('watch-patient', (patientId) => {
            socket.join(`patient:${patientId}`);
        });

        // Leave patient room
        socket.on('unwatch-patient', (patientId) => {
            socket.leave(`patient:${patientId}`);
        });

        // Join department room
        socket.on('join-department', (dept) => {
            socket.join(`dept:${dept}`);
        });

        socket.on('disconnect', () => {
            if (socket.userId && connectedUsers.has(socket.userId)) {
                connectedUsers.get(socket.userId).delete(socket.id);
                if (connectedUsers.get(socket.userId).size === 0) {
                    connectedUsers.delete(socket.userId);
                }
            }
        });
    });

    console.log(`  🔌 Socket.io: Real-time notifications active`);
    return io;
}

// ===== Emit Functions (called from route handlers) =====

/**
 * Send a clinical alert to all staff watching a patient
 */
function emitClinicalAlert(patientId, alert) {
    if (!io) return;
    io.to(`patient:${patientId}`).emit('clinical-alert', alert);
    io.to('all-staff').emit('clinical-alert', alert);
}

/**
 * Send a Critical System Alert (Glassmorphism Overlay)
 */
function sendCriticalAlert(alertData) {
    if (!io) return;
    const payload = {
        type: 'CRITICAL_ALERT',
        priority: alertData.priority || 'RED',
        timestamp: new Date(),
        patientId: alertData.patientId || 'N/A',
        patientName: alertData.patientName || 'مريض غير مسجل',
        location: alertData.location || 'ER / Ward',
        message: alertData.message,
        actionRequired: alertData.actionRequired || 'التدخل الفوري'
    };
    io.emit('system_critical_notification', payload);
}

/**
 * Send notification to a specific user
 */
function emitToUser(userId, event, data) {
    if (!io) return;
    io.to(`user:${userId}`).emit(event, data);
}

/**
 * Broadcast to a department
 */
function emitToDepartment(dept, event, data) {
    if (!io) return;
    io.to(`dept:${dept}`).emit(event, data);
}

/**
 * Broadcast to all connected users
 */
function emitToAll(event, data) {
    if (!io) return;
    io.to('all-staff').emit(event, data);
}

/**
 * Notify about new lab result
 */
function emitLabResult(patientId, result) {
    if (!io) return;
    io.to(`patient:${patientId}`).emit('lab-result', result);
    emitToDepartment('Laboratory', 'lab-result', result);
}

/**
 * Notify about appointment updates
 */
function emitAppointmentUpdate(appointment) {
    if (!io) return;
    emitToDepartment('Reception', 'appointment-update', appointment);
    if (appointment.doctor_id) emitToUser(appointment.doctor_id, 'appointment-update', appointment);
}

/**
 * Notify about new order
 */
function emitNewOrder(order) {
    if (!io) return;
    const dept = order.item_type === 'lab' ? 'Laboratory' : order.item_type === 'med' ? 'Pharmacy' : 'Nursing';
    emitToDepartment(dept, 'new-order', order);
    io.to(`patient:${order.patient_id}`).emit('new-order', order);
}

/**
 * Get online user count
 */
function getOnlineCount() {
    return connectedUsers.size;
}

module.exports = {
    setupSocketIO,
    emitClinicalAlert,
    sendCriticalAlert,
    emitToUser,
    emitToDepartment,
    emitToAll,
    emitLabResult,
    emitAppointmentUpdate,
    emitNewOrder,
    getOnlineCount
};
