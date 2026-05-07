/**
 * Business Rule: Change State Notification
 * 
 * Table: change_request
 * When: after | update
 * Condition: current.state.changes()
 * Order: 200
 * 
 * Description:
 * Triggers notifications when change state changes.
 * Applies to ALL change types (normal, infrastructure, etc.)
 */

(function executeRule(current, previous /*null when async*/) {
    
    var cu = new ChangeUtils();
    
    // Send state change notification
    cu.sendChangeStateChangeNotification(current, previous.getValue('state'));
    
    // Log the state change
    var currentState = current.getValue('state');
    var previousState = previous.getValue('state');
    
    var stateLabels = cu.getChangeStates();
    var currentLabel = stateLabels[currentState] || 'Unknown';
    var previousLabel = stateLabels[previousState] || 'Unknown';
    
    gs.info('Change ' + current.number + ' state changed: "' + 
             previousLabel + '" -> "' + currentLabel + '"');

})(current, previous);
