/**
 * Business Rule: Problem State Change Notification
 * 
 * Table: problem
 * When: after | update
 * Condition: current.state.changes()
 * Order: 100
 * 
 * Description:
 * Triggers notifications when the problem state changes.
 * Also sends notification when a problem is first created.
 */

(function executeRule(current, previous /*null when async*/) {
    
    var pu = new ProblemUtils();
    
    // Send state change notification
    pu.sendProblemStateChangeNotification(current, previous.getValue('state'));
    
    // Log state changes
    var currentState = current.getValue('state');
    var previousState = previous.getValue('state');
    
    var stateLabels = pu.getProblemStates();
    var currentLabel = stateLabels[currentState] || 'Unknown';
    var previousLabel = stateLabels[previousState] || 'Unknown';
    
    gs.info('Problem ' + current.number + ' state changed: "' + 
             previousLabel + '" -> "' + currentLabel + '"');
    
    // If problem is resolved or closed, log resolution info
    if (currentState == '6' || currentState == '7') {
        gs.info('Problem ' + current.number + ' has been ' + 
                 (currentState == '6' ? 'resolved' : 'closed'));
    }

})(current, previous);
