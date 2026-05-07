/**
 * Business Rule: Stop SLA on Incident Resolve/Close
 * 
 * Table: incident
 * When: after | update
 * Condition: current.state.changes() AND (
 *              current.state == 6 OR current.state == 7   // Resolved or Closed
 *            )
 * Order: 200
 * 
 * Description:
 * Stops all running SLAs when an incident is resolved (state 6) or closed (state 7).
 * Also restarts SLAs if an incident is reopened from Resolved/Closed state.
 */

(function executeRule(current, previous /*null when async*/) {
    
    var currentState = current.getValue('state');
    var previousState = previous ? previous.getValue('state') : null;
    
    // If no state change, skip
    if (currentState === previousState) return;
    
    var slaUtils = new SLAUtils();
    
    // Incident Resolved (6) or Closed (7) - Stop all SLAs
    if (currentState === '6' || currentState === '7') {
        var stopped = slaUtils.stopAllSlas(current);
        if (stopped) {
            var stateLabel = currentState === '6' ? 'Resolved' : 'Closed';
            gs.info('SLA BR: All SLAs stopped for incident ' + current.number + 
                    ' after state changed to ' + stateLabel);
        }
    }
    
    // Incident Reopened from Resolved/Closed - Restart SLAs
    if (previousState && (previousState === '6' || previousState === '7')) {
        if (currentState !== '6' && currentState !== '7') {
            gs.info('SLA BR: Incident ' + current.number + ' reopened from Resolved/Closed. Restarting SLAs.');
            
            // Restart Response SLA
            var respResult = slaUtils.startResponseSla(current);
            if (respResult.success) {
                gs.info('SLA BR: Response SLA restarted for incident ' + current.number);
            }
            
            // Restart Resolution SLA
            var resoResult = slaUtils.startResolutionSla(current);
            if (resoResult.success) {
                gs.info('SLA BR: Resolution SLA restarted for incident ' + current.number);
            }
        }
    }

})(current, previous);
