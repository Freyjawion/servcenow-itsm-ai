/**
 * Server Script for ITSM Incident Creator Widget
 * 
 * Handles form data processing, incident creation, and 
 * category/subcategory retrieval from the server
 */

(function() {
    
    // Get current user information
    data.caller_name = gs.getUserDisplayName();
    data.categories = [];
    data.subcategories = [];
    
    /**
     * Initialize categories from the incident table's choice list
     * or use default hard-coded values as fallback
     */
    function loadCategories() {
        var categories = [];
        
        // Try to load from sys_choice list for incident.category
        var gr = new GlideRecord('sys_choice');
        gr.addQuery('name', 'incident');
        gr.addQuery('element', 'category');
        gr.addQuery('inactive', false);
        gr.orderBy('sequence');
        gr.query();
        
        if (gr.hasNext()) {
            while (gr.next()) {
                categories.push(gr.getValue('value'));
            }
        } else {
            // Fallback to default categories
            categories = ['Hardware', 'Software', 'Network', 'Others'];
        }
        
        return categories;
    }
    
    /**
     * Get subcategories for a given category from sys_choice
     * or use default mapping as fallback
     */
    function getSubcategoriesForCategory(category) {
        var subcategories = [];
        
        // Try to load from sys_choice
        var gr = new GlideRecord('sys_choice');
        gr.addQuery('name', 'incident');
        gr.addQuery('element', 'subcategory');
        gr.addQuery('dependent_value', category);
        gr.addQuery('inactive', false);
        gr.orderBy('sequence');
        gr.query();
        
        if (gr.hasNext()) {
            while (gr.next()) {
                subcategories.push(gr.getValue('value'));
            }
        } else {
            // Fallback default subcategory mapping
            var subcategoryMap = {
                'Hardware': ['Laptop', 'Desktop', 'Printer', 'Server', 'Monitor', 'Peripheral'],
                'Software': ['OS', 'Office', 'ERP', 'CRM', 'Email', 'Antivirus'],
                'Network': ['Router', 'Switch', 'Firewall', 'VPN', 'WiFi', 'Cable'],
                'Others': ['General Inquiry', 'Account Issue', 'Password Reset', 'Access Request', 'Other']
            };
            subcategories = subcategoryMap[category] || ['General'];
        }
        
        return subcategories;
    }
    
    /**
     * Create a new incident record
     */
    function createIncident(params) {
        var gr = new GlideRecord('incident');
        gr.initialize();
        
        gr.short_description = params.short_description;
        gr.category = params.category;
        gr.subcategory = params.subcategory;
        gr.description = params.description;
        gr.urgency = params.urgency || 2;
        gr.impact = params.urgency || 2;
        gr.caller_id = gs.getUserID();
        gr.contact_type = 'self-service';
        
        // Source tracking
        gr.setValue('u_source', 'Portal');
        
        var sysId = gr.insert();
        
        if (sysId) {
            // Send notification for new incident
            var notif = new ITSMNotificationUtils();
            notif.sendIncidentCreatedNotification(gr);
            
            return {
                success: true,
                number: gr.number,
                message: 'Incident ' + gr.number + ' has been created successfully.\n' +
                         'It has been assigned to the ' + gr.getDisplayValue('assignment_group') + ' team.\n' +
                         'You will receive email notifications about updates.'
            };
        } else {
            return {
                success: false,
                error: 'Failed to create incident. Please try again.'
            };
        }
    }
    
    // ===== Request Handler =====
    
    // Initialize categories on load
    data.categories = loadCategories();
    
    // Handle actions
    if (input && input.action) {
        switch (input.action) {
            case 'getSubcategories':
                data.subcategories = getSubcategoriesForCategory(input.category);
                break;
                
            case 'createIncident':
                var result = createIncident({
                    short_description: input.short_description,
                    category: input.category,
                    subcategory: input.subcategory,
                    description: input.description,
                    urgency: input.urgency
                });
                
                data.success = result.success;
                data.message = result.message;
                data.number = result.number;
                data.error = result.error;
                break;
        }
    }
    
})();
