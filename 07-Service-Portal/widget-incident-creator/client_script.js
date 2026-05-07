/**
 * Client Controller for ITSM Incident Creator Widget
 * 
 * Handles form interactions, category-subcategory cascading,
 * form validation, and submission
 */

function ITSMIncidentCreator($scope, spUtil) {
    var c = this;

    // Initialize
    c.isSubmitting = false;
    c.successMessage = null;
    c.errorMessage = null;
    c.isLoading = false;

    /**
     * Called when category selection changes
     * Loads the corresponding subcategories via server call
     */
    c.onCategoryChange = function() {
        c.data.subcategories = [];
        c.data.subcategory = '';
        
        if (c.data.category) {
            c.server.get({action: 'getSubcategories', category: c.data.category})
                .then(function(response) {
                    if (response.data && response.data.subcategories) {
                        c.data.subcategories = response.data.subcategories;
                    }
                });
        }
    };

    /**
     * Submit the incident form
     * Validates required fields and sends data to server
     */
    c.submitIncident = function() {
        // Form validation
        if (!c.data.short_description || !c.data.category || !c.data.subcategory || !c.data.description) {
            c.errorMessage = 'Please fill in all required fields.';
            return;
        }

        c.isSubmitting = true;
        c.errorMessage = null;

        c.server.get({
            action: 'createIncident',
            short_description: c.data.short_description,
            category: c.data.category,
            subcategory: c.data.subcategory,
            description: c.data.description,
            urgency: c.data.urgency
        }).then(function(response) {
            c.isSubmitting = false;
            
            if (response.data && response.data.success) {
                c.successMessage = response.data.message;
                
                // Trigger a custom event for other widgets to refresh if needed
                spUtil.publish('incident.created', {
                    incidentNumber: response.data.number
                });
            } else {
                c.errorMessage = response.data.error || 'Failed to create incident. Please try again.';
            }
        }, function(error) {
            c.isSubmitting = false;
            c.errorMessage = 'An unexpected error occurred. Please try again.';
        });
    };

    /**
     * Reset the form to initial state
     */
    c.resetForm = function() {
        c.data.short_description = '';
        c.data.category = '';
        c.data.subcategory = '';
        c.data.subcategories = [];
        c.data.description = '';
        c.data.urgency = '2';
        c.successMessage = null;
        c.errorMessage = null;
        c.isSubmitting = false;
        
        // Reset form validation state
        if ($scope.incidentForm) {
            $scope.incidentForm.$setPristine();
            $scope.incidentForm.$setUntouched();
        }
    };
}
