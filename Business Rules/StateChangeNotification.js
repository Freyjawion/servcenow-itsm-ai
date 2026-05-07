/**
 * Business Rule: State Change Notification Trigger
 * 
 * Table: incident
 * When: after | update
 * Condition: current.state.changes()
 * Order: 300
 * 
 * Description:
 * Triggers appropriate notifications when the incident state changes.
 * Also sends assignment notification if assignment group changed simultaneously.
 */

(function executeRule(current, previous /*null when async*/) {
    
    var notif = new ITSMNotificationUtils();
    
    // Send state change notification
    notif.sendStateChangeNotification(current, previous.getValue('state'));
    
    // Check if assignment group also changed
    if (current.assignment_group.changes()) {
        notif.sendAssignedNotification(current, previous.getValue('assignment_group'));
    }
    
    // If incident is resolved, log the resolution
    if (current.state == 6) { // Resolved
        gs.info('Incident ' + current.number + ' has been resolved by ' + 
                 gs.getUserDisplayName());
    }
    
    // If incident is closed, log closure
    if (current.state == 7) { // Closed
        gs.info('Incident ' + current.number + ' has been closed');
    }

})(current, previous);
