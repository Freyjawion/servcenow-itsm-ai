/**
 * Business Rule: L1 to L2 Escalation
 * 
 * Table: incident
 * When: after | update
 * Condition: current.u_escalate_to_l2.changes() && current.u_escalate_to_l2 == true
 * Order: 200
 * 
 * Description:
 * When an L1 agent marks the escalation checkbox, this business rule
 * will reassign the incident to the L2 Support Team and trigger
 * escalation notifications.
 * 
 * NOTE: Add a custom field 'u_escalate_to_l2' (boolean) to the incident table
 * before enabling this rule. Navigate to: incident table → New Field
 * Field name: u_escalate_to_l2, Type: True/False, Label: "Escalate to L2"
 */

(function executeRule(current, previous /*null when async*/) {
    
    // Check if escalation flag was just set to true
    if (current.u_escalate_to_l2 == true) {
        
        // Use the ITSMGroupAssignment script to handle escalation
        var assigner = new ITSMGroupAssignment();
        var escalated = assigner.escalateToL2(current);
        
        if (escalated) {
            // Send escalation notification
            var notif = new ITSMNotificationUtils();
            notif.sendEscalationNotification(current);
            notif.sendAssignedNotification(current, previous.getValue('assignment_group'));
            
            // Add to work notes
            current.work_notes = '*** INCIDENT ESCALATED TO L2 ***\n' +
                                 'Escalated by: ' + gs.getUserDisplayName() + '\n' +
                                 'Previous L1 Group: ' + previous.getDisplayValue('assignment_group');
            
            // Reset the escalation flag (after use)
            current.u_escalate_to_l2 = false;
            
            gs.info('Incident ' + current.number + ' has been escalated to L2 Support Team');
        }
    }

})(current, previous);
