import prisma from '../config/prisma.js';
import logger from '../utils/logger.js';

export const INCIDENT_SEVERITY = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
};

export const INCIDENT_STATUS = {
  INVESTIGATING: 'INVESTIGATING',
  IDENTIFIED: 'IDENTIFIED',
  MONITORING: 'MONITORING',
  RESOLVED: 'RESOLVED',
};

const sanitizeLogData = (data) => {
  if (!data) return null;
  if (typeof data === 'string') {
    return data.replace(/(password|token|secret|key|bearer)=[^&\s]+/gi, '$1=[REDACTED]');
  }
  if (typeof data !== 'object') return data;

  const forbidden = [
    'password', 'passwordHash', 'token', 'refreshToken', 'secret',
    'adminSecret', 'content', 'body', 'message', 'voiceDuration',
    'document', 'identityDocument', 'smtp'
  ];

  const sanitized = {};
  for (const [k, v] of Object.entries(data)) {
    if (forbidden.some(f => k.toLowerCase().includes(f.toLowerCase()))) {
      sanitized[k] = '[REDACTED]';
    } else if (typeof v === 'object' && v !== null) {
      sanitized[k] = sanitizeLogData(v);
    } else {
      sanitized[k] = v;
    }
  }
  return sanitized;
};

export const incidentService = {
  INCIDENT_SEVERITY,
  INCIDENT_STATUS,

  /**
   * Structured error recorder. Stores error safely and escalates to incident if critical.
   */
  recordError: async ({
    severity = 'ERROR',
    component,
    category,
    message,
    correlationId = null,
    metadata = null,
  }) => {
    try {
      const cleanMessage = sanitizeLogData(message);
      const cleanMeta = sanitizeLogData(metadata);

      const errorLog = await prisma.systemErrorLog.create({
        data: {
          severity: severity.toUpperCase(),
          component: component.toUpperCase(),
          category: category.toUpperCase(),
          message: cleanMessage,
          correlationId,
          metadata: cleanMeta || undefined,
        },
      });

      // Automatic incident escalation for CRITICAL or FATAL errors (e.g. Database failure, Storage failure)
      if (severity === 'CRITICAL' || severity === 'FATAL') {
        await incidentService.autoEscalateIncident({
          title: `[AUTOMATED ALERT] ${component} Failure: ${category}`,
          description: cleanMessage,
          severity: INCIDENT_SEVERITY.CRITICAL,
          component,
          errorCategory: category,
          correlationId,
        });
      }

      return errorLog;
    } catch (err) {
      logger.error(`[INCIDENT_SERVICE_ERROR] Failed to record structured error: ${err.message}`);
      return null;
    }
  },

  /**
   * Automatically creates or updates an incident for critical failures
   */
  autoEscalateIncident: async ({
    title,
    description,
    severity = INCIDENT_SEVERITY.HIGH,
    component,
    errorCategory,
    correlationId,
  }) => {
    try {
      // Check if an open incident for this component already exists
      const existing = await prisma.systemIncident.findFirst({
        where: {
          component: component.toUpperCase(),
          status: { in: ['INVESTIGATING', 'IDENTIFIED', 'MONITORING'] },
        },
      });

      if (existing) {
        // Append audit log to existing open incident
        await prisma.incidentAuditLog.create({
          data: {
            incidentId: existing.id,
            adminId: 'system_monitor',
            adminName: 'SRE Automated Monitor',
            action: 'RECURRING_ERROR',
            details: `Additional error observed in ${component}: ${description}`,
          },
        });
        return existing;
      }

      const incident = await prisma.systemIncident.create({
        data: {
          title,
          description,
          severity,
          component: component.toUpperCase(),
          errorCategory: errorCategory?.toUpperCase(),
          correlationId,
          status: INCIDENT_STATUS.INVESTIGATING,
          auditLogs: {
            create: {
              adminId: 'system_monitor',
              adminName: 'SRE Automated Monitor',
              action: 'CREATED',
              details: `Automated incident triggered by ${component} anomaly: ${description}`,
            },
          },
        },
      });

      logger.warn(`[INCIDENT_ESCALATED] Created new incident #${incident.id}: ${incident.title}`);
      return incident;
    } catch (err) {
      logger.error(`[INCIDENT_ESCALATION_FAILED] ${err.message}`);
      return null;
    }
  },

  /**
   * Retrieves paginated list of incidents with filtering
   */
  listIncidents: async ({ status, severity, page = 1, limit = 20 } = {}) => {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const take = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * take;

    const where = {};
    if (status && status !== 'ALL') where.status = status;
    if (severity && severity !== 'ALL') where.severity = severity;

    const [total, incidents] = await Promise.all([
      prisma.systemIncident.count({ where }),
      prisma.systemIncident.findMany({
        where,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        skip,
        take,
        include: {
          auditLogs: {
            orderBy: { createdAt: 'desc' },
            take: 3,
          },
        },
      }),
    ]);

    return {
      incidents,
      pagination: {
        total,
        page: pageNum,
        limit: take,
        pages: Math.ceil(total / take) || 1,
      },
    };
  },

  /**
   * Get single incident with complete audit history
   */
  getIncidentDetails: async (id) => {
    const incident = await prisma.systemIncident.findUnique({
      where: { id },
      include: {
        auditLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!incident) {
      const err = new Error('Incident not found.');
      err.statusCode = 404;
      throw err;
    }

    return incident;
  },

  /**
   * Updates status of an incident (e.g. from INVESTIGATING to MONITORING)
   */
  updateIncidentStatus: async (id, { status, notes, adminId, adminName }) => {
    const incident = await prisma.systemIncident.findUnique({ where: { id } });
    if (!incident) {
      const err = new Error('Incident not found.');
      err.statusCode = 404;
      throw err;
    }

    const updated = await prisma.systemIncident.update({
      where: { id },
      data: {
        status,
        resolutionNotes: notes || incident.resolutionNotes,
        auditLogs: {
          create: {
            adminId,
            adminName,
            action: 'UPDATED_STATUS',
            details: `Status changed from ${incident.status} to ${status}.${notes ? ` Notes: ${notes}` : ''}`,
          },
        },
      },
      include: { auditLogs: { orderBy: { createdAt: 'desc' } } },
    });

    return updated;
  },

  /**
   * Resolves an incident with mandatory resolution notes
   */
  resolveIncident: async (id, { resolutionNotes, adminId, adminName }) => {
    if (!resolutionNotes || resolutionNotes.trim().length < 5) {
      const err = new Error('Resolution notes of at least 5 characters are required to resolve an incident.');
      err.statusCode = 400;
      throw err;
    }

    const incident = await prisma.systemIncident.findUnique({ where: { id } });
    if (!incident) {
      const err = new Error('Incident not found.');
      err.statusCode = 404;
      throw err;
    }

    const updated = await prisma.systemIncident.update({
      where: { id },
      data: {
        status: INCIDENT_STATUS.RESOLVED,
        resolutionNotes,
        resolvedAt: new Date(),
        resolvedByAdminId: adminId,
        auditLogs: {
          create: {
            adminId,
            adminName,
            action: 'RESOLVED',
            details: `Incident resolved: ${resolutionNotes}`,
          },
        },
      },
      include: { auditLogs: { orderBy: { createdAt: 'desc' } } },
    });

    return updated;
  },

  /**
   * Fetches paginated system error logs
   */
  listErrorLogs: async ({ severity, component, page = 1, limit = 50 } = {}) => {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * take;

    const where = {};
    if (severity && severity !== 'ALL') where.severity = severity;
    if (component && component !== 'ALL') where.component = component;

    const [total, logs] = await Promise.all([
      prisma.systemErrorLog.count({ where }),
      prisma.systemErrorLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);

    return {
      logs,
      errorLogs: logs,
      pagination: {
        total,
        page: pageNum,
        limit: take,
        pages: Math.ceil(total / take) || 1,
      },
    };
  },
};

export default incidentService;
