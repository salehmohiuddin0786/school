import {
  dispatchOutboundNotification,
  triggerAbsenteeAlert,
  triggerFeeDueReminder,
  triggerFeeReceiptAlert,
  listOutboundNotifications,
  getNotificationDeliveryStats,
} from './notification.service.js';
import {
  dispatchNotificationSchema,
  triggerAbsenteeSchema,
  triggerFeeDueSchema,
  triggerFeeReceiptSchema,
} from './notification.schema.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/response.js';

export async function dispatchNotificationController(req, res, next) {
  try {
    const validated = dispatchNotificationSchema.parse(req.body);
    const notification = await dispatchOutboundNotification(req.tenantId, validated, req.user?.id, req);
    return sendCreated(res, notification, 'Outbound notification dispatched successfully');
  } catch (error) {
    next(error);
  }
}

export async function triggerAbsenteeAlertController(req, res, next) {
  try {
    const validated = triggerAbsenteeSchema.parse(req.body);
    const result = await triggerAbsenteeAlert(req.tenantId, {
      ...validated,
      recordedById: req.user?.id,
      req,
    });
    return sendSuccess(res, result, 'Student absence alert enqueued and sent to parent contacts');
  } catch (error) {
    next(error);
  }
}

export async function triggerFeeDueReminderController(req, res, next) {
  try {
    const validated = triggerFeeDueSchema.parse(req.body);
    const result = await triggerFeeDueReminder(req.tenantId, {
      ...validated,
      triggeredById: req.user?.id,
      req,
    });
    return sendSuccess(res, result, 'Fee due reminder sent to parent contacts');
  } catch (error) {
    next(error);
  }
}

export async function triggerFeeReceiptController(req, res, next) {
  try {
    const validated = triggerFeeReceiptSchema.parse(req.body);
    const result = await triggerFeeReceiptAlert(req.tenantId, {
      ...validated,
      triggeredById: req.user?.id,
      req,
    });
    return sendSuccess(res, result, 'Payment receipt confirmation sent to parent contacts');
  } catch (error) {
    next(error);
  }
}

export async function listNotificationsController(req, res, next) {
  try {
    const { eventType, channel, status, page = 1, limit = 20 } = req.query;
    const { items, total } = await listOutboundNotifications(req.tenantId, {
      eventType,
      channel,
      status,
      page,
      limit,
    });
    return sendPaginated(res, items, total, page, limit, 'Notifications retrieved');
  } catch (error) {
    next(error);
  }
}

export async function getStatsController(req, res, next) {
  try {
    const stats = await getNotificationDeliveryStats(req.tenantId);
    return sendSuccess(res, stats, 'Notification delivery metrics retrieved');
  } catch (error) {
    next(error);
  }
}
