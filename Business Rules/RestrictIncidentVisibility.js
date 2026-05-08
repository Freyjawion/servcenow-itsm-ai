/**
 * Business Rule: Restrict Incident Visibility
 * 
 * Table: incident
 * When: before | query
 * Condition: gs.hasRole('itsm_l1_agent')
 * Order: 100
 * 
 * Description:
 * Restricts L1 agents to only see incidents assigned to their own groups.
 * L2 agents and admins can see all incidents.
 * 
 * NOTE: Create a role 'itsm_l1_agent' in your PDI:
 * 1. Navigate to: User Administration > Roles
 * 2. Create new role: itsm_l1_agent
 * 3. Assign this role to L1 users (lisa.wang, tom.chen, david.li)
 */

(function executeRule(current, previous /*null when async*/) {
    
    // Only apply restriction for L1 agents
    if (gs.hasRole('itsm_l1_agent') && !gs.hasRole('admin')) {
        
        // Get all groups the current user belongs to
        var userGroups = [];
        var groupMember = new GlideRecord('sys_user_grmember');
        groupMember.addQuery('user', gs.getUserID());
        groupMember.query();
        
        while (groupMember.next()) {
            userGroups.push(groupMember.getValue('group'));
        }
        
        if (userGroups.length > 0) {
            // Add query condition: assignment_group must be one of user's groups
            var groupQuery = current.addQuery('assignment_group', 'IN', userGroups.join(','));
            
            gs.info('Visibility restricted: User ' + gs.getUserDisplayName() + 
                     ' can only see incidents from their groups');
        } else {
            // User has L1 role but not in any group - show no incidents
            current.addQuery('sys_id', '=', '-1'); // Returns no records
            gs.warn('Visibility: User ' + gs.getUserDisplayName() + 
                     ' has L1 role but belongs to no groups');
        }
    }

})(current, previous);
