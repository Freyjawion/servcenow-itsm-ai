/**
 * ITSMGroupAssignment
 * 
 * Description: Handles assignment of incidents to the appropriate L1/L2/L3 support groups
 * based on the incident category and escalation status.
 * 
 * Usage: 
 *   var assigner = new ITSMGroupAssignment();
 *   assigner.assignL1Group(gr);       // Assign L1 group based on category
 *   assigner.escalateToL2(gr);        // Escalate incident to L2
 *   assigner.getGroupForCategory(cat); // Get L1 group sys_id for category
 */

var ITSMGroupAssignment = Class.create();
ITSMGroupAssignment.prototype = {
    initialize: function() {},

    /**
     * Category to L1 Group mapping configuration
     * Maps incident categories to their corresponding L1 support groups
     */
    categoryGroupMap: {
        'Hardware': 'Hardware Support',
        'Software': 'Software Support',
        'Network': 'Network Support',
        'Others': 'Others Support'
    },

    /**
     * L2 Support Group name
     */
    l2GroupName: 'L2 Support Team',

    /**
     * Assign L1 group based on incident category
     * @param {GlideRecord} gr - The incident GlideRecord
     * @returns {boolean} - true if assigned successfully, false otherwise
     */
    assignL1Group: function(gr) {
        if (!gr || !gr.category) {
            gs.error('ITSMGroupAssignment: No category provided for incident ' + gr.number);
            return false;
        }

        var category = gr.getDisplayValue('category');
        var groupName = this.categoryGroupMap[category];
        
        if (!groupName) {
            // Default to Others Support if category not found
            groupName = 'Others Support';
            gs.warn('ITSMGroupAssignment: Unknown category "' + category + 
                     '" for incident ' + gr.number + '. Assigning to Others Support.');
        }

        var groupGr = new GlideRecord('sys_user_group');
        if (groupGr.get('name', groupName)) {
            gr.assignment_group = groupGr.getUniqueValue();
            gr.assigned_to = ''; // Clear assigned to, let dispatcher assign
            gs.info('ITSMGroupAssignment: Incident ' + gr.number + 
                     ' assigned to group: ' + groupName);
            return true;
        } else {
            gs.error('ITSMGroupAssignment: Group "' + groupName + 
                      '" not found for incident ' + gr.number);
            return false;
        }
    },

    /**
     * Escalate incident to L2 support team
     * Sets assignment group to L2 Support Team and updates escalation fields
     * @param {GlideRecord} gr - The incident GlideRecord
     * @returns {boolean} - true if escalated successfully
     */
    escalateToL2: function(gr) {
        if (!gr) return false;

        var l2Group = new GlideRecord('sys_user_group');
        if (l2Group.get('name', this.l2GroupName)) {
            // Store original L1 group before escalation
            gr.setValue('u_original_l1_group', gr.getValue('assignment_group'));
            gr.assignment_group = l2Group.getUniqueValue();
            gr.escalation = 2; // Set escalation level
            
            // Add escalation note to work notes
            var notes = 'Incident escalated to L2 Support Team.\n' +
                        'Original L1 Group: ' + gr.getDisplayValue('u_original_l1_group');
            gr.work_notes = notes;
            
            gs.info('ITSMGroupAssignment: Incident ' + gr.number + 
                     ' escalated to L2 Support Team');
            return true;
        } else {
            gs.error('ITSMGroupAssignment: L2 Support Team group not found');
            return false;
        }
    },

    /**
     * Get the L1 group sys_id for a given category
     * @param {string} category - The incident category
     * @returns {string} - Group sys_id or empty string
     */
    getGroupForCategory: function(category) {
        var groupName = this.categoryGroupMap[category] || 'Others Support';
        var groupGr = new GlideRecord('sys_user_group');
        if (groupGr.get('name', groupName)) {
            return groupGr.getUniqueValue();
        }
        return '';
    },

    /**
     * Get all available category names
     * @returns {Array} - Array of category strings
     */
    getCategories: function() {
        var categories = [];
        for (var cat in this.categoryGroupMap) {
            if (this.categoryGroupMap.hasOwnProperty(cat)) {
                categories.push(cat);
            }
        }
        return categories;
    },

    type: 'ITSMGroupAssignment'
};
