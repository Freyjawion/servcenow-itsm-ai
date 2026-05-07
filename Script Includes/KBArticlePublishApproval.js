/**
 * Business Rule: KB Article Publish Approval
 * 
 * Table: kb_knowledge
 * When: before | insert | update
 * Condition: current.kb_knowledge_base.name == "Technical Knowledge Base"
 *            AND current.workflow_state.changesTo("published")
 * Order: 100
 * 
 * Description:
 * For Technical Knowledge Base articles, when a user tries to set state to "published":
 * - If user has knowledge_manager role → allow direct publish
 * - Otherwise → force to "pending_approval" state and trigger notification
 * 
 * This ensures Technical KB requires approval before articles go live.
 */

(function executeRule(current, previous /*null when async*/) {
    
    // Only applies to Technical Knowledge Base
    var kbGr = new GlideRecord('kb_knowledge_base');
    if (!kbGr.get(current.getValue('kb_knowledge_base'))) return;
    
    if (kbGr.getValue('name') !== 'Technical Knowledge Base') return;
    
    // Only applies when trying to publish
    var newState = current.getValue('workflow_state');
    if (newState !== 'published') return;
    
    var oldState = previous ? previous.getValue('workflow_state') : '';
    
    // If already published, allow
    if (oldState === 'published') return;
    
    // Check if user can auto-publish
    var canAutoPublish = gs.hasRole('admin') || 
                         gs.hasRole('knowledge_manager') || 
                         gs.hasRole('knowledge_admin');
    
    if (canAutoPublish) {
        // Allow direct publish for authorized users
        gs.info('KB Publish: Article ' + current.number + 
                ' auto-published by ' + gs.getUserDisplayName());
        return;
    }
    
    // Force to pending_approval state
    current.setValue('workflow_state', 'pending_approval');
    
    // Add work note about reason
    var notes = current.getValue('work_notes') || '';
    notes += '\n[System] Publication requires approval. Article moved to Pending Approval state.';
    current.setValue('work_notes', notes);
    
    // Trigger approval notification event
    gs.eventQueue('knowledge.article.pending_approval', current, 
                  current.getValue('kb_knowledge_base'), 
                  'Article ' + current.number + ' requires approval to publish');
    
    gs.info('KB Publish: Article ' + current.number + 
            ' moved to pending_approval (requires approval from knowledge manager).');

})(current, previous);
