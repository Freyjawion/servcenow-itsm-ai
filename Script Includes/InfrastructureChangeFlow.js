/**
 * Business Rule: Infrastructure Change Flow
 * 
 * Table: change_request
 * When: after | insert | update
 * Condition: current.type.toString().toLowerCase() === 'infrastructure'
 * Order: 100
 * 
 * Description:
 * Manages the infrastructure change lifecycle.
 * - On insert: Sets initial state to Assess
 * - On state change to 'Scheduled' (4): Auto-creates 2 change tasks
 * - High priority changes: Ensures CAB approval is configured
 */

(function executeRule(current, previous /*null when async*/) {
    
    var cu = new ChangeUtils();
    var currentState = current.getValue('state');
    var previousState = previous ? previous.getValue('state') : null;
    
    // Check if this is an infrastructure change
    if (!cu.isInfrastructureChange(current)) {
        return; // Skip for non-infrastructure changes
    }
    
    // On new record (insert), set to Assess state
    if (!previous && currentState === '1') {
        current.state = 2; // Move to Assess
        gs.info('Infrastructure Flow: Change ' + current.number + 
                ' initialized to Assess state');
    }
    
    // On state change to Scheduled (4), auto-create 2 change tasks
    if (currentState === '4' && previousState !== '4') {
        var tasksCreated = cu.autoCreateChangeTasks(current);
        if (tasksCreated) {
            gs.info('Infrastructure Flow: Auto-created change tasks for ' + current.number);
        }
    }
    
    // For high priority changes, ensure CAB is configured
    if (cu.isHighPriority(current)) {
        var cabRequired = current.getValue('cab_required');
        if (!cabRequired || cabRequired === 'false') {
            cu.setCABForChange(current);
            gs.info('Infrastructure Flow: CAB approval configured for high priority change ' + 
                     current.number);
        }
    }

})(current, previous);
