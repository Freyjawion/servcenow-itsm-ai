# ServiceNow ITSM Demo - PDI 导入指南

## 概述
本 Demo 模拟了一个 IT 服务公司使用 ServiceNow ITSM 进行客户系统维护的场景。
实现了三层 Support Group 架构（L1/L2/L3），包含六大模块：

1. **Incident Management** - Portal提报、自动分配、邮件通知、邮件创建、L1→L2升级
2. **Problem Management** - L2 从 Incident 创建 Problem 追踪根本原因
3. **Change Management** - L2/L3 从 Problem 创建 Change，Infrastructure 自动流程、CAB 审批
4. **Knowledge Management** - 创建 KB、发布流程控制、权限控制、Portal 浏览
5. **SLA Management** - 根据 Priority 自动启动 Response/Resolution SLA、75%/90%/Breach 通知
6. **Reports & Dashboard** - 12 份各类报告（Bar/Pie/Line/Column/Pivot/SingleScore/List/Donut），1 个统一 Dashboard，支持时间范围自由切换

## 架构说明

```
┌──────────────────────────────────────────────────────────┐
│                    SLA Management                         │
│  ┌────────────────────┐  ┌────────────────────────┐      │
│  │ Response SLA       │  │ Resolution SLA          │      │
│  │ P1: 15min           │  │ P1: 1hr                │      │
│  │ P2: 1hr            │  │ P2: 4hrs               │      │
│  │ P3: 4hrs           │  │ P3: 24hrs              │      │
│  │ P4: 8hrs           │  │ P4: 48hrs              │      │
│  └────────────────────┘  └────────────────────────┘      │
│  75% → Warning │ 90% → Urgent │ 100% → Breach           │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────┐
│                         Reports & Dashboard                      │
│  ┌──────┐ ┌─────┐ ┌───────┐ ┌───────┐ ┌────────┐ ┌────────┐   │
│  │ Bar  │ │ Pie │ │ Line  │ │Column │ │ Pillar │ │ Donut  │   │
│  │ 图表  │ │ 图表 │ │ 图表   │ │ 图表   │ │ 表     │ │ 图表   │   │
│  └──────┘ └─────┘ └───────┘ └───────┘ └────────┘ └────────┘   │
│  ┌─────────┐ ┌──────────────┐ ┌──────────┐ ┌──────────────┐   │
│  │List Rpt │ │ Single Score │ │ Pivot    │ │ Stacked Bar  │   │
│  │列表     │ │ 单一指标      │ │ 透视表   │ │ 堆积柱状图   │   │
│  └─────────┘ └──────────────┘ └──────────┘ └──────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ITSM Operations Dashboard (2 Tabs, 时间范围自由切换)      │ │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘

L1 Groups (多组, 按 Category 分配)
├── Hardware Support     ← Hardware 类 Incident
├── Software Support     ← Software 类 Incident
├── Network Support      ← Network 类 Incident
└── Others Support       ← 其他类 Incident

L2 Group (唯一组)
└── L2 Support Team      ← Escalated / Problem / Change

L3 Groups (多组, 对应 Change)
├── Change Management - Infrastructure
├── Change Management - Application
└── Change Management - Security
```

---

## 快速安装方式

本 Demo 提供 **两种安装方式**，推荐使用 **方式一 (Update Set)**。

---

### 方式一：Update Set 导入（推荐 ⭐）

项目提供了 **3 个 Update Set XML 文件**，位于 `update-sets/` 目录下，按顺序导入即可自动创建大部分组件。

#### 导入顺序

| 顺序 | XML 文件 | 导入内容 | 预计时间 |
|:---:|----------|---------|:-------:|
| 1 | `ITSM_Demo_Core.xml` | 核心配置: 7个Script Includes, 11个Business Rules, 4个ACLs, 1个Scheduled Job | 2分钟 |
| 2 | `ITSM_Demo_Notifications_SLA.xml` | 通知+SLA+KB: 8个SLA定义, 13个邮件通知, 1个Inbound Email Action, 2个Knowledge Bases, 6个KB Categories, 8个Support Groups | 3分钟 |
| 3 | `ITSM_Demo_Portal_Reports.xml` | Portal+报表: 3个Service Portal Widgets, 12个报表, 1个Dashboard | 2分钟 |

#### 导入操作步骤

1. 登录 ServiceNow 实例（如 PDI）
2. 导航到 `System Update Sets > Retrieved Update Sets`
3. 点击 **Import Update Set from XML** 按钮
4. 依次选择上述 3 个 XML 文件上传
5. 上传后找到对应的 Update Set，点击 **Preview Update Set**
6. 预览确认无误后，点击 **Commit Update Set** 提交
7. 重复步骤 3-6，按顺序完成 3 个 Update Set 的导入

#### ⚠️ 常见问题1：ACL 权限拒绝

如果在 Commit **Update Set 1** 时看到以下错误：

```
Error: Skipping record for table sys_security_acl and id itsm_acl_incident_mygroup - permission denied
Error: Skipping record for table sys_security_acl and id itsm_acl_kb_admin - permission denied
Error: Skipping record for table sys_security_acl and id itsm_acl_kb_technical - permission denied
Error: Skipping record for table sys_security_acl and id itsm_acl_kb_employee - permission denied
```

**原因**：ServiceNow 的 `sys_security_acl` 表需要 `security_admin` 角色才能通过 Update Set 导入。

**解决办法（任选其一）**：

1. **推荐：检查角色** — 确认当前用户拥有 `security_admin` 和 `admin` 角色，然后重新 Preview → Commit
2. **手动创建（次选）** — 如果仍然遇到权限问题，忽略这4个ACL错误，然后手动创建：

   | ACL Name | Table | Condition | Operation | Role Required |
   |----------|:-----:|:---------:|:---------:|:-------------:|
   | `itsm_acl_incident_mygroup` | incident | `assignment_group == gs.getUser().getMyGroups()` | read | — |
   | `itsm_acl_kb_admin` | kb_knowledge | `true` | read/write | knowledge_admin |
   | `itsm_acl_kb_technical` | kb_knowledge | `kb_knowledge.kb_knowledge_base.sys_id == 'itsm_kb_technical'` | read | knowledge_user |
   | `itsm_acl_kb_employee` | kb_knowledge | `kb_knowledge.kb_knowledge_base.sys_id == 'itsm_kb_employee'` | read | —(所有人可见) |

   手动创建路径：`System Security > Access Controls (ACL)` → New

#### ⚠️ 常见问题2：Dashboard 权限拒绝

如果在 Commit **Update Set 3** 时看到以下错误：

```
Error: Skipping record for table pa_dashboards and id itsm_dashboard_main - permission denied
```

**原因**：`pa_dashboards` 表（Performance Analytics Dashboard）需要 `pa_admin` 或 `admin` 角色才能导入。
PDI 的 admin 默认有该权限，但某些受限实例限制了 Dashboard 导入。

**解决办法**：

1. 忽略这个错误，继续导入 Update Set 3（报告仍然可以正常创建）
2. 手动创建 Dashboard：
   - 导航到 `Dashboards > Create New`
   - 名称：`ITSM Operations Dashboard`
   - 手动将已导入的12个报告添加到 Dashboard 中

   > 详细 Dashboard 布局参考本章节最后的 **"Dashboard 布局"** 说明


#### 导入后的必要手动操作

Update Set 导入完成后，还需要完成以下 **手动操作** 才能让 Demo 完全运行：

> 详见下文 **"三、必须手动操作的部分"** 章节

---

### 方式二：手动创建全部组件

如果你希望逐个组件手动创建以加深理解，可按照目录结构中的源代码逐项创建。

详见各目录下的 `.js`/`.xml` 源文件，包含完整代码和注释。

---

## Update Set 覆盖范围对照表

下表清晰展示了哪些组件由 Update Set 自动导入，哪些需要手动操作：

### ✅ Update Set 已自动导入（无需手动操作）

| 组件 | 导入自 | 数量 | 备注 |
|------|:------:|:----:|------|
| Support Groups | Update Set 2 | 8个 | Hardware/Software/Network/Others/L2/Change x3 |
| Script Includes | Update Set 1 | 7个 | 核心逻辑: 分配/通知/邮件/Problem/Change/KB/SLA |
| Business Rules | Update Set 1 | 11个 | Before/After 规则全覆盖 |
| ACL Rules | Update Set 1 | 4个 | Incident可见性 + KB访问控制 |
| SLA Definitions | Update Set 2 | 8个 | Response x4 + Resolution x4 |
| Email Notifications | Update Set 2 | 13个 | Incident/Problem/Change/KB/SLA全链路通知 |
| Inbound Email Action | Update Set 2 | 1个 | 邮件创建 Incident |
| Knowledge Bases | Update Set 2 | 2个 | Technical KB + Employee KB |
| KB Categories | Update Set 2 | 6个 | 各3个分类 |
| Scheduled Job | Update Set 1 | 1个 | SLA检查(每5分钟) |
| Reports | Update Set 3 | 12个 | Bar/Pie/Line/Column等各类图表 |
| Dashboard | Update Set 3 | 1个 | ITSM Demo Dashboard含9个Panel |
| Portal Widgets | Update Set 3 | 3个 | Incident Creator/My Group Incidents/KB Browser |

### ⚠️ 必须手动操作（Update Set 无法覆盖）

以下内容需要手动配置：

| # | 操作 | 路径 | 原因 | 预计时间 |
|:-:|------|------|------|:--------:|
| 1 | 创建测试用户并分配组/角色 | `User Administration > Users` | Update Set不包含用户数据 | 5分钟 |
| 2 | 配置 Category/Subcategory Choices | `System Definition > Choices` | Choice列表需手动关联表 | 3分钟 |
| 3 | 将Widget添加到Portal页面 | `Service Portal > Designer` | Widget需要手动拖放到页面 | 5分钟 |
| 4 | 导入知识文章示例数据(可选) | `Knowledge > Articles > Import CSV` | 示例数据需要手动导入 | 2分钟 |
| 5 | 配置Inbound Email邮箱(可选) | `System Notification > Email > Inbound Mail` | 需要配置具体的邮箱账户 | 3分钟 |
| 6 | 创建Portal Page(可选) | `Service Portal > Pages` | 如果不想使用默认页面 | 5分钟 |
| 7 | 添加自定义字段(可选) | `System Definition > Tables` | 额外的扩展字段 | 3分钟 |

---

## 必须手动操作的部分 - 详细说明

### Step 1：创建测试用户并分配角色

导航到: `User Administration > Users` 或 `sys_user.list`

| User ID | Name | Group Assignment | Roles |
|---------|------|----------------|-------|
| lisa.wang | Lisa Wang | Hardware Support | itsm_l1_agent |
| tom.chen | Tom Chen | Software Support | itsm_l1_agent |
| david.li | David Li | Network Support | itsm_l1_agent |
| emma.zhang | Emma Zhang | L2 Support Team | itsm_l2_agent |
| bob.liu | Bob Liu | Change Management - Infrastructure | itsm_l3_agent, change_manager |
| alice.wu | Alice Wu | Change Management - Application | itsm_l3_agent, change_manager |
| user.john | John Smith | (普通用户，不分配组) | (无特殊角色) |
| admin.kb | Admin KB | (无) | knowledge_admin, knowledge_manager |

> **注意**: Groups 和 ACLs 已由 Update Set 自动创建。创建用户后，只需将用户添加到对应 Group 即可。
> 
> `itsm_l1_agent` / `itsm_l2_agent` / `itsm_l3_agent` 角色需要在创建用户时手动勾选。

### Step 2：配置 Category/Subcategory Choice List

导航到: `System Definition > Choices` (`sys_choice.list`)
创建 incident 表的 category 和 subcategory 选项：

**Category Choices (table: incident, element: category)**
| Value | Label | Sequence |
|-------|-------|:--------:|
| Hardware | Hardware | 100 |
| Software | Software | 200 |
| Network | Network | 300 |
| Others | Others | 400 |

**Subcategory Choices (table: incident, element: subcategory)**
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

> 同样为 `problem`、`change_request`、`kb_knowledge` 表创建相同的 Category/Subcategory。
> 可以在创建完 incident 的 choice 后，使用 **Copy Choices** 功能复制到其他表：
> 右键 Choice 列表 → "Copy Choices" → 选择目标表

### Step 3：将 Widget 添加到 Portal 页面

导航到: `Service Portal > Designer`

1. 选择一个现有页面（如 `home` 或 `sc_request`）或创建新页面
2. 点击 **Add Widget** 按钮
3. 从列表中选择已导入的 Widget：
   - **Incident Creator** → 拖到页面中（面向普通用户）
   - **My Group Incidents** → 拖到另一个位置（面向 L1 用户）
   - **Knowledge Article Browser** → 拖到另一个位置（面向所有用户）
4. 点击 **Save** 保存页面布局
5. 访问 Portal 查看效果

### Step 4：导入知识文章示例数据（可选）

导航到: `Knowledge > Articles` 或 `kb_knowledge.list`

1. 点击 **Import** 按钮（或从 Actions 中选择 Import)
2. 选择文件: `11-Knowledge-Management/sample-data/knowledge_articles_export.csv`
3. 确认字段映射（CSV 第一行为表头）
4. 点击 **Import** 完成导入
5. 导入后可以在 Knowledge > Articles 中查看

> 示例数据包含 10 篇知识文章，覆盖 Technical KB 和 Employee KB。

### Step 5：配置 Inbound Email 邮箱（可选）

导航到: `System Notification > Email > Inbound Mail` → New

1. 创建一个新的邮箱记录
2. 输入邮箱地址（如 support@yourcompany.com）
3. 在 Actions 中选择已导入的 **"Create Incident from Email"**
4. 配置邮箱协议（IMAP/POP3）和服务器信息
5. 完成配置后发测试邮件验证

### Step 6：添加自定义字段（可选）

导航到: `System Definition > Tables` → 选择对应表 → New Field

| 表 | 字段名 | 类型 | 用途 |
|:---:|:------:|:----|------|
| incident | u_original_l1_group | Reference (sys_user_group) | 记录升级前归属的L1组 |
| problem | u_source_incident | Reference (incident) | Problem创建来源的Incident |
| change_request | u_source_problem | Reference (problem) | Change创建来源的Problem |
| task_sla | u_last_notified_percentage | Integer | 最后通知的SLA进度百分比 |

> **注意**: 这些字段可以跳过添加（业务逻辑会自动处理空值），添加后可以记录更详细的信息。

---

## Category 与 Group 对应关系

| Category | Assigned L1 Group |
|----------|:----------------:|
| Hardware | Hardware Support |
| Software | Software Support |
| Network | Network Support |
| Others | Others Support |

## SLA Duration 配置

### Response SLA

| Priority | Duration | 含义 | 75%通知 | 90%通知 | Breach |
|:--------:|:--------:|:---:|:-------:|:-------:|:------:|
| 1 - Critical | 15 分钟 | 首次响应时间 | 11.25 min | 13.5 min | 15 min |
| 2 - High | 1 小时 | 首次响应时间 | 45 min | 54 min | 1 hr |
| 3 - Medium | 4 小时 | 首次响应时间 | 3 hrs | 3.6 hrs | 4 hrs |
| 4 - Low | 8 小时 | 首次响应时间 | 6 hrs | 7.2 hrs | 8 hrs |

### Resolution SLA

| Priority | Duration | 含义 | 75%通知 | 90%通知 | Breach |
|:--------:|:--------:|:---:|:-------:|:-------:|:------:|
| 1 - Critical | 1 小时 | 解决时间 | 45 min | 54 min | 1 hr |
| 2 - High | 4 小时 | 解决时间 | 3 hrs | 3.6 hrs | 4 hrs |
| 3 - Medium | 24 小时 | 解决时间 | 18 hrs | 21.6 hrs | 24 hrs |
| 4 - Low | 48 小时 | 解决时间 | 36 hrs | 43.2 hrs | 48 hrs |

## SLA 通知流程

```
Incident Created (after insert)
    ↓
SLAUtils.startResponseSla(incident)  → 创建 task_sla (stage=in_progress)
SLAUtils.startResolutionSla(incident) → 创建 task_sla (stage=in_progress)
    ↓
[Scheduled Job] 每5分钟扫描所有 in_progress 的 SLA
    ↓
进度计算: elapsed_time / total_duration * 100%
    ↓
├── ≥75% 且 lastNotified < 75% → 发送 sla.75_percent 事件 → 邮件通知
├── ≥90% 且 lastNotified < 90% → 发送 sla.90_percent 事件 → 邮件通知
└── ≥100% 且 lastNotified < 100% → 标记 breach → 发送 sla.breached 事件 → 邮件通知
    ↓
Incident Resolved/Closed (state=6/7) → 停止所有 SLAs
Incident Reopened → 重启 SLAs
```

## 知识库发布流程对比

| 特性 | Technical KB | Employee KB |
|------|:------------:|:-----------:|
| 访问权限 | 仅技术团队 (L1/L2/L3) | 所有员工 |
| 发布审批 | ✅ 需要 approval | ❌ 无需审批 |
| 审批者 | knowledge_manager / admin | 不适用 |
| 文章状态流 | Draft → Pending Approval → Published | Draft → Published (自动) |
| 适用场景 | 技术文档、排错指南、配置说明 | FAQ、政策、公司信息 |

## 知识库浏览方式

- 通过 **Service Portal** (Knowledge Article Browser widget)
- 在 Portal 中选择 KB → 搜索文章 → 查看文章详情
- 用户只能看到有权限访问的 KB 和文章
- 文章查看次数会被自动记录

## 知识文章导出/导入流程

```
1. 在后台 Knowledge > Articles 中浏览文章
2. 使用 Export to CSV (或右键导出为 Excel)
3. 在本地 Excel 中修改文章内容
4. 使用 Import 功能 (CSV/Excel Import) 导入回 ServiceNow
5. 导入后，文章可以正常打开和浏览
```

## Change Management 流程

```
L2/L3 在 Problem 调查中发现需要 Change
    ↓
在 Portal 中搜索 Problem → 选择类型 → "Create Change Request"
    ↓
如果是 Infrastructure 类型 → 自动进入 Assess 状态
    ↓
高 Priority (1/2) → CAB 审批通知
    ↓
Scheduled 状态 → 自动创建 2 个 Change Task:
  ├── Pre-implementation Environment Check
  └── Post-implementation Verification
    ↓
Implement → Review → Closed (所有状态变化触发通知)
```

## Reports & Dashboard

共创建了 **12 份报告** 汇总到 **1 个统一 Dashboard**，涵盖 Incident / Problem / Change / SLA 四大模块，所有报告都支持时间范围自由切换。

### 报告清单

| # | 报告名称 | 表 | 图表类型 | 图表用途 |
|:-:|----------|:--:|:-------:|----------|
| 01 | Incidents by Category | incident | **Bar Chart** (条形图) | 按 Category 展示 Incident 分布 |
| 02 | Incidents by Priority | incident | **Pie Chart** (饼图) | 按 Priority 展示占比 |
| 03 | Incidents Over Time | incident | **Line Chart** (时间序列折线图) | Incident 创建趋势 (按天) |
| 04 | Incidents by Group | incident | **Column Chart** (柱状图) | 按 Assignment Group 展示 Top 10 |
| 05 | Category × Priority | incident | **Pivot Table** (透视表) | 行=Category, 列=Priority, 值=COUNT |
| 06 | Open Incidents | incident | **List Report** (列表) | 可筛选/排序/导出 |
| 07 | SLA Breaches by Type | task_sla | **Bar Chart** (条形图) | Response vs Resolution Breach 对比 |
| 08 | Avg Resolution Time | incident | **Single Score** (单一指标) | 平均解决时间 + 目标对比 |
| 09 | Problems by Category | problem | **Donut Chart** (圆环图) | Problem 按 Category 分布 |
| 10 | Problems by State | problem | **Stacked Bar** (堆积柱状图) | Problem 状态管道分布 |
| 11 | Changes by Type | change_request | **Pie Chart** (饼图) | Change 按 Type 分布 |
| 12 | Changes Over Time | change_request | **Line Chart** (时间序列折线图) | Change 创建趋势 (按周) |

### Dashboard 布局

```
┌─────────────────────────────────────────────────────────────────────┐
│                ITSM Operations Dashboard                            │
├─────────────────────────────────────────────────────────────────────┤
│ Tab 1: "Incident Overview"                                          │
├──────────────┬───────────────┬──────────────────────────────────────┤
│ Column 1     │ Column 2      │ Column 3                             │
├──────────────┼───────────────┼──────────────────────────────────────┤
│ #1 Category  │ #2 Priority   │ #8 Avg Resolution Time               │
│ (Bar Chart)  │ (Pie Chart)   │ (Single Score + Goal)                │
├──────────────┼───────────────┼──────────────────────────────────────┤
│ #3 Over Time │ #4 By Group   │ #5 Category × Priority               │
│ (Line Chart) │ (Column Chart)│ (Pivot Table)                        │
├──────────────┴───────────────┴──────────────────────────────────────┤
│ #6 Open Incidents (List Report - 可筛选/排序/导出 PDF/Excel/CSV)    │
├─────────────────────────────────────────────────────────────────────┤
│ Tab 2: "Problem & Change"                                           │
├──────────────┬───────────────┬──────────────────────────────────────┤
│ #9 Problems  │ #10 Problems  │ #11 Changes by Type                  │
│ by Category  │ by State      │ (Pie Chart)                          │
│ (Donut Chart)│ (Stacked Bar) │                                       │
├──────────────┼───────────────┴──────────────────────────────────────┤
│ #12 Changes  │ #7 SLA Breaches by Type                               │
│ Over Time    │ (Bar Chart)                                           │
│ (Line Chart) │                                                       │
└──────────────┴──────────────────────────────────────────────────────┘
```

### Dashboard 核心功能

| 功能 | 说明 |
|------|------|
| **时间范围选择器** | 每个 Report Widget 右上角都有时间范围下拉框 |
| 可选范围 | Today / Last 7 Days / Last 30 Days / Last 90 Days / This Year / Custom Range |
| **自动刷新** | 改变时间范围后，报告内容立即自动更新 |
| **Tab 切换** | Tab1: Incident Overview, Tab2: Problem & Change |
| **导出** | List Report (#6) 可导出为 PDF / Excel / CSV |
| **颜色编码** | Priority 1=红, 2=橙, 3=黄, 4=绿, 5=蓝 |

### Demo 操作指南

1. 导航到 `Dashboards > ITSM Operations Dashboard`
2. 在 "Incident Overview" Tab 中查看 Incident 概况
3. 点击右上角 Time Range 选择 `Last 7 Days`
4. 所有报告自动更新
5. 切换到 "Problem & Change" Tab 查看 Problem 和 Change 概况
6. 在 Open Incidents 报告中点击任意列头排序
7. 点击 Export 按钮导出当前视图

## 完整 Demo 验证流程

| # | 测试 | 操作 | 预期结果 |
|:-:|------|------|----------|
| 1 | Portal 提交 | user.john 登录，提交 Hardware 类 Incident | 自动分配到 Hardware Support |
| 2 | L1 查看 | lisa.wang 登录查看 | 只能看到本组 Incident |
| 3 | **SLA 启动** | 创建 Incident（Priority=1） | 自动启动 Response SLA(15min) + Resolution SLA(1h) |
| 4 | **SLA 通知** | 等待 SLA 进度到达 75%/90%/100% | 75% → 黄色警告邮件; 90% → 橙色紧急邮件; 100% → 红色 Breach 邮件 |
| 5 | **SLA 停止** | 解决/关闭 Incident | 自动停止所有 SLAs |
| 6 | 状态通知 | 修改 Incident 状态 | 邮件通知 |
| 7 | 邮件创建 | 发邮件 | 自动创建 Incident |
| 8 | L1→L2 升级 | Escalate | 分配到 L2 Support Team |
| 9 | 创建 Problem | emma.zhang → 创建 Problem | Problem 创建，Incident 关联 |
| 10 | 创建 Change | emma.zhang → 创建 Infrastructure Change | Change 进入 Assess |
| 11 | CAB 审批 | 高 Priority Change | 通知 CAB 组 |
| 12 | Scheduled Task | 设置 Scheduled | 自动创建 2 个 Task |
| 13 | Change 通知 | 修改状态 | 邮件通知 |
| 14 | **Dashboard 查看** | 打开 Dashboard → 切换时间范围 | 所有报告自动刷新 |
| 15 | 浏览 KB | user.john 登录 Portal → Knowledge | 只能看到 Employee KB |
| 16 | 技术 KB | lisa.wang 登录 Portal → Knowledge | 能看到 Technical KB + Employee KB |
| 17 | 查看文章 | 点击任意文章 | 正常显示文章内容 |
| 18 | 导入/导出 | 导出 CSV → 修改 → 导入 | 导入后文章可正常打开 |
