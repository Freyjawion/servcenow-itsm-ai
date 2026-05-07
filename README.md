# ServiceNow ITSM Demo - 手动部署指南

## 概述

本 Demo 模拟了一个 IT 服务公司使用 ServiceNow ITSM 进行客户系统维护的场景，实现了三层 Support Group 架构（L1/L2/L3）。

### 核心需求

客户是一个 **IT 服务公司**，需要 Support 很多客户的系统维护工作，所以成立了多个 **Group** 来对应客户：

```
L1 → 直接面对客户（多组，按 Category 分配）
    ├── Hardware Support     ← Hardware 类 Incident
    ├── Software Support     ← Software 类 Incident
    ├── Network Support      ← Network 类 Incident
    └── Others Support       ← 其他类 Incident

L2 → 处理 L1 对应不了的 Incident（唯一组）
    └── L2 Support Team      ← Escalated / Problem / Change

L3 → 对应 Change（多组）
    ├── Change Management - Infrastructure
    ├── Change Management - Application
    └── Change Management - Security
```

### 权限规则

| 角色 | 用户 | 权限说明 |
|:----:|:----:|----------|
| L1 客服 | 每个 L1 Group 内的用户 | 只能看到**分配给自己 Group** 的 Incident |
| L2 客服 | L2 Support Team 内的用户 | 统一管理，看到所有升级上来的 Incident |
| L3 客服 | Change 组内的用户 | 管理 Change Request，可以有多个组对应不同问题 |
| 普通用户 | Portal 用户 | 通过 Portal 提交 Incident |

### 功能清单

1. **Incident Management** - Portal 提报 → 按 Category 自动分配 L1 Group → 状态变化通知
2. **L1→L2 Escalation** - L1 无法解决时升级到 L2
3. **Email 创建 Incident** - 用户发邮件即可自动创建 Incident
4. **Problem Management** - L2 从 Incident 创建 Problem 追踪根本原因
5. **Change Management** - 从 Problem 创建 Change，自动流程、CAB 审批
6. **Knowledge Management** - 双知识库（Technical + Employee），Portal 浏览
7. **SLA Management** - 根据 Priority 启动 Response/Resolution SLA、75%/90%/Breach 通知
8. **Reports & Dashboard** - 12 份报告 + 1 个统一 Dashboard

---

## 手动创建步骤

> 本项目**所有源代码文件**在仓库中可以直接复制使用。以下步骤按顺序操作即可。

### Step 1：创建 Support Groups

导航到: 导航到: `User Administration > Groups` → New

| Name | Type | Description |
|:-----|:----:|-------------|
| Hardware Support | L1 | Handles Hardware-related incidents |
| Software Support | L1 | Handles Software-related incidents |
| Network Support | L1 | Handles Network-related incidents |
| Others Support | L1 | Handles Other incidents |
| L2 Support Team | L2 | Handles escalated incidents from L1 |
| Change Management - Infrastructure | L3 | Manages Infrastructure changes |
| Change Management - Application | L3 | Manages Application changes |
| Change Management - Security | L3 | Manages Security changes |

> 也可在 `sys_user_group.list` 中批量导入 `Groups/sys_user_group.xml`（若导入失败则手动创建）

### Step 2：创建自定义字段（可选）

导航到: `System Definition > Tables` → `incident` → New Field

| 表 | 字段名 | 类型 | 用途 |
|:---:|:------:|:----|------|
| incident | u_original_l1_group | Reference (sys_user_group) | 记录升级前归属的 L1 组 |
| problem | u_source_incident | Reference (incident) | Problem 创建来源的 Incident |
| change_request | u_source_problem | Reference (problem) | Change 创建来源的 Problem |
| task_sla | u_last_notified_percentage | Integer | 最后通知的 SLA 进度百分比 |

### Step 3：创建 Script Includes

导航到: `System Definition > Script Includes` → New

| Name | 源文件路径 | 用途 |
|:-----|:----------:|------|
| ITSMGroupAssignment | `Script Includes/ITSMGroupAssignment.js` | 根据 Category 分配 L1 Group / 升级到 L2 |
| ITSMNotificationUtils | `Script Includes/ITSMNotificationUtils.js` | 发送各类邮件通知 |
| ITSMEmailParser | `Script Includes/ITSMEmailParser.js` | 解析邮件内容创建 Incident |
| ProblemUtils | `Script Includes/ProblemUtils.js` | Problem 管理逻辑 |
| ChangeUtils | `Script Includes/ChangeUtils.js` | Change 管理逻辑 |
| ChangeStateNotification | `Script Includes/ChangeStateNotification.js` | Change 状态变化通知 |
| InfrastructureChangeFlow | `Script Includes/InfrastructureChangeFlow.js` | Infrastructure Change 自动流程 |
| KnowledgeUtils | `Script Includes/KnowledgeUtils.js` | 知识库管理逻辑 |
| KBArticleAutoPublish | `Script Includes/KBArticleAutoPublish.js` | 知识文章自动发布 |
| KBArticlePublishApproval | `Script Includes/KBArticlePublishApproval.js` | 知识文章发布审批 |
| ProblemStateChangeNotification | `Script Includes/ProblemStateChangeNotification.js` | Problem 状态变化通知 |
| SLAUtils | `Script Includes/SLAUtils.js` | SLA 管理逻辑 |
| StartSLAOnIncidentCreate | `Script Includes/StartSLAOnIncidentCreate.js` | Incident 创建时启动 SLA |
| StopSLAOnIncidentResolve | `Script Includes/StopSLAOnIncidentResolve.js` | Incident 解决/关闭时停止 SLA |
| SLACheckScheduledJob | `Script Includes/SLACheckScheduledJob.js` | 定时扫描 SLA 进度并触发通知 |

**创建方法：**
1. 打开 `Script Includes/` 目录下的对应 `.js` 文件
2. 全选复制代码内容
3. 在 ServiceNow Script Includes 页面粘贴并保存
4. 注意保留脚本开头的 `var ClassName = Class.create();` 结构

### Step 4：创建 Business Rules

导航到: `System Definition > Business Rules` → New

| Name | Table | When | Condition | Order | 源文件 |
|:-----|:-----:|:----:|:---------:|:-----:|:------:|
| Set L1 Group Assignment | incident | `before` insert, update | `current.category.changes() \|\| current.assignment_group.nil()` | 100 | `Business Rules/SetL1GroupAssignment.js` |
| L1 to L2 Escalation | incident | `before` update | `current.escalation.changes() && current.escalation == 2` | 200 | `Business Rules/L1toL2Escalation.js` |
| Restrict Incident Visibility | incident | `before` query | `current.assignment_group != ''` | 100 | `Business Rules/RestrictIncidentVisibility.js` |
| State Change Notification | incident | `after` update | `current.state.changes()` | 100 | `Business Rules/StateChangeNotification.js` |

**创建方法：** 同 Script Includes - 打开 `.js` 文件复制代码，粘贴到 Business Rule 编辑器中保存。

### Step 5：创建 ACL 规则

导航到: `System Security > Access Controls (ACL)` → New

| Name | Table | Operation | Condition | Role | Source File |
|:-----|:-----:|:---------:|-----------|:----:|:-----------:|
| itsm_acl_incident_mygroup | incident | read | `assignment_group == gs.getUser().getMyGroups()` | — | `ACLs/incident_visible_my_group.xml` |

**创建方法：** 打开 `ACLs/` 目录下的 XML 文件参考配置。

> ⚠️ **L1 用户只看到本组 Incident 的原理：**
> - 通过 ACL 规则 `assignment_group == gs.getUser().getMyGroups()` 实现
> - 只有 Incident 的 Assignment Group 在用户所属的组列表中时，用户才能看到该 Incident
> - 这是实现 **L1 多组隔离** 的核心机制

### Step 6：创建 Category / Subcategory Choice List

导航到: `System Definition > Choices` → New

**Category (table: incident, element: category)**

| Value | Label | Sequence |
|-------|-------|:--------:|
| Hardware | Hardware | 100 |
| Software | Software | 200 |
| Network | Network | 300 |
| Others | Others | 400 |

**Subcategory (table: incident, element: subcategory)**

| Value | Label | Dependent Value | Sequence |
|-------|-------|:--------------:|:--------:|
| Laptop | Laptop | Hardware | 100 |
| Desktop | Desktop | Hardware | 200 |
| Printer | Printer | Hardware | 300 |
| Server | Server | Hardware | 400 |
| OS | OS | Software | 100 |
| Office | Office | Software | 200 |
| ERP | ERP | Software | 300 |
| CRM | CRM | Software | 400 |
| Router | Router | Network | 100 |
| Switch | Switch | Network | 200 |
| Firewall | Firewall | Network | 300 |
| VPN | VPN | Network | 400 |
| General | General Inquiry | Others | 100 |
| Account | Account Issue | Others | 200 |

> 同样为 `problem`、`change_request`、`kb_knowledge` 表创建相同的 Choices。

### Step 7：创建 Notification 通知

导航到: `System Notification > Email > Notifications` → New

| Name | Table | When to Send | Who will Receive | Source File |
|:-----|:-----:|:------------:|:----------------:|:-----------:|
| Incident Created | incident | record inserted | Assigned group | `Notifications/incident_created.xml` |
| Incident Assigned | incident | assignment_group changes | New assigned group | `Notifications/incident_assigned.xml` |
| Incident State Changed | incident | state changes | Assigned group | `Notifications/incident_state_changed.xml` |
| Incident Escalated | incident | escalation changes | L2 Support Team | `Notifications/incident_escalated.xml` |
| Problem Created | problem | record inserted | L2 Support Team | `Notifications/problem_created.xml` |
| Problem State Changed | problem | state changes | L2 Support Team | `Notifications/problem_state_changed.xml` |
| Change Created | change_request | record inserted | Assigned group | `Notifications/change_created.xml` |
| Change State Changed | change_request | state changes | Assigned group | `Notifications/change_state_changed.xml` |
| Change CAB Approval | change_request | state = assess | CAB group | `Notifications/change_cab_approval.xml` |
| SLA 75% Warning | task_sla | sla_75_percent event | Assigned group | `SLA/sla_75_percent_notification.xml` |
| SLA 90% Urgent | task_sla | sla_90_percent event | Assigned group | `SLA/sla_90_percent_notification.xml` |
| SLA Breach | task_sla | sla_breached event | Assigned group | `SLA/sla_breach_notification.xml` |

**创建方法：** 在 Notifications 界面参考 XML 内容配置:
- 设置 **Table**
- 设置 **When to send**（Advanced → Condition）
- 设置 **Who will receive**（Group/User）
- 编写 **Email template**（Subject + Message HTML）

### Step 8：创建 Inbound Email Action

导航到: `System Notification > Email > Inbound Actions` → New

| Name | Table | Type | Source File |
|:-----|:-----:|:----:|:-----------:|
| Create Incident from Email | incident | Create New | `Inbound Email/create_incident_from_email.xml` |

**关键配置：**
- **Condition**: `email.subject != ''`
- **Action**: 使用 `new ITSMEmailParser().processEmail(email)` 解析邮件内容创建 Incident
- 邮件主题 → Incident short_description
- 邮件正文 → Incident description

### Step 9：创建 SLA Definitions

导航到: `SLA > SLA Definitions` → New

**Response SLA（按 Priority）**

| Name | Table | Type | Duration | Condition |
|:-----|:-----:|:----:|:--------:|:----------|
| SLA - Response P1 | task_sla | Response | 15 分钟 | `priority == 1` |
| SLA - Response P2 | task_sla | Response | 1 小时 | `priority == 2` |
| SLA - Response P3 | task_sla | Response | 4 小时 | `priority == 3` |
| SLA - Response P4 | task_sla | Response | 8 小时 | `priority == 4` |

**Resolution SLA（按 Priority）**

| Name | Table | Type | Duration | Condition |
|:-----|:-----:|:----:|:--------:|:----------|
| SLA - Resolution P1 | task_sla | Resolution | 1 小时 | `priority == 1` |
| SLA - Resolution P2 | task_sla | Resolution | 4 小时 | `priority == 2` |
| SLA - Resolution P3 | task_sla | Resolution | 24 小时 | `priority == 3` |
| SLA - Resolution P4 | task_sla | Resolution | 48 小时 | `priority == 4` |

> SLA 定义参考 `SLA/sla_definitions.xml` 中的配置。

### Step 10：创建 Scheduled Job

导航到: `System Definition > Scheduled Jobs` → New

| Name | Type | Run | Script File |
|:-----|:----:|:---:|:-----------:|
| SLA Check Job | Run Script | Every 5 minutes | `Script Includes/SLACheckScheduledJob.js` |

> 将此 Script Include 的内容配置到 Scheduled Job 的 Script 字段中。

### Step 11：创建 Knowledge Bases

导航到: `Knowledge > Knowledge Bases` → New

| Name | ID | Description |
|:-----|:--:|-------------|
| Technical Knowledge Base | itsm_kb_technical | 技术团队使用的 KB |
| Employee Knowledge Base | itsm_kb_employee | 所有员工使用的 KB |

**KB Categories（每个 KB 创建以下分类）：**
- Hardware Issues
- Software Issues
- General FAQ

> 参考 `Knowledge Management/kb_config.xml`

**Knowledge ACLs（参考 `Knowledge Management/kb_knowledge_acl.xml`）：**

| Base | Access | Roles |
|:----:|:------:|:------:|
| Technical KB | Read | knowledge_user |
| Technical KB | Write | knowledge_admin |
| Employee KB | Read | —（所有人可见） |

### Step 12：创建 Service Portal Widgets

导航到: `Service Portal > Widgets` → New

| Widget Name | 源文件位置 | 用途 |
|:------------|:----------:|------|
| Incident Creator | `Service Portal/widget-incident-creator/` | 用户提交 Incident 的表单 |
| My Group Incidents | `Service Portal/widget-my-group-incidents/` | L1 客服查看本组 Incident |
| Knowledge Article Browser | `Service Portal/widget-knowledge-articles/` | Portal 中浏览知识文章 |
| Incident to Problem | `Service Portal/widget-incident-to-problem/` | L2 从 Incident 创建 Problem |
| Problem to Change | `Service Portal/widget-problem-to-change/` | L3 从 Problem 创建 Change |

每个 Widget 包含 5 个文件：
- `widget.xml` - Widget 定义（可直接导入）
- `server_script.js` - 服务端逻辑
- `client_script.js` - 客户端逻辑
- `widget_html_template.html` - HTML 模板
- `css_styles.css` - CSS 样式

**创建方法：**
1. 在 Studio 中创建 Widget，将各文件内容粘贴到对应编辑器
2. 或者直接导入 `widget.xml`（如果导入功能可用）

**添加到 Portal 页面：**
1. 导航到 `Service Portal > Designer`
2. 选择目标页面（如 `home`）
3. 点击 **Add Widget**，从列表中选择已创建的 Widget
4. 拖拽到合适位置后保存

### Step 13：创建 Reports

导航到: `Reports > Create New`

| # | 报告名称 | 表 | 图表类型 | 源文件 |
|:-:|:---------|:--:|:-------:|:-------:|
| 01 | Incidents by Category | incident | Bar Chart | `Reports/01-Incidents-by-Category-Bar.xml` |
| 02 | Incidents by Priority | incident | Pie Chart | `Reports/02-Incidents-by-Priority-Pie.xml` |
| 03 | Incidents Over Time | incident | Line Chart | `Reports/03-Incidents-Over-Time-Line.xml` |
| 04 | Incidents by Group | incident | Column Chart | `Reports/04-Incidents-by-Group-Column.xml` |
| 05 | Category × Priority | incident | Pivot Table | `Reports/05-Incident-Category-Priority-Matrix.xml` |
| 06 | Open Incidents | incident | List Report | `Reports/06-Open-Incidents-List.xml` |
| 07 | SLA Breaches by Type | task_sla | Bar Chart | `Reports/07-SLA-Breaches-Bar.xml` |
| 08 | Avg Resolution Time | incident | Single Score | `Reports/08-Incident-Resolution-Time-SingleScore.xml` |
| 09 | Problems by Category | problem | Donut Chart | `Reports/09-Problems-by-Category-Donut.xml` |
| 10 | Problems by State | problem | Stacked Bar | `Reports/10-Problems-by-State-StackedBar.xml` |
| 11 | Changes by Type | change_request | Pie Chart | `Reports/11-Changes-by-Type-Pie.xml` |
| 12 | Changes Over Time | change_request | Line Chart | `Reports/12-Changes-Over-Time-Line.xml` |

### Step 14：创建 Dashboard

导航到: `Dashboards > Create New`

- 名称: **ITSM Operations Dashboard**
- 分为 2 个 Tab 页，参考以下布局：

```
Tab 1: "Incident Overview"
├── Column 1: #1 Category Bar + #3 Over Time Line
├── Column 2: #2 Priority Pie + #4 By Group Column
└── Column 3: #8 Avg Resolution Time + #5 Category×Priority Pivot
+ #6 Open Incidents List (全宽)

Tab 2: "Problem & Change"
├── #9 Problems by Category Donut + #10 by State Stacked Bar
├── #11 Changes by Type Pie + #12 Over Time Line
└── #7 SLA Breaches Bar
```

### Step 15：创建测试用户

导航到: `User Administration > Users` → New

| User ID | Name | Group Assignment | Roles |
|:--------|:-----|:----------------|:------|
| lisa.wang | Lisa Wang | Hardware Support | itsm_l1_agent |
| tom.chen | Tom Chen | Software Support | itsm_l1_agent |
| david.li | David Li | Network Support | itsm_l1_agent |
| emma.zhang | Emma Zhang | L2 Support Team | itsm_l2_agent |
| bob.liu | Bob Liu | Change Management - Infrastructure | itsm_l3_agent, change_manager |
| alice.wu | Alice Wu | Change Management - Application | itsm_l3_agent, change_manager |
| user.john | John Smith | (不分配组) | (无角色 - 普通用户) |

---

## 验证流程

创建完成后，按以下顺序测试 Demo 功能：

| # | 测试 | 操作 | 预期结果 |
|:-:|:-----|:-----|:---------|
| 1 | Portal 提交 Incident | `user.john` 登录 Portal → 选择 Category=Hardware → 提交 | Incident 自动分配到 Hardware Support Group |
| 2 | L1 可见性验证 | `lisa.wang` 登录 → 查看 Incident | 只能看到 Hardware Support 组的 Incident |
| 3 | L1→L2 升级 | L1 将 Incident escalation 设为 2 | 自动分配到 L2 Support Team，发通知 |
| 4 | 状态变化通知 | 修改 Incident state 为 In Progress | 发邮件通知分配组 |
| 5 | 邮件创建 Incident | 发邮件到配置的邮箱 | 自动创建新 Incident |
| 6 | SLA 启动 | 创建 Priority=1 的 Incident | 自动启动 Response 15min + Resolution 1h |
| 7 | SLA 通知 | 等待 SLA 进度到达 75%/90%/100% | 75% 警告邮件 → 90% 紧急邮件 → Breach |
| 8 | 创建 Problem | L2 在 Portal 从 Incident 创建 Problem | Problem 创建并关联 Incident |
| 9 | 创建 Change | L2/L3 从 Problem 创建 Change | Change 进入 Assess 状态 |
| 10 | Dashboard 查看 | 打开 ITSM Operations Dashboard | 12 份报告自动展现数据 |
| 11 | 浏览 KB | Portal 中打开 Knowledge 页面 | 根据用户权限显示可访问的 KB |

---

## 关键设计说明

### Category → L1 Group 分配关系

| 用户选择 Category | 自动分配的 L1 Group |
|:------------------|:-------------------:|
| Hardware | Hardware Support |
| Software | Software Support |
| Network | Network Support |
| Others | Others Support |

### SLA 时长配置

| Priority | Response SLA | Resolution SLA |
|:--------:|:------------:|:--------------:|
| 1 - Critical | 15 分钟 | 1 小时 |
| 2 - High | 1 小时 | 4 小时 |
| 3 - Medium | 4 小时 | 24 小时 |
| 4 - Low | 8 小时 | 48 小时 |

### L1 可见性隔离原理

通过 ACL 规则 `assignment_group == gs.getUser().getMyGroups()` 实现：
- 只有 `incident.assignment_group` 在用户的组成员列表中时，用户才能看到该 Incident
- 每个 L1 用户被分配到一个 Group（如 Hardware Support）
- 所以 L1 用户只能看到本组的 Incident，无法看到其他 L1 组的 Incident
- L2 用户可以看到所有 Incident（特殊角色权限）

---

## 目录结构说明

```
├── Script Includes/       → Script Include (.js) 源码
├── Business Rules/        → Business Rule (.js) 源码
├── ACLs/                  → ACL 配置 (.xml)
├── Notifications/         → 通知配置 (.xml)
├── Inbound Email/         → 邮件处理配置 (.xml)
├── Groups/                → Group 配置 (.xml)
├── SLA/                   → SLA 定义 + 通知配置 (.xml)
├── Knowledge Management/  → KB 配置 + 示例数据 (.xml/.csv)
├── Service Portal/        → Widget 源码 (widget/ 目录)
├── Reports/               → 报告定义 (.xml)
└── update-sets/           → Update Set 文件（实验性，不保证可用）
```
