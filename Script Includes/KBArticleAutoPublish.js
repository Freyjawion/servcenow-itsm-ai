/**
 * Business Rule: KB Article Auto-Publish
 * 
 * Table: kb_knowledge
 * When: before | insert | update
 * Condition: current.kb_knowledge_base.name == "Employee Knowledge Base"
 *            AND current.workflow_state.changesTo("published")
 *            OR current.isNewRecord()
 * Order: 100
 * 
 * Description:
 * For Employee Knowledge Base articles:
 * - On insert: Auto-set state to "published"
 * - On update: Any attempt to publish is allowed (no approval needed)
 * 
 * This ensures Employee KB content is immediately available to all employees.
 */

(function executeRule(current, previous /*null when async*/) {
    
    // Only applies to Employee Knowledge Base
    var kbGr = new GlideRecord('kb_knowledge_base');
    if (!kbGr.get(current.getValue('kb_knowledge_base'))) return;
    
    if (kbGr.getValue('name') !== 'Employee Knowledge Base') return;
    
    // On new record creation, auto-publish for authorized users
    if (current.isNewRecord() && !previous) {
        var canPublish = gs.hasRole('admin') || 
                         gs.hasRole('knowledge_manager') || 
                         gs.hasRole('knowledge_admin') ||
                         gs.hasRole('itsm_l1_agent') ||
                         gs.hasRole('itsm_l2_agent') ||
                         gs.hasRole('itsm_l3_agent');
        
        if (canPublish) {
            current.setValue('workflow_state', 'published');
            gs.info('KB Auto-Publish: Article ' + current.number + 
                    ' auto-published in Employee KB by ' + gs.getUserDisplayName());
        } else {
            // Regular employees can also publish (no approval needed)
            current.setValue('workflow_state', 'published');
            gs.info('KB Auto-Publish: Article ' + current.number + 
                    ' published in Employee KB by employee ' + gs.getUserDisplayName());
        }
        
        return;
    }
    
    // On update, allow publishing freely
    if (current.getValue('workflow_state') === 'published' && 
        previous && previous.getValue('workflow_state') !== 'published') {
        gs.info('KB Auto-Publish: Article ' + current.number + 
                ' published in Employee KB');
    }

})(current, previous);
