/**
 * Server Script for My Group Incidents Widget
 * 
 * Retrieves incidents assigned to the current user's L1 groups.
 * L2 agents can see escalated incidents.
 * Provides state update and escalation functionality.
 */

(function() {
    
    data.incidents = [];
    data.summary = null;

    /**
     * Get the current user's groups
     * @returns {Array} Array of group sys_ids
     */
    function getUserGroups() {
        var groups = [];
        var gr = new GlideRecord('sys_user_grmember');
        gr.addQuery('user', gs.getUserID());
        gr.query();
        while (gr.next()) {
            groups.push(gr.getValue('group'));
        }
        return groups;
    }

    /**
     * Get the urgency label
     * @param {string} urgency - Urgency value
     * @returns {string} Label
     */
    function getUrgencyLabel(urgency) {
        var map = {
            '1': 'High',
            '2': 'Medium',
            '3': 'Low'
        };
        return map[urgency] || 'Unknown';
    }

    /**
     * Get the state label
     * @param {string} state - State value
     * @returns {string} Label
     */
    function getStateLabel(state) {
        var map = {
            '1': 'New',
            '2': 'In Progress',
            '3': 'On Hold',
            '6': 'Resolved',
            '7': 'Closed'
        };
        return map[state] || 'Unknown';
    }

    /**
     * Fetch incidents for the current user's groups
     */
    function getMyGroupIncidents() {
        var userGroups = getUserGroups();
        if (userGroups.length === 0) {
            return [];
        }

        var incidents = [];
        var gr = new GlideRecord('incident');
        gr.addQuery('assignment_group', 'IN', userGroups.join(','));
        gr.addQuery('active', true);
        gr.orderByDesc('sys_created_on');
        gr.setLimit(50);
        gr.query();

        while (gr.next()) {
            incidents.push({
                sys_id: gr.getUniqueValue(),
                number: gr.getValue('number'),
                short_description: gr.getValue('short_description'),
                description: gr.getValue('description'),
                category: gr.getDisplayValue('category'),
                subcategory: gr.getDisplayValue('subcategory'),
                state: gr.getValue('state'),
                state_label: getStateLabel(gr.getValue('state')),
                urgency: gr.getValue('urgency'),
                urgency_label: getUrgencyLabel(gr.getValue('urgency')),
                caller_name: gr.getDisplayValue('caller_id'),
                assignment_group_name: gr.getDisplayValue('assignment_group'),
                created_date: gr.getValue('sys_created_on')
            });
        }

        return incidents;
    }

    /**
     * Get summary counts for the dashboard cards
     */
    function getSummary(incidents) {
        var summary = {
            total: incidents.length,
            new_count: 0,
            in_progress_count: 0,
            on_hold_count: 0
        };

        for (var i = 0; i < incidents.length; i++) {
            switch (incidents[i].state) {
                case '1':
                    summary.new_count++;
                    break;
                case '2':
                    summary.in_progress_count++;
                    break;
                case '3':
                    summary.on_hold_count++;
                    break;
            }
        }

        return summary;
    }

    /**
     * Update incident state
     */
    function updateIncidentState(sysId, state) {
        var gr = new GlideRecord('incident');
        if (gr.get(sysId)) {
            
            if (state === '-1') {
                // Escalate to L2
                var assigner = new ITSMGroupAssignment();
                assigner.escalateToL2(gr);
                
                // Notify
                var notif = new ITSMNotificationUtils();
                notif.sendEscalationNotification(gr);
                
                gr.update();
                return {success: true, message: 'Incident escalated to L2 Support Team'};
            } else {
                // Normal state change
                gr.state = state;
                gr.update();
                return {success: true, message: 'Incident state updated to: ' + getStateLabel(state)};
            }
        }
        return {success: false, error: 'Incident not found'};
    }

    // ===== Request Handler =====

    if (input && input.action) {
        switch (input.action) {
            case 'getIncidents':
                data.incidents = getMyGroupIncidents();
                data.summary = getSummary(data.incidents);
                break;
                
            case 'updateState':
                var result = updateIncidentState(input.sys_id, input.state);
                data.success = result.success;
                data.message = result.message;
                data.error = result.error;
                break;
        }
    }

})();
