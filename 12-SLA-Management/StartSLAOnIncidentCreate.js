/**
 * Business Rule: Start SLA on Incident Create
 * 
 * Table: incident
 * When: after | insert
 * Order: 100
 * 
 * Description:
 * Automatically starts Response and Resolution SLAs when an incident is created.
 * SLA durations are based on the incident's priority level.
 * 
 * Priority Mapping:
 *   1 (Critical) → Response: 15min, Resolution: 1hr
 *   2 (High)     → Response: 1hr, Resolution: 4hrs
 *   3 (Medium)   → Response: 4hrs, Resolution: 24hrs
 *   4 (Low)      → Response: 8hrs, Resolution: 48hrs
 */

(function executeRule(current, previous /*null when async*/) {
    
    var slaUtils = new SLAUtils();
    
    // Start Response SLA
    var responseResult = slaUtils.startResponseSla(current);
    if (responseResult.success) {
        gs.info('SLA BR: Response SLA started for incident ' + current.number + 
                ' - ' + responseResult.sla_name + ' (' + responseResult.duration_label + ')');
    } else {
        gs.warn('SLA BR: Failed to start Response SLA for incident ' + current.number + 
                ' - ' + responseResult.error);
    }
    
    // Start Resolution SLA
    var resolutionResult = slaUtils.startResolutionSla(current);
    if (resolutionResult.success) {
        gs.info('SLA BR: Resolution SLA started for incident ' + current.number + 
                ' - ' + resolutionResult.sla_name + ' (' + resolutionResult.duration_label + ')');
    } else {
        gs.warn('SLA BR: Failed to start Resolution SLA for incident ' + current.number + 
                ' - ' + resolutionResult.error);
    }

})(current, previous);
