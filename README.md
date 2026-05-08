# ITSM Demo - ServiceNow PDI

Full ITSM solution with Incident, Problem, Change, Knowledge, SLA, and Service Portal.

## What's Deployed

### Script Includes (7)
| Name | Purpose |
|---|---|
| ITSMGroupAssignment | L1/L2/L3 group assignment by category |
| ITSMNotificationUtils | Incident lifecycle notifications |
| ITSMEmailParser | Parse inbound emails into incidents |
| ProblemUtils | Problem creation from incidents |
| ChangeUtils | Change management & CAB approval |
| KnowledgeUtils | KB access control & publishing |
| SLAUtils | Response/resolution SLA tracking |

### Business Rules (4)
| Name | Table | Trigger |
|---|---|---|
| Set L1 Group Assignment | incident | before insert/update |
| L1 to L2 Escalation | incident | after update |
| State Change Notification | incident | after update |
| Restrict Incident Visibility | incident | before query |

### Other Artifacts
- 8 Support Groups (L1/L2/L3)
- 13 Email Notifications (incident/problem/change/SLA)
- 8 SLA Definitions (4 response + 4 resolution)
- 1 Inbound Email Action
- 2 Knowledge Bases (Technical + Employee)
- 6 KB Categories

## Test Users

| Username | Role | Group |
|---|---|---|
| `lisa.wang` | L1 Agent | Hardware Support |
| `tom.chen` | L1 Agent | Software Support |
| `david.li` | L1 Agent | Network Support |
| `bob.johnson` | L2 Agent | L2 Support Team |
| `alice.smith` | L3 Agent | Change Mgmt - Infrastructure |
| `emily.davis` | Knowledge Admin | — |
| `john.doe` | End user (caller) | — |

All passwords: `demo123`

## Testing Walkthrough

### 1. Incident Lifecycle (L1 Agent)

Impersonate **lisa.wang**:

1. Navigate to **Incidents → New**
2. Fill in:
   - Category: `Hardware`
   - Short Description: `Laptop screen flickering`
3. Submit → Observe auto-assignment to **Hardware Support** group
4. Open the incident → change **State** to `In Progress`
5. Check the **u_escalate_to_l2** checkbox → Update
   - Incident reassigns to **L2 Support Team**

### 2. L2 Escalation (L2 Agent)

Impersonate **bob.johnson**:

1. Navigate to **Incidents → My Groups** → see the escalated incident
2. Open it → note work notes show escalation details
3. Click **"Create Problem"** (or use the ProblemUtils script)
4. A new Problem record is created linked to this incident

### 3. Problem to Change (L3 Agent)

Impersonate **alice.smith**:

1. Open the Problem created above
2. Click **"Create Change"** → an Infrastructure Change is created
3. The change auto-transitions to **Assess** state
4. Note: CAB approval is triggered for high-priority changes

### 4. Knowledge Management

Impersonate **emily.davis**:

1. Navigate to **Knowledge → Create New**
2. Select **Technical Knowledge Base**
3. Write an article → Set workflow to `Published`
4. Since you're Knowledge Admin, it publishes immediately

Impersonate **lisa.wang**:

1. Try creating an article in **Technical Knowledge Base**
2. Set workflow to `Published` → auto-rejected to `Pending Approval`
3. Impersonate **emily.davis** → Approve the article

### 5. Employee Knowledge Base (Auto-Publish)

Impersonate **john.doe**:

1. Create an article in **Employee Knowledge Base** → auto-publishes
2. No approval needed

### 6. SLA Monitoring

1. Create a **Priority 1** incident
2. The "Start SLA on Incident Create" BR triggers response + resolution SLAs
3. Navigate to **SLA Definitions** to see the 8 SLA records
4. SLA notifications fire at 75%, 90%, and 100% of duration

### 7. Service Portal (if deployed)

1. Navigate to `https://dev252230.service-now.com/sp`
2. Add widgets to a page via **Service Portal → Designer**:
   - Incident Creator (end users submit incidents)
   - My Group Incidents (L1 agents view their queue)
   - Knowledge Article Browser (search/read KB)

### 8. Reports & Dashboard

1. Navigate to **Reports → View Dashboard**
2. Select **ITSM Demo Dashboard**
3. Reports include:
   - Incidents by Category (bar)
   - Incidents by Priority (pie)
   - Incidents Over Time (line)
   - SLA Breaches (bar)
   - Problems by Category (pie)
   - Changes by Type (pie)

## Manual Steps Needed

The following require UI creation (REST API restrictions):

- **ACL** (`incident_visible_my_group.xml`) — add via **System Security → ACLs → Import XML**
- **Inbound Email Action** — add via **System Policy → Email → Inbound Actions → Import XML**

Source XML files are available in the git history (`076ed4c` commit).

## Architecture

```
User creates incident
    → L1 Group auto-assigned (by category)
        → L1 agent works it
            → if unresolved: Escalate to L2
                → L2 creates Problem
                    → Problem identified → L3 creates Change
                        → CAB approval → Implement → Close
```

## License

MIT
