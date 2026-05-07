/**
 * Business Rule: Set L1 Group Assignment
 * 
 * Table: incident
 * When: before | insert, update
 * Condition: current.category.changes() || current.assignment_group.nil()
 * Order: 100
 * 
 * Description:
 * Automatically assigns the appropriate L1 support group to the incident
 * based on the selected category. Runs before insert or when category changes.
 * Only assigns if assignment_group is empty (not manually set).
 */

(function executeRule(current, previous /*null when async*/) {
    
    // Only auto-assign if no assignment group is set yet
    if (current.assignment_group.nil()) {
        var assigner = new ITSMGroupAssignment();
        var assigned = assigner.assignL1Group(current);
        
        if (assigned) {
            gs.info('Auto-assigned incident ' + current.number + 
                     ' to L1 group based on category: ' + current.getDisplayValue('category'));
            
            // Send assignment notification
            var notif = new ITSMNotificationUtils();
            notif.sendAssignedNotification(current, '');
        }
    }

})(current, previous);
