/**
 * KnowledgeUtils
 * 
 * Description: Utility class for Knowledge Management operations.
 * Manages 2 Knowledge Bases with different access levels and publish workflows:
 *   - KB1 (Technical KB): Restricted to tech users, requires approval to publish
 *   - KB2 (Employee KB): Open to all employees, auto-publish without approval
 * 
 * Usage:
 *   var ku = new KnowledgeUtils();
 *   ku.getTechnicalKbSysId();
 *   ku.getEmployeeKbSysId();
 *   ku.canViewKb(userId, kbSysId);
 *   ku.requiresPublishApproval(kbSysId);
 */

var KnowledgeUtils = Class.create();
KnowledgeUtils.prototype = {
    initialize: function() {},

    /**
     * Knowledge Base identifiers
     */
    KB_TECHNICAL: {
        name: 'Technical Knowledge Base',
        id: 'kb_technical',
        description: 'Technical knowledge base for internal support teams. Contains technical documentation, troubleshooting guides, and system configurations.'
    },

    KB_EMPLOYEE: {
        name: 'Employee Knowledge Base',
        id: 'kb_employee',
        description: 'Employee knowledge base available to all staff. Contains FAQs, how-to guides, company policies, and general information.'
    },

    /**
     * Get the sys_id of the Technical Knowledge Base
     * @returns {string} sys_id of the KB, or empty string
     */
    getTechnicalKbSysId: function() {
        return this.getKbSysIdByName(this.KB_TECHNICAL.name);
    },

    /**
     * Get the sys_id of the Employee Knowledge Base
     * @returns {string} sys_id of the KB, or empty string
     */
    getEmployeeKbSysId: function() {
        return this.getKbSysIdByName(this.KB_EMPLOYEE.name);
    },

    /**
     * Find a Knowledge Base by name
     * @param {string} name - KB name
     * @returns {string} sys_id
     */
    getKbSysIdByName: function(name) {
        var gr = new GlideRecord('kb_knowledge_base');
        if (gr.get('name', name)) {
            return gr.getUniqueValue();
        }
        return '';
    },

    /**
     * Check if a user can view articles in a specific Knowledge Base
     * @param {string} userId - User sys_id (optional, defaults to current user)
     * @param {string} kbSysId - Knowledge Base sys_id
     * @returns {boolean}
     */
    canViewKb: function(userId, kbSysId) {
        var user = userId || gs.getUserID();
        
        // Admin can view everything
        if (gs.hasRole('admin')) return true;
        
        // Get the KB record
        var kbGr = new GlideRecord('kb_knowledge_base');
        if (!kbGr.get(kbSysId)) return false;
        
        var kbName = kbGr.getValue('name');
        
        // Employee KB - all authenticated users can view
        if (kbName === this.KB_EMPLOYEE.name) {
            return true; // All authenticated users
        }
        
        // Technical KB - only tech roles can view
        if (kbName === this.KB_TECHNICAL.name) {
            return this.isTechnicalUser(user);
        }
        
        // For any other KB, check roles
        return this.isTechnicalUser(user);
    },

    /**
     * Check if a user is a technical user (L1, L2, L3, admin, etc.)
     * @param {string} userId - User sys_id
     * @returns {boolean}
     */
    isTechnicalUser: function(userId) {
        if (gs.hasRole('admin')) return true;
        if (gs.hasRole('itsm_l1_agent')) return true;
        if (gs.hasRole('itsm_l2_agent')) return true;
        if (gs.hasRole('itsm_l3_agent')) return true;
        if (gs.hasRole('knowledge_admin')) return true;
        if (gs.hasRole('knowledge_manager')) return true;
        
        // Check if user belongs to any support group
        var gr = new GlideRecord('sys_user_grmember');
        gr.addQuery('user', userId || gs.getUserID());
        gr.query();
        while (gr.next()) {
            var groupGr = new GlideRecord('sys_user_group');
            if (groupGr.get(gr.getValue('group'))) {
                var type = groupGr.getValue('type');
                if (type === 'itsm_l1_group' || type === 'itsm_l2_group' || type === 'itsm_l3_group') {
                    return true;
                }
            }
        }
        
        return false;
    },

    /**
     * Check if a Knowledge Base requires approval for publishing articles
     * @param {string} kbSysId - Knowledge Base sys_id
     * @returns {boolean}
     */
    requiresPublishApproval: function(kbSysId) {
        var kbGr = new GlideRecord('kb_knowledge_base');
        if (!kbGr.get(kbSysId)) return false;
        
        var kbName = kbGr.getValue('name');
        
        // Technical KB requires approval
        if (kbName === this.KB_TECHNICAL.name) {
            return true;
        }
        
        // Employee KB auto-publishes
        if (kbName === this.KB_EMPLOYEE.name) {
            return false;
        }
        
        // Default: no approval needed
        return false;
    },

    /**
     * Get the publish workflow for a Knowledge Base
     * @param {string} kbSysId - KB sys_id
     * @returns {Object} {requiresApproval: boolean, workflow: string}
     */
    getPublishWorkflow: function(kbSysId) {
        var requiresApproval = this.requiresPublishApproval(kbSysId);
        
        if (requiresApproval) {
            return {
                requiresApproval: true,
                workflow: 'Technical KB Publish Flow',
                description: 'Draft -> Pending Approval -> Published. Requires knowledge manager or admin approval.'
            };
        } else {
            return {
                requiresApproval: false,
                workflow: 'Employee KB Auto-Publish Flow',
                description: 'Draft -> Published (No approval needed. Auto-publish for knowledge managers.)'
            };
        }
    },

    /**
     * Get all articles in a KB (with filters)
     * @param {string} kbSysId - KB sys_id
     * @param {Object} filters - Optional filters {search, category, state}
     * @returns {Array} Array of article objects
     */
    getArticles: function(kbSysId, filters) {
        var articles = [];
        var gr = new GlideRecord('kb_knowledge');
        
        gr.addQuery('kb_knowledge_base', kbSysId);
        
        // Apply access control - only show articles user can see
        if (!this.canViewKb(null, kbSysId)) {
            return articles;
        }
        
        // Apply filters
        if (filters) {
            if (filters.search) {
                gr.addEncodedQuery('short_descriptionLIKE' + filters.search + 
                                   '^ORtextLIKE' + filters.search);
            }
            if (filters.category) {
                gr.addQuery('kb_category', filters.category);
            }
            if (filters.state) {
                gr.addQuery('workflow_state', filters.state);
            } else {
                // Default: only show published articles to end users
                if (!this.isTechnicalUser(null)) {
                    gr.addQuery('workflow_state', 'published');
                }
            }
        } else {
            // Default filter for non-tech users
            if (!this.isTechnicalUser(null)) {
                gr.addQuery('workflow_state', 'published');
            }
        }
        
        gr.orderByDesc('sys_created_on');
        gr.setLimit(50);
        gr.query();
        
        while (gr.next()) {
            articles.push({
                sys_id: gr.getUniqueValue(),
                number: gr.getValue('number'),
                short_description: gr.getValue('short_description'),
                text: gr.getValue('text'),
                category: gr.getDisplayValue('kb_category'),
                workflow_state: gr.getValue('workflow_state'),
                state_label: this.getStateLabel(gr.getValue('workflow_state')),
                author: gr.getDisplayValue('author'),
                created_on: gr.getValue('sys_created_on'),
                updated_on: gr.getValue('sys_updated_on'),
                views: gr.getValue('views'),
                kb_name: gr.getDisplayValue('kb_knowledge_base')
            });
        }
        
        return articles;
    },

    /**
     * Get the display label for workflow state
     * @param {string} state - Workflow state value
     * @returns {string}
     */
    getStateLabel: function(state) {
        var labels = {
            'draft': 'Draft',
            'pending_approval': 'Pending Approval',
            'published': 'Published',
            'retired': 'Retired'
        };
        return labels[state] || state || 'Unknown';
    },

    /**
     * Create a new knowledge article
     * @param {string} kbSysId - KB sys_id
     * @param {Object} params - {short_description, text, category, keywords}
     * @returns {Object} {success, sys_id, number, error}
     */
    createArticle: function(kbSysId, params) {
        if (!kbSysId || !params) {
            return {success: false, error: 'Missing required parameters'};
        }

        try {
            var gr = new GlideRecord('kb_knowledge');
            gr.initialize();
            
            gr.kb_knowledge_base = kbSysId;
            gr.short_description = params.short_description;
            gr.text = params.text || '';
            
            if (params.category) {
                gr.kb_category = params.category;
            }
            
            if (params.keywords) {
                gr.keywords = params.keywords;
            }
            
            // Set workflow state based on KB publish flow
            var requiresApproval = this.requiresPublishApproval(kbSysId);
            if (requiresApproval) {
                gr.workflow_state = 'draft'; // Starts as draft, needs approval
            } else {
                // Check if user can auto-publish
                if (this.isTechnicalUser(null) || gs.hasRole('knowledge_manager')) {
                    gr.workflow_state = 'published'; // Auto-publish for tech users
                } else {
                    gr.workflow_state = 'draft'; // Otherwise starts as draft
                }
            }
            
            // Set author
            gr.author = gs.getUserID();
            
            var sysId = gr.insert();
            
            if (sysId) {
                gs.info('KnowledgeUtils: Article ' + gr.number + ' created in KB ' + 
                         gr.getDisplayValue('kb_knowledge_base'));
                return {
                    success: true,
                    sys_id: sysId,
                    number: gr.number,
                    message: 'Article ' + gr.number + ' created successfully.'
                };
            } else {
                return {success: false, error: 'Failed to create article'};
            }
        } catch (e) {
            gs.error('KnowledgeUtils: Error creating article - ' + e.message);
            return {success: false, error: e.message};
        }
    },

    /**
     * Export articles to a format compatible with Excel import
     * @param {Array} articleSysIds - Array of article sys_ids
     * @returns {Array} Array of plain objects for CSV/Excel
     */
    exportArticlesForExcel: function(articleSysIds) {
        var exportData = [];
        
        for (var i = 0; i < articleSysIds.length; i++) {
            var gr = new GlideRecord('kb_knowledge');
            if (gr.get(articleSysIds[i])) {
                exportData.push({
                    sys_id: '',
                    kb_knowledge_base: gr.getDisplayValue('kb_knowledge_base'),
                    kb_category: gr.getDisplayValue('kb_category'),
                    short_description: gr.getValue('short_description'),
                    text: this.stripHtml(gr.getValue('text')),
                    keywords: gr.getValue('keywords'),
                    workflow_state: gr.getValue('workflow_state'),
                    author: gr.getDisplayValue('author')
                });
            }
        }
        
        return exportData;
    },

    /**
     * Strip HTML tags from text for Excel export
     * @param {string} html - HTML text
     * @returns {string} Plain text
     */
    stripHtml: function(html) {
        if (!html) return '';
        return html.replace(/<[^>]*>/g, '')
                   .replace(/&/g, '&')
                   .replace(/</g, '<')
                   .replace(/>/g, '>')
                   .replace(/"/g, '"')
                   .replace(/&#39;/g, "'");
    },

    type: 'KnowledgeUtils'
};
