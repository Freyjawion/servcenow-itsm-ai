/**
 * Client Controller for My Group Incidents Widget
 * 
 * Handles incident list display, state updates, and escalation
 */

function MyGroupIncidentsCtrl($scope, spUtil) {
    var c = this;
    
    c.isLoading = false;
    c.errorMessage = null;

    /**
     * Refresh the incident list
     */
    c.refresh = function() {
        c.isLoading = true;
        c.errorMessage = null;
        
        c.server.get({action: 'getIncidents'})
            .then(function(response) {
                c.isLoading = false;
                if (response.data) {
                    c.data.incidents = response.data.incidents || [];
                    c.data.summary = response.data.summary || null;
                }
            }, function(error) {
                c.isLoading = false;
                c.errorMessage = 'Failed to load incidents. Please try again.';
            });
    };

    /**
     * Update the state of an incident
     * @param {string} sysId - Incident sys_id
     * @param {string} newState - New state value ('2' for In Progress, '-1' for Escalate)
     */
    c.updateState = function(sysId, newState) {
        c.isLoading = true;
        
        c.server.get({
            action: 'updateState',
            sys_id: sysId,
            state: newState
        }).then(function(response) {
            c.isLoading = false;
            if (response.data && response.data.success) {
                // Refresh the list after state change
                c.refresh();
            } else {
                c.errorMessage = response.data.error || 'Failed to update incident state.';
            }
        }, function(error) {
            c.isLoading = false;
            c.errorMessage = 'Failed to update incident state. Please try again.';
        });
    };

    // Load incidents on widget initialization
    c.refresh();
}
