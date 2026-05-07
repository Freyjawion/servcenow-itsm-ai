/**
 * Scheduled Job: SLA Check & Notification Processor
 * 
 * Table: Scheduled Job (sysauto)
 * Run: Every 5 minutes
 * 
 * Description:
 * Periodically checks all in-progress SLAs and processes notifications:
 * - 75% elapsed → First warning notification
 * - 90% elapsed → Second warning notification
 * - 100% elapsed → Breach notification and marks SLA as breached
 * 
 * This simulates real-time SLA monitoring in ServiceNow.
 * In production, this would be a GlideScheduledJob.
 */

(function execute() {
    
    var slaUtils = new SLAUtils();
    var notificationsSent = slaUtils.processPendingNotifications();
    
    if (notificationsSent > 0) {
        gs.info('SLA Scheduled Job: Sent ' + notificationsSent + ' SLA notification(s)');
    }

})();
