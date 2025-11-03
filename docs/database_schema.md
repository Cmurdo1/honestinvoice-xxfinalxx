# HonestInvoice.com SaaS Database Schema Blueprint: Multi-Tenant, Transparent, and Compliance-Ready

## 1. Executive Summary and Objectives

HonestInvoice.com will differentiate by making billing unambiguously clear, fair, and auditable while delivering a modern, relationship-aware client experience. The platform must enable tenants—agencies, studios, software vendors, and professional services—to issue invoices that are understandable at a glance, reconcile reliably, and stand up to compliance scrutiny. The database design presented here is the backbone for that promise: a normalized, multi-tenant schema that enforces referential integrity, scales through appropriate indexing and partitioning, and documents itself through immutable audit trails.

The scope of this report covers the full logical model across core entities—companies, users, customers, projects, invoices, invoice items, payments, communication logs, transparency scores, client satisfaction, team members, CMS content, and audit trails. It defines relationships, constraints, and indexing strategies aligned to access patterns, and it introduces a compliance-ready posture for disclosure fields, retention policies, and evidence capture. It also outlines integrations with customer relationship management (CRM), content management systems (CMS), payment gateways, and e-invoicing networks.

Four pillars guide the design:

- Radical fee transparency. The database will store and surface a fee matrix by method and geography, publish plan terms, and link every line item and adjustment to its rationale, reducing disputes and improving customer trust[^2][^3][^1].
- Trust-by-design. Immutable audit logs, versioned CMS content, and complete delivery/payment evidence ensure explainability and support independent attestations (e.g., ISO 27001, SOC 2) over time[^1].
- Clear retention policies. Inactive account handling and document deletion windows will be modeled explicitly to mirror market-leading clarity and meet compliance expectations[^2].
- Branded portals by default. Company branding, multilingual content, and self-service capabilities are first-class objects, making invoices easy to understand and pay in the client’s preferred context[^3][^4].

The outcome is a coherent technical architecture that supports operational excellence and regulatory readiness while enabling CRM/CMS-powered experiences. It reduces dispute risk through itemization and justification fields, improves Days Sales Outstanding (DSO) by aligning communication and payment channels to customer preferences, and strengthens auditability through lineage and evidence capture. The design is implementation-focused: it specifies object structures, constraints, indexes, partitioning, and migration plans—balancing normalization with the pragmatic use of JSON for extensible metadata.

[^2]: Avalara. Billing Transparency Builds Customer Trust.
[^3]: VersaPay. How Invoice Personalization Improves AR Customer Experiences.
[^1]: Xero. Security at Xero.

## 2. Design Principles and Assumptions

A robust schema is not only a map of tables; it is a set of enforceable rules that align business policies with technical guarantees. The following principles guide the HonestInvoice data model:

- Normalization first. The model follows a normalized core to avoid duplication, ensure consistency, and minimize update anomalies. Document-like constructs (e.g., CMS templates, invoice rendering payloads) use JSON columns for flexible evolution without destabilizing core relationships.
- Multi-tenant isolation. Every tenant-scoped table includes `tenant_id`. Integrity constraints ensure that foreign keys cannot cross tenant boundaries, and row-level security (RLS) filters access by `tenant_id`.
- Referential integrity. Foreign keys enforce valid relationships; cascading rules are selected to avoid unintended data loss (e.g., soft-delete patterns on user-facing records).
- Auditability and explainability. Immutable `audit_trails` capture actor, entity, action, and before/after states with hash chaining for tamper evidence. Communication logs document delivery attempts, portal views, and payment status changes.
- Localization and multilingual support. Content and customer records carry language and locale codes. CMS templates and invoice content render in the customer’s preferred language, improving clarity and conversion.
- Compliance-ready fields. Invoices expose tax disclosures, fee transparency, and document references. Companies publish fee matrices, retention policies, and support channels. Audit trails retain change records and evidence pointers.
- Extensibility through JSON. Non-critical attributes (e.g., gateway payloads, e-invoice submissions) are stored in JSON to reduce schema churn while maintaining queryability via generated columns when needed.

To make these principles tangible, Table 1 presents a principles-to-implementation mapping.

Table 1: Principles-to-Implementation mapping

| Principle | Database Mechanism | Example |
|---|---|---|
| Normalization | Canonical tables; foreign keys; check constraints | `invoices` → `customers` → `companies` |
| Multi-tenant isolation | `tenant_id` on all tenant-scoped tables; RLS | `CREATE TABLE invoices (...) CHECK (company_id IN (SELECT id FROM companies WHERE tenant_id = :t));` |
| Referential integrity | FKs with RESTRICT/NO ACTION on delete for core entities | `ALTER TABLE invoices ADD CONSTRAINT fk_invoices_customer FOREIGN KEY (customer_id) REFERENCES customers(id);` |
| Auditability | Hash-chained `audit_trails` with immutable inserts | `INSERT INTO audit_trails (...) VALUES (...);` |
| Localization | `language_code`, `locale_code` on customers, CMS content | `UPDATE customers SET language_code='fr', locale_code='fr-FR' WHERE id=:cid;` |
| Compliance-ready | Disclosure JSON, retention policy fields on companies | `companies.fee_matrix_json`, `companies.retention_policy_json` |
| Extensibility | JSON columns with generated indexes for common queries | `invoice_metadata JSON; CREATE INDEX idx_invoices_metadata_status ON invoices USING GIN ((invoice_metadata->'status'));` |

Information gaps acknowledged:

- Payment gateway specifics, jurisdictional tax rate catalogs, PEPPOL access details, precise retention durations per region, and comprehensive legal fields vary by market and partner. The schema includes extension points—fee matrices, disclosure payloads, retention fields, and e-invoice references—to accommodate local requirements without refactoring.

## 3. Conceptual Domain Model

The conceptual model unifies relationships across domains: tenant and company administration; customer and project hierarchies; invoicing and payments; communications and satisfaction; content management and governance; and audit and compliance. Entities divide into tenant-scoped (company, customers, projects, invoices, invoice items, payments, communication logs, transparency scores, client satisfaction, team members, CMS content) and global references (tax rates, languages, locales).

Core relationships:

- Company to customers: one-to-many. Each customer references a billing company.
- Customer to projects: one-to-many. Projects anchor invoicing lines and narrative context.
- Project to invoices: one-to-many. Invoices derive from project milestones and approved scope.
- Invoice to invoice items: one-to-many. Items capture time, expenses, fees, and adjustments.
- Invoice to payments: one-to-many. Payments reconcile with gateway references and statuses.
- Invoice to communications: one-to-many. Delivery attempts, portal views, reminders, and dunning notes.
- Invoice to transparency scores: one-to-one. Per-invoice transparency metrics and evidence.
- Invoice to client satisfaction: one-to-many. Feedback records tied to invoice interactions.
- Company to team members: one-to-many. Users have roles and permissions within the company.
- CMS content: many-to-many with invoices and company. Templates and assets govern rendering.

Lineage across quote-to-cash is explicit. Invoice headers and line items store source references to project milestones and scope documents. Delivery events link to communication logs. Payments reconcile to invoice balances with statuses and gateway payloads. Transparency and satisfaction records enrich invoices with explainability and customer sentiment.

To make access paths and constraints visible, Table 2 summarizes the entity-relationship matrix.

Table 2: Entity-Relationship matrix

| Entity | Key Relationships | Cardinality | Constraints |
|---|---|---|---|
| companies | companies → customers, invoices, team_members, cms_content | 1:N | `tenant_id` mandatory; unique `company_code` per tenant |
| customers | customers → projects, invoices, communications, satisfaction, transparency_scores | 1:N | FK to `companies`; email normalized; unique `customer_number` per company |
| projects | projects → invoices | 1:N | FK to `customers`; status enum; start/end dates validated |
| invoices | invoices → invoice_items, payments, communications, transparency_scores, satisfaction | 1:N | FK to `customers` (and `projects` optional); unique `invoice_number` per company |
| invoice_items | invoice_items → invoices | N:1 | FK to `invoices`; non-overlapping time ranges per project; discount constraints |
| payments | payments → invoices | N:1 | FK to `invoices`; non-negative `amount`; currency code consistency |
| communication_logs | communication_logs → invoices | N:1 | FK to `invoices`; idempotency keys per send attempt |
| transparency_scores | transparency_scores → invoices | 1:1 | FK to `invoices`; score bounds; evidence JSON required |
| client_satisfaction | client_satisfaction → invoices | N:1 | FK to `invoices`; bounded rating scales; consent flags |
| team_members | team_members → companies | N:1 | FK to `companies`; unique `user_id` per company; role-permission checks |
| cms_content | cms_content → companies | N:1 | FK to `companies`; versioned content with approval states |
| audit_trails | audit_trails → any entity | N:1 (polymorphic target via `entity_type`, `entity_id`) | Hash chain enforces immutability; correlation by `correlation_id` |

This model balances clarity and flexibility. JSON columns allow variation across integrations (e.g., CRM metadata, payment gateway payloads, e-invoice submissions) without compromising the core relationships that drive reconciliation and compliance[^4][^3].

[^4]: Fuelfinance. 10 Must-Have Salesforce Integrations for Financial Management.
[^3]: VersaPay. How Invoice Personalization Improves AR Customer Experiences.

## 4. Logical Schema Specification

The following specification details each table’s purpose, key columns, relationships, constraints, indexes, and partitioning where applicable. It emphasizes data integrity, query performance, and compliance readiness. The emphasis is on the “what” and “why,” with sufficient technical specifics to inform implementation.

### 4.1 users

Purpose: authenticate and identify human actors across tenants. The table stores identity and MFA status but intentionally avoids role授权 within a specific company; authorization is modeled via `team_members`.

Columns:

- `id` (UUID, PK)
- `email` (citext, unique, not null)
- `password_hash` (text, not null; no plaintext storage)
- `name` (text, not null)
- `mfa_enabled` (boolean, default false)
- `mfa_secret` (text, nullable; encrypted if present)
- `status` (enum: active, disabled, pending)
- `last_login_at` (timestamptz, nullable)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())
- `deleted_at` (timestamptz, nullable; soft delete)

Indexes:

- Unique: `users_email_key` on `email`
- B-tree: `idx_users_status` on `status`
- B-tree: `idx_users_last_login_at` on `last_login_at`

Constraints:

- `email` unique, citext normalization, non-null
- `password_hash` non-null
- Status enum check

Audit hooks:

- Insert/update/delete logged to `audit_trails` with correlation to user

### 4.2 companies

Purpose: tenant-level entity representing the billing organization. It stores branding, policies, fee matrices, and contact references.

Columns:

- `id` (UUID, PK)
- `tenant_id` (UUID, not null)
- `name` (text, not null)
- `company_code` (citext, not null; unique per tenant)
- `brand_logo_url` (text, nullable)
- `primary_color` (citext, nullable)
- `language_code` (citext, default 'en')
- `locale_code` (citext, default 'en-US')
- `support_email` (citext, not null)
- `support_phone` (text, nullable)
- `support_portal_url` (text, nullable)
- `pricing_disclosure_url` (text, nullable)
- `fee_matrix_json` (jsonb, nullable; method/geography/fees)
- `retention_policy_json` (jsonb, nullable; inactive account handling, deletion windows)
- `default_payment_terms_days` (int, default 30)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())
- `deleted_at` (timestamptz, nullable; soft delete)

Indexes:

- Unique: `companies_tenant_code_key` on (`tenant_id`, `company_code`)
- B-tree: `idx_companies_support_email` on `support_email`

Constraints:

- Check (`default_payment_terms_days` >= 0)
- Foreign key to `users` not required here; ownership is tenant-scoped
- Fee and retention JSONs optional but encouraged

Audit hooks:

- Log changes to `fee_matrix_json`, `retention_policy_json`, and policy fields

### 4.3 customers

Purpose: bill-to entities associated with a company, with multilingual and contact preferences.

Columns:

- `id` (UUID, PK)
- `tenant_id` (UUID, not null)
- `company_id` (UUID, FK to `companies(id)`)
- `customer_number` (citext, not null; unique per company)
- `name` (text, not null)
- `email` (citext, not null)
- `phone` (text, nullable)
- `billing_address_json` (jsonb; lines, city, state, postal_code, country)
- `shipping_address_json` (jsonb; optional)
- `language_code` (citext, default 'en')
- `locale_code` (citext, default 'en-US')
- `payment_terms_days` (int, default 30)
- `portal_enabled` (boolean, default true)
- `portal_password_hash` (text, nullable)
- `preferred_delivery_channels` (jsonb; email, portal, EDI)
- `tax_exempt` (boolean, default false)
- `tax_id_number` (text, nullable)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())
- `deleted_at` (timestamptz, nullable; soft delete)

Indexes:

- Unique: `customers_company_customer_number_key` on (`company_id`, `customer_number`)
- B-tree: `idx_customers_email` on `email`
- GIN: `idx_customers_address_gin` on billing_address_json

Constraints:

- FK (`company_id`) REFERENCES `companies(id)`
- Check (`payment_terms_days` >= 0)
- Non-overlapping enforcement handled at application layer; DB checks for JSON schema correctness

Audit hooks:

- Log changes to addresses, preferences, and tax status

### 4.4 projects

Purpose: contextualize invoicing under a customer, with scope, milestones, and approvals.

Columns:

- `id` (UUID, PK)
- `tenant_id` (UUID, not null)
- `company_id` (UUID, FK to `companies(id)`)
- `customer_id` (UUID, FK to `customers(id)`)
- `project_code` (citext, not null; unique per customer)
- `name` (text, not null)
- `description` (text, nullable)
- `status` (enum: planned, active, on_hold, completed, cancelled)
- `start_date` (date, nullable)
- `end_date` (date, nullable)
- `billing_model` (enum: time_and_materials, fixed_fee, milestone, retainer)
- `hourly_rate` (numeric(18,4), nullable)
- `fixed_fee` (numeric(18,2), nullable)
- `retainer_amount` (numeric(18,2), nullable)
- `po_number` (text, nullable)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())
- `deleted_at` (timestamptz, nullable; soft delete)

Indexes:

- Unique: `projects_customer_code_key` on (`customer_id`, `project_code`)
- B-tree: `idx_projects_status` on `status`
- B-tree: `idx_projects_dates` on (`start_date`, `end_date`)

Constraints:

- FK (`company_id`) REFERENCES `companies(id)`
- FK (`customer_id`) REFERENCES `customers(id)`
- Check (`start_date` <= `end_date` OR `end_date` IS NULL)
- Retainer/billing model consistency enforced via check constraints on mutually exclusive fields

Audit hooks:

- Log status changes, billing model edits, and milestone approvals

### 4.5 invoices

Purpose: invoice headers with total transparency fields and linkages to customers, projects, and delivery evidence.

Columns:

- `id` (UUID, PK)
- `tenant_id` (UUID, not null)
- `company_id` (UUID, FK to `companies(id)`)
- `customer_id` (UUID, FK to `customers(id)`)
- `project_id` (UUID, FK to `projects(id)`, nullable)
- `invoice_number` (citext, not null; unique per company)
- `status` (enum: draft, approved, sent, viewed, partial_paid, paid, void, disputed)
- `issue_date` (date, not null)
- `due_date` (date, not null)
- `currency_code` (citext, not null)
- `subtotal` (numeric(18,2), not null)
- `discount_total` (numeric(18,2), default 0)
- `tax_total` (numeric(18,2), default 0)
- `grand_total` (numeric(18,2), not null)
- `balance_due` (numeric(18,2), not null)
- `terms_and_conditions` (text, nullable)
- `po_number` (text, nullable)
- `delivery_status` (enum: not_sent, sent, delivered, portal_viewed)
- `portal_viewed_at` (timestamptz, nullable)
- `fee_disclosure_json` (jsonb; planned surcharges by method/geography)
- `tax_disclosure_json` (jsonb; rates and bases)
- `evidence_refs_json` (jsonb; attachments, PoD, approvals)
- `invoice_metadata` (jsonb; extended fields)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())
- `deleted_at` (timestamptz, nullable; soft delete)

Indexes:

- Unique: `invoices_company_invoice_number_key` on (`company_id`, `invoice_number`)
- B-tree: `idx_invoices_status_dates` on (`status`, `issue_date`, `due_date`)
- B-tree: `idx_invoices_customer` on (`customer_id`)
- B-tree: `idx_invoices_project` on (`project_id`)
- GIN: `idx_invoices_fee_disclosure_gin` on fee_disclosure_json
- GIN: `idx_invoices_tax_disclosure_gin` on tax_disclosure_json

Constraints:

- FK (`company_id`) REFERENCES `companies(id)`
- FK (`customer_id`) REFERENCES `customers(id)`
- FK (`project_id`) REFERENCES `projects(id)`
- Check (`balance_due` >= 0)
- Check (`subtotal`, `discount_total`, `tax_total`, `grand_total` consistency via computed triggers)
- Check currency consistency with company’s locale; enforced by application

Partitioning:

- Monthly partitions on `issue_date` for `invoices`, `payments`, and `communication_logs` (same key) to manage volume and lifecycle

Audit hooks:

- All updates to totals, status, and disclosure fields logged

### 4.6 invoice_items

Purpose: line-level detail (time, expenses, fees, adjustments) tied to an invoice and optionally to a project timeline.

Columns:

- `id` (UUID, PK)
- `tenant_id` (UUID, not null)
- `invoice_id` (UUID, FK to `invoices(id)`)
- `project_id` (UUID, FK to `projects(id)`, nullable)
- `item_type` (enum: time, expense, fee, adjustment, deposit)
- `description` (text, not null)
- `quantity` (numeric(18,4), default 1)
- `unit_price` (numeric(18,4), not null)
- `discount_amount` (numeric(18,2), default 0)
- `tax_amount` (numeric(18,2), default 0)
- `line_total` (numeric(18,2), not null)
- `start_at` (timestamptz, nullable)
- `end_at` (timestamptz, nullable)
- `justification` (text, nullable; fairness rationale)
- `is_billable` (boolean, default true)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())
- `deleted_at` (timestamptz, nullable; soft delete)

Indexes:

- B-tree: `idx_invoice_items_invoice` on (`invoice_id`)
- B-tree: `idx_invoice_items_project` on (`project_id`)
- B-tree: `idx_invoice_items_item_type` on (`item_type`)
- B-tree: `idx_invoice_items_dates` on (`start_at`, `end_at`)

Constraints:

- FK (`invoice_id`) REFERENCES `invoices(id)`
- FK (`project_id`) REFERENCES `projects(id)`
- Check (`quantity` >= 0)
- Check (`line_total` = `quantity`*`unit_price` - `discount_amount` + `tax_amount`)
- Non-overlapping time ranges per project enforced via exclusion constraint

Audit hooks:

- Log quantity, unit price, tax_amount, and justification changes

### 4.7 payments

Purpose: reconcile payments to invoices with gateway references and statuses.

Columns:

- `id` (UUID, PK)
- `tenant_id` (UUID, not null)
- `company_id` (UUID, FK to `companies(id)`)
- `invoice_id` (UUID, FK to `invoices(id)`)
- `payment_method` (enum: card, ach, bank_transfer, check, cash, other)
- `gateway` (enum: stripe,adyen,paypal,other)
- `gateway_transaction_id` (text, nullable)
- `gateway_payment_id` (text, nullable)
- `status` (enum: initiated, pending, succeeded, failed, refunded, charged_back)
- `amount` (numeric(18,2), not null)
- `currency_code` (citext, not null)
- `processed_at` (timestamptz, nullable)
- `refunded_amount` (numeric(18,2), default 0)
- `fee_amount` (numeric(18,2), default 0)
- `net_amount` (numeric(18,2), nullable)
- `receipt_url` (text, nullable)
- `metadata_json` (jsonb; gateway payloads, reconciliation hints)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())
- `deleted_at` (timestamptz, nullable; soft delete)

Indexes:

- B-tree: `idx_payments_invoice` on (`invoice_id`)
- B-tree: `idx_payments_gateway_ids` on (`gateway`, `gateway_transaction_id`)
- B-tree: `idx_payments_status_processed` on (`status`, `processed_at`)

Constraints:

- FK (`invoice_id`) REFERENCES `invoices(id)`
- Check (`amount` >= 0)
- Idempotency enforced by unique (`gateway`, `gateway_transaction_id`) when present
- Currency consistency with invoice enforced by application or trigger

Partitioning:

- Monthly partitions on `processed_at` (or `created_at` if `processed_at` is unknown)

Audit hooks:

- Log status transitions, refund and fee adjustments

### 4.8 communication_logs

Purpose: omnichannel delivery and engagement records (email, portal, SMS, EDI) linked to invoices and customers.

Columns:

- `id` (UUID, PK)
- `tenant_id` (UUID, not null)
- `company_id` (UUID, FK to `companies(id)`)
- `customer_id` (UUID, FK to `customers(id)`)
- `invoice_id` (UUID, FK to `invoices(id)`, nullable)
- `channel` (enum: email, portal, sms, api)
- `event_type` (enum: sent, delivered, opened, clicked, replied, bounced, unsubscribed, viewed_portal)
- `direction` (enum: outbound, inbound)
- `subject` (text, nullable)
- `body_summary` (text, nullable)
- `delivered_at` (timestamptz, nullable)
- `opened_at` (timestamptz, nullable)
- `clicked_at` (timestamptz, nullable)
- `replied_at` (timestamptz, nullable)
- `bounced_at` (timestamptz, nullable)
- `unsubscribed_at` (timestamptz, nullable)
- `portal_viewed_at` (timestamptz, nullable)
- `error_code` (text, nullable)
- `error_message` (text, nullable)
- `correlation_id` (text, nullable)
- `idempotency_key` (text, nullable)
- `metadata_json` (jsonb; provider IDs, message IDs, payload references)
- `created_at` (timestamptz, default now())

Indexes:

- B-tree: `idx_comm_logs_invoice` on (`invoice_id`)
- B-tree: `idx_comm_logs_customer` on (`customer_id`)
- B-tree: `idx_comm_logs_event_type` on (`event_type`)
- B-tree: `idx_comm_logs_times` on (`delivered_at`, `opened_at`, `clicked_at`, `replied_at`, `bounced_at`)
- Unique: `idx_comm_logs_idem_key` on (`idempotency_key`) where not null

Constraints:

- FK (`invoice_id`) REFERENCES `invoices(id)` (nullable for pre-invoice communications)
- FK (`customer_id`) REFERENCES `customers(id)`
- Idempotency to prevent duplicate sends
- Linkage to CMS templates via `metadata_json` template IDs

Partitioning:

- Monthly partitions on `created_at` (or `delivered_at`) to manage volume and retention

Audit hooks:

- Log event transitions and errors

### 4.9 transparency_scores

Purpose: per-invoice transparency metrics capturing disclosures, fairness, and evidence.

Columns:

- `id` (UUID, PK)
- `tenant_id` (UUID, not null)
- `company_id` (UUID, FK to `companies(id)`)
- `invoice_id` (UUID, FK to `invoices(id)`)
- `score` (int, not null; 0–100)
- `fee_transparency` (int, not null; 0–10)
- `itemization_clarity` (int, not null; 0–10)
- `fee_fairness_justification` (int, not null; 0–10; based on `justification` presence)
- `documentation_completeness` (int, not null; 0–10; based on `evidence_refs_json`)
- `explanations_provided` (int, not null; 0–10; links to communication logs)
- `evidence_json` (jsonb; pointers to attachments, PoD, scope approvals)
- `computed_at` (timestamptz, default now())
- `version` (int, default 1)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

Indexes:

- Unique: `transparency_scores_invoice_key` on (`invoice_id`)
- B-tree: `idx_transparency_scores_score` on (`score`)

Constraints:

- Score bounds via check (`score` BETWEEN 0 AND 100)
- Component bounds via check on each 0–10 field
- Evidence required; JSON non-empty enforced via check

Audit hooks:

- Log recomputations, evidence updates

### 4.10 client_satisfaction

Purpose: feedback linked to invoice interactions and overall account health.

Columns:

- `id` (UUID, PK)
- `tenant_id` (UUID, not null)
- `company_id` (UUID, FK to `companies(id)`)
- `invoice_id` (UUID, FK to `invoices(id)`, nullable)
- `customer_id` (UUID, FK to `customers(id)`)
- `respondent_role` (enum: customer_admin, approver, payer, viewer, other)
- `rating` (int, not null; 1–5 or 1–10 scale)
- `nps` (int, nullable; -100 to 100)
- `feedback_text` (text, nullable)
- `dispute_flag` (boolean, default false)
- `submitted_at` (timestamptz, default now())
- `consent_marketing` (boolean, default false)
- `consent_research` (boolean, default false)
- `metadata_json` (jsonb; segment, channel, survey metadata)

Indexes:

- B-tree: `idx_cs_invoice` on (`invoice_id`)
- B-tree: `idx_cs_customer` on (`customer_id`)
- B-tree: `idx_cs_rating` on (`rating`)
- B-tree: `idx_cs_nps` on (`nps`)

Constraints:

- Rating bounds via check (scale 1–5 default; optional 1–10 via metadata)
- NPS bounds via check (`nps` BETWEEN -100 AND 100)
- Consent flags stored; no processing beyond declared consent

Audit hooks:

- Log submission and edits

### 4.11 team_members

Purpose: authorization bridging between users and companies, including roles and permissions.

Columns:

- `id` (UUID, PK)
- `tenant_id` (UUID, not null)
- `company_id` (UUID, FK to `companies(id)`)
- `user_id` (UUID, FK to `users(id)`)
- `role` (enum: owner, admin, manager, accountant, viewer, guest)
- `permissions_json` (jsonb; granular actions by resource)
- `status` (enum: invited, active, disabled)
- `invited_at` (timestamptz, nullable)
- `accepted_at` (timestamptz, nullable)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())
- `deleted_at` (timestamptz, nullable; soft delete)

Indexes:

- Unique: `team_members_company_user_key` on (`company_id`, `user_id`)
- B-tree: `idx_team_members_role` on (`role`)
- B-tree: `idx_team_members_status` on (`status`)

Constraints:

- FK (`company_id`) REFERENCES `companies(id)`
- FK (`user_id`) REFERENCES `users(id)`
- Role-permission consistency checks in application; permissions JSON validated against schema

Audit hooks:

- Log role changes, permission edits, invitations

### 4.12 cms_content

Purpose: governed templates, assets, and message blocks used to render invoices and statements.

Columns:

- `id` (UUID, PK)
- `tenant_id` (UUID, not null)
- `company_id` (UUID, FK to `companies(id)`)
- `type` (enum: template, asset, legal_block, message)
- `slug` (citext, not null; unique per company and type)
- `title` (text, not null)
- `language_code` (citext, default 'en')
- `version` (int, not null; default 1)
- `status` (enum: draft, approved, archived)
- `content_json` (jsonb; CMS/DAM structured content)
- `published_at` (timestamptz, nullable)
- `created_by_user_id` (UUID, FK to `users(id)`)
- `approved_by_user_id` (UUID, FK to `users(id)`, nullable)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

Indexes:

- Unique: `cms_content_company_slug_ver_key` on (`company_id`, `slug`, `version`)
- B-tree: `idx_cms_content_status` on (`status`)
- B-tree: `idx_cms_content_language` on (`language_code`)

Constraints:

- FK (`company_id`) REFERENCES `companies(id)`
- FK (`created_by_user_id`) REFERENCES `users(id)`
- Version immutability after approval; new versions for edits

Audit hooks:

- Log version changes, approvals, publication events

### 4.13 audit_trails

Purpose: immutable, hash-chained evidence logs capturing all material changes and key reads for sensitive entities.

Columns:

- `id` (UUID, PK)
- `tenant_id` (UUID, not null)
- `entity_type` (text, not null; e.g., 'invoices', 'payments')
- `entity_id` (UUID, not null)
- `correlation_id` (text, nullable)
- `actor_type` (enum: user, system, integration)
- `actor_id` (UUID, nullable)
- `action` (enum: create, update, delete, status_change, approve, submit, reconcile, view)
- `event_time` (timestamptz, default now())
- `before_json` (jsonb, nullable)
- `after_json` (jsonb, nullable)
- `diff_json` (jsonb, optional)
- `evidence_refs_json` (jsonb; payload digests, attachment IDs)
- `prev_hash` (text, nullable)
- `hash` (text, not null)
- `app_version` (text, nullable)
- `request_id` (text, nullable)
- `ip_address` (inet, nullable)

Indexes:

- B-tree: `idx_audit_entity_time` on (`entity_type`, `entity_id`, `event_time`)
- B-tree: `idx_audit_correlation` on (`correlation_id`)
- Hash chain verification index on (`prev_hash`, `hash`)

Constraints:

- Hash chain enforced by trigger: `hash = func(prev_hash, entity_id, action, before_json, after_json, event_time)`
- Append-only; no updates or deletes

Audit hooks:

- Logged from all tenant-scoped tables via triggers; integrated with control dashboards and compliance reviews[^1][^5]

[^5]: SafeBooks. SOX Compliance: A New Era of Financial Data Transparency.

## 5. Relationships, Cardinality, and Referential Integrity

The model enforces strict referential integrity across relationships. Cascade behaviors are chosen to minimize risk:

- Invoices cascade only to invoice items on delete; items do not cascade delete to invoices.
- Payments and communication logs are never auto-deleted when invoices are removed; they follow soft-delete and archival policies to preserve evidence.
- Soft deletes use `deleted_at` for user-facing entities; audit trails retain pre- and post-images even when records are logically removed.

Tenant boundary rules are non-negotiable: foreign keys cannot reference rows across tenants. Check constraints and RLS policies prevent cross-tenant leakage.

Status lifecycle semantics are encoded as enums with explicit transitions. For example, invoices transition `draft → approved → sent → viewed → partial_paid → paid`, with checks preventing backward jumps except through defined reversal processes (e.g., `paid → disputed` with audit capture). Payments transition `initiated → pending → succeeded`, with failures captured and reconciled via `status_change` events and evidence references.

Idempotency is enforced on communication logs and payment gateway calls via unique `idempotency_key` and (`gateway`, `gateway_transaction_id`) constraints.

Table 3 outlines referential actions by entity.

Table 3: Referential action matrix

| Entity | Parent | On Delete | Justification |
|---|---|---|---|
| customers | companies | RESTRICT | Prevent orphaned customers; preserves invoice lineage |
| projects | customers | RESTRICT | Projects underpin invoicing and auditability |
| invoices | customers/projects | RESTRICT | Core financial record; prevents accidental removal |
| invoice_items | invoices | CASCADE | Items are owned by invoices; deleted with invoice |
| payments | invoices | RESTRICT | Payments are evidence; archived if invoice removed |
| communication_logs | invoices/customers | RESTRICT | Communications are audit evidence; archived instead |
| transparency_scores | invoices | RESTRICT | Scores are tied to invoice state; preserved |
| client_satisfaction | invoices/customers | RESTRICT | Customer feedback preserved; not re-scoped |
| team_members | companies/users | CASCADE (team_members) | Removing a user from a company removes membership |
| cms_content | companies | RESTRICT | Published content preserved; archived instead |
| audit_trails | any | RESTRICT | Append-only records; no deletes |

These actions preserve lineage and evidence while allowing operational cleanup via soft deletes and archival partitions[^4].

[^4]: Fuelfinance. 10 Must-Have Salesforce Integrations for Financial Management.

## 6. Indexing Strategy and Query Patterns

Access patterns determine index design. The schema prioritizes:

- Invoice retrieval: by company and invoice number; by status and date ranges; by customer.
- Aging reports: invoices with balances and due dates; aggregation by bucket.
- Customer dashboards: open invoices, recent communications, satisfaction scores.
- Portal views: invoices by customer with latest status and delivery evidence.
- Payments reconciliation: payments by gateway transaction IDs and status.
- Communication audits: logs by invoice, customer, and event type.

Covering indexes support frequent queries without table lookups. For example, `invoices` includes (`company_id`, `invoice_number`, `status`, `due_date`) to satisfy portal and aging queries. JSON fields use GIN indexes for selective filtering (e.g., `fee_disclosure_json->>'method'`).

Partitioning is applied to high-volume, time-series tables: `invoices`, `payments`, and `communication_logs`. Monthly partitions by `issue_date` or `processed_at` align with reporting and lifecycle operations (archive, delete, or anonymize). Retention policies and anonymization are discussed in Section 10.

Partial indexes optimize access for active subsets, e.g., `WHERE status IN ('sent', 'viewed', 'partial_paid')` for collections workflows.

Table 4 summarizes index design per table.

Table 4: Index plan per table

| Table | Index | Type | Justification |
|---|---|---|---|
| users | `idx_users_status`, `idx_users_last_login_at` | B-tree | Admin filtering and session analytics |
| companies | `companies_tenant_code_key` | Unique | Fast lookup by code |
| customers | `customers_company_customer_number_key`, `idx_customers_email`, `idx_customers_address_gin` | Unique, B-tree, GIN | Portal login, email search, address filtering |
| projects | `projects_customer_code_key`, `idx_projects_status`, `idx_projects_dates` | Unique, B-tree | Project dashboards, status/time filtering |
| invoices | `invoices_company_invoice_number_key`, `idx_invoices_status_dates`, `idx_invoices_customer`, `idx_invoices_project`, `idx_invoices_fee_disclosure_gin`, `idx_invoices_tax_disclosure_gin` | Unique, B-tree, GIN | Portal, aging, reconciliation, disclosure filtering |
| invoice_items | `idx_invoice_items_invoice`, `idx_invoice_items_project`, `idx_invoice_items_item_type`, `idx_invoice_items_dates` | B-tree | Line-level reports and non-overlap checks |
| payments | `idx_payments_invoice`, `idx_payments_gateway_ids`, `idx_payments_status_processed` | B-tree | Reconciliation, status workflows |
| communication_logs | `idx_comm_logs_invoice`, `idx_comm_logs_customer`, `idx_comm_logs_event_type`, `idx_comm_logs_times`, `idx_comm_logs_idem_key` | B-tree, Unique | Delivery audits, idempotency |
| transparency_scores | `transparency_scores_invoice_key`, `idx_transparency_scores_score` | Unique, B-tree | Transparency dashboards |
| client_satisfaction | `idx_cs_invoice`, `idx_cs_customer`, `idx_cs_rating`, `idx_cs_nps` | B-tree | CSAT/NPS reporting |
| team_members | `team_members_company_user_key`, `idx_team_members_role`, `idx_team_members_status` | Unique, B-tree | Access control lookups |
| cms_content | `cms_content_company_slug_ver_key`, `idx_cms_content_status`, `idx_cms_content_language` | Unique, B-tree | Template and asset retrieval |
| audit_trails | `idx_audit_entity_time`, `idx_audit_correlation` | B-tree | Evidence retrieval, lineage tracing |

These patterns mirror invoice reporting needs identified in management practice: status visibility, aging analysis, and exception handling are the foundation of operational dashboards[^6].

[^6]: CloudFronts. Improving Financial Transparency: The Role of Invoice Reporting in Management.

## 7. Transparency-by-Design Model

Radical transparency is more than a slogan; it is an architectural choice. Invoices expose fee and tax disclosures, line-item justifications, and references to supporting documentation. Fairness signals—such as credits for inactivity or pro-rated adjustments—are modeled explicitly.

- Disclosure fields. `invoices.fee_disclosure_json` and `tax_disclosure_json` store method- and geography-specific fees, rates, and bases, with clear rationales and timing references. This matches market-leading fee disclosures, such as explicit ACH allotments and transaction fees by method and geography[^7][^8][^9].
- Justifications. `invoice_items.justification` provides a narrative for fees or adjustments, reinforcing fairness and reducing disputes. When coupled with `evidence_refs_json` (proof of delivery, approvals), it signals respect and professionalism[^10].
- Policy publication. `companies.fee_matrix_json` and `retention_policy_json` act as authoritative sources rendered on invoices and in client portals, aligning with customer expectations for predictability and control[^11].
- Metrics. `transparency_scores` compute per-invoice transparency across itemization clarity, fee fairness justification, documentation completeness, and explanations provided. Scores drive continuous improvement and customer-facing summaries.

Table 5 maps disclosure elements to schema fields.

Table 5: Disclosure elements to schema fields

| Disclosure Element | Schema Field(s) | Purpose |
|---|---|---|
| Payment fees by method/geography | `companies.fee_matrix_json`; `invoices.fee_disclosure_json` | Pre-invoice transparency; invoice-time confirmation |
| Tax rates and bases | `invoices.tax_disclosure_json` | Show what taxes apply and why |
| Discounts, credits, prorations | `invoice_items.discount_amount`, `justification` | Demonstrate fairness and clarity |
| Delivery references | `invoices.evidence_refs_json` (PoD, approvals) | Prove performance; reduce disputes |
| Retention policy | `companies.retention_policy_json` | Publish handling of inactive accounts and document deletion windows |

These elements are consistent with the market’s strongest transparency signals—explicit fee matrices, retention clarity, and documented policies[^7][^8][^9][^10][^11].

[^7]: Wave. Pricing and Fee Disclosures.
[^8]: QuickBooks Online Pricing & Free Trial.
[^9]: QuickBooks Online – Product Updates.
[^10]: InvoiceOnline. Clear and Transparent Invoices.
[^11]: Avalara. Billing Transparency Builds Customer Trust.

## 8. Compliance & Audit Trail

SOX-oriented expectations for continuous control health, e-invoicing mandates, and immutable evidence inform the audit model. The schema adopts append-only `audit_trails` with hash chaining to detect tampering. Every material event carries `before_json`, `after_json`, and a hash computed across the chain, ensuring that audits can verify the integrity of changes over time.

Event taxonomy includes create, update, delete, status_change, approve, submit, reconcile, and view. Evidence references—attachment IDs, payload digests—are stored in `evidence_refs_json`. Control dashboards consume aggregated audit data to show execution frequency, failure rates, and mean time to resolve exceptions.

Table 6 maps audit events to evidence.

Table 6: Audit event types and required evidence

| Event Type | Required Evidence | Schema Link |
|---|---|---|
| create | Initial state | `before_json` null; `after_json` populated |
| update | Before/after diff | `before_json` and `after_json`; `diff_json` |
| delete | Final state | `before_json` populated; `after_json` null |
| status_change | Old/new status; reason | `diff_json` status fields; `evidence_refs_json` |
| approve | Approver identity; timestamp | `actor_id`, `event_time`; `after_json` approval flags |
| submit | Submission payload digest | `evidence_refs_json` payload hash |
| reconcile | Gateway reconciliation refs | `evidence_refs_json` reconciliation IDs |
| view | Viewer identity; timestamp | Portal view logs; `event_time` and `actor_id` |

This approach aligns with SOX’s continuous transparency emphasis and e-invoicing readiness by structuring the evidence needed to explain outcomes and demonstrate control efficacy[^5][^12][^1].

[^12]: Billtrust. Global E‑Invoicing Overview: Trends & Regulations.
[^1]: Xero. Security at Xero.

## 9. CMS Content Governance

Templates, assets, and legal blocks are versioned and approved before publication. The model distinguishes draft, approved, and archived states. `cms_content` stores structured content in JSON, with language codes for multilingual support. Approval is tracked via `approved_by_user_id` and `published_at`.

Template governance is central to compliance and branding. Message blocks—disclaimers, disclosures—are governed through version control. Integration with digital asset management (DAM) ensures authoritative assets are referenced consistently. This mirrors modern CMS/DAM capabilities for enterprise content operations[^13].

Table 7 outlines content lifecycle states.

Table 7: Content lifecycle states

| State | Allowed Actions | Required Roles | Evidence |
|---|---|---|---|
| draft | Edit, submit for review | Author, Editor | `created_by_user_id`; version increment |
| approved | Publish, archive | Approver, Owner | `approved_by_user_id`; `published_at` |
| archived | View, restore to draft | Owner | Archival timestamp; audit log entry |

[^13]: Adobe. Experience Manager Assets (DAM).

## 10. Data Lifecycle, Retention, and Privacy

Lifecycle policies govern soft deletes, archival partitions, anonymization, and deletion windows. Companies publish retention policies in `companies.retention_policy_json`, enabling transparent handling of inactive accounts and document deletion timelines consistent with market exemplars[^2]. Audit trails and communications are retained longer than financial records to meet compliance expectations.

Table 8 proposes retention targets.

Table 8: Retention schedule (example targets; finalize with legal counsel)

| Entity | Default Retention | Legal Basis | Deletion Policy |
|---|---|---|---|
| invoices | 7–10 years | Tax, SOX | Archive partitions after 3 years; delete after retention window |
| payments | 7–10 years | Tax | Archive after 3 years; delete after retention |
| communication_logs | 3–5 years | Evidence, compliance | Archive after 1 year; delete after retention |
| audit_trails | 7–10 years | SOX, audits | Archive; delete after retention per policy |
| clients_satisfaction | 2–3 years | CX metrics | Anonymize PII after 1 year; delete after retention |
| cms_content | Permanent | Brand/legal governance | Archive superseded versions; retain |

Regional variations and anonymization strategies are configured per tenant. Policies are published and rendered in client portals, reinforcing predictability and trust[^2].

[^2]: Zoho Invoice Pricing (Data retention clarity).

## 11. Security & Access Control

Role-based access and row-level security (RLS) enforce tenant isolation. Field-level protections (e.g., `portal_password_hash`, secrets) ensure sensitive data is encrypted at rest and in transit. Payments adhere to Payment Card Industry Data Security Standard (PCI DSS) expectations by minimizing cardholder data storage and leaning on gateway tokens and references.

Table 9 summarizes security controls.

Table 9: Security controls by object

| Object | Access Rules | Encryption | Audit Coverage |
|---|---|---|---|
| users | Admin-only update; RLS by tenant | Password hashes; MFA secrets | Create/update/delete on user actions |
| companies | Owner/admin manage; viewer read | Policy JSON at rest | Policy changes audited |
| customers | RLS by `company_id`; portal auth | Addresses PII at rest | Preference changes audited |
| invoices | Finance role read/write; portal view | Disclosure JSON at rest | Totals, status, disclosures |
| invoice_items | Finance role read/write | Line narratives at rest | Quantity/price changes |
| payments | Finance role read/write; gateway integration | Minimal sensitive data; tokens | Status transitions |
| communication_logs | Operations read; portal events | Metadata only | Delivery events |
| transparency_scores | Finance/CX read | Evidence references | Recomputations |
| client_satisfaction | CX read; customer submit | Consent flags | Submissions |
| team_members | Owner/admin manage | Permissions JSON | Role changes |
| cms_content | Content owners manage | Content JSON | Version/approval logs |
| audit_trails | Compliance/SOX read | Hash chain | All critical actions |

These controls echo published trust practices—encryption in transit and at rest, MFA, and vulnerability programs—setting the foundation for independent attestations over time[^1][^14].

[^14]: Ivalua. E‑Invoicing: Global Mandates for Transparency & Tax Compliance.

## 12. Integrations and External References

The schema supports CRM, CMS, payment gateways, and e-invoicing via JSON metadata and unique references. CRM synchronization uses canonical identifiers and event-driven updates. CMS templates link via `cms_content` IDs, rendering invoice visuals and legal blocks. Payment gateways store transaction IDs, statuses, and payloads for reconciliation. E-invoicing networks store network IDs, submission statuses, and document references.

Table 10 maps integration references.

Table 10: Integration object mapping

| External System | Canonical IDs | References in Schema |
|---|---|---|
| CRM | Account/Contact/Quote/Order IDs | `customers.metadata_json`; `projects.metadata_json`; invoice lineage fields |
| CMS/DAM | Template/Asset IDs | `cms_content`; `invoices.evidence_refs_json` |
| Payment Gateways | Transaction/Payment IDs | `payments.gateway_transaction_id`, `gateway_payment_id`, `metadata_json` |
| E-Invoicing Networks | Network/Submission IDs | `invoice_metadata->>'peppol_id'`, submission status refs |

This design is compatible with CRM integration patterns (e.g., Salesforce and financial systems), CMS-driven template governance, and gateway-managed payment experiences[^4][^3][^15].

[^15]: Zapier. The 7 Best Customer & Client Portal Software [2025].

## 13. Migration, Seeding, and Testing Strategy

Migration proceeds in phases to reduce risk and validate critical paths:

- Phase 1: Core entities (companies, customers, projects, invoices, invoice_items).
- Phase 2: Payments and communications (including partitioning and reconciliation).
- Phase 3: Transparency, satisfaction, team, CMS, and audit trails.

Seeding includes default roles, tax regimes (extensible), and sample fee matrices. Testing covers foreign key enforcement, constraint checks, audit immutability, and encryption verification. Performance testing validates index efficacy and partitioning strategies on high-volume tables.

Table 11 summarizes migration phases and rollback.

Table 11: Migration phases and rollback

| Phase | Artifacts | Preconditions | Rollback Plan |
|---|---|---|---|
| 1 | companies, customers, projects, invoices, invoice_items | Auth ready; RLS policies | Drop tables; restore snapshot |
| 2 | payments, communication_logs | Gateway sandbox; partitioning in place | Disable partitions; restore snapshot |
| 3 | transparency_scores, client_satisfaction, team_members, cms_content, audit_trails | CMS/DAM integrations; audit trigger wiring | Disable triggers; restore snapshot |

This staged approach is aligned with integration sequencing and template governance introduced earlier[^4][^13].

## 14. Operational Reports and KPIs

Operational visibility is crucial for finance and customer experience teams. The schema powers DSO, dispute rate, on-time payment, invoice accuracy, transparency score trends, and customer satisfaction metrics. Aging buckets, communication engagement summaries, and fee disclosure completeness are standard reports.

Table 12 defines key reports.

Table 12: KPI definitions and queries

| KPI | Source Tables | Example Aggregation |
|---|---|---|
| DSO | `invoices`, `payments` | Weighted average days from `issue_date` to `processed_at` |
| Dispute rate | `invoices`, `client_satisfaction` | Count `status=disputed` / total invoices |
| On-time payment rate | `invoices`, `payments` | Count `paid` with `processed_at <= due_date` / total paid |
| Invoice accuracy | `invoice_items`, `audit_trails` | Error rates pre/post automation; tracked via exception logs |
| Transparency score trend | `transparency_scores` | Average `score` by month |
| CSAT/NPS | `client_satisfaction` | Average `rating`, distribution of `nps` |
| Control execution health | `audit_trails` | % controls executed on time; failure rate; mean time to resolve |

These metrics reflect the core objective: reduce disputes and DSO while increasing clarity and customer confidence[^6][^11].

## Appendix A: Full DDL (Conceptual)

The following conceptual DDL sketches illustrate core structures. They exclude engine-specific nuances and focus on constraints and relationships to guide implementation.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email CITEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret TEXT,
  status TEXT CHECK (status IN ('active','disabled','pending')) DEFAULT 'active',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE companies (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  company_code CITEXT NOT NULL,
  brand_logo_url TEXT,
  primary_color CITEXT,
  language_code CITEXT DEFAULT 'en',
  locale_code CITEXT DEFAULT 'en-US',
  support_email CITEXT NOT NULL,
  support_phone TEXT,
  support_portal_url TEXT,
  pricing_disclosure_url TEXT,
  fee_matrix_json JSONB,
  retention_policy_json JSONB,
  default_payment_terms_days INT CHECK (default_payment_terms_days >= 0) DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (tenant_id, company_code)
);

CREATE TABLE customers (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id),
  customer_number CITEXT NOT NULL,
  name TEXT NOT NULL,
  email CITEXT NOT NULL,
  phone TEXT,
  billing_address_json JSONB,
  shipping_address_json JSONB,
  language_code CITEXT DEFAULT 'en',
  locale_code CITEXT DEFAULT 'en-US',
  payment_terms_days INT CHECK (payment_terms_days >= 0) DEFAULT 30,
  portal_enabled BOOLEAN DEFAULT TRUE,
  portal_password_hash TEXT,
  preferred_delivery_channels JSONB,
  tax_exempt BOOLEAN DEFAULT FALSE,
  tax_id_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (company_id, customer_number)
);

CREATE TABLE projects (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  project_code CITEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('planned','active','on_hold','completed','cancelled')),
  start_date DATE,
  end_date DATE,
  billing_model TEXT CHECK (billing_model IN ('time_and_materials','fixed_fee','milestone','retainer')),
  hourly_rate NUMERIC(18,4),
  fixed_fee NUMERIC(18,2),
  retainer_amount NUMERIC(18,2),
  po_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (customer_id, project_code),
  CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date)
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  project_id UUID REFERENCES projects(id),
  invoice_number CITEXT NOT NULL,
  status TEXT CHECK (status IN ('draft','approved','sent','viewed','partial_paid','paid','void','disputed')),
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  currency_code CITEXT NOT NULL,
  subtotal NUMERIC(18,2) NOT NULL,
  discount_total NUMERIC(18,2) DEFAULT 0,
  tax_total NUMERIC(18,2) DEFAULT 0,
  grand_total NUMERIC(18,2) NOT NULL,
  balance_due NUMERIC(18,2) NOT NULL,
  terms_and_conditions TEXT,
  po_number TEXT,
  delivery_status TEXT CHECK (delivery_status IN ('not_sent','sent','delivered','portal_viewed')),
  portal_viewed_at TIMESTAMPTZ,
  fee_disclosure_json JSONB,
  tax_disclosure_json JSONB,
  evidence_refs_json JSONB,
  invoice_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (company_id, invoice_number),
  CHECK (balance_due >= 0)
);

-- Partitioning example (conceptual; engine-specific syntax omitted)
-- CREATE TABLE invoices_y2025m01 PARTITION OF invoices
--   FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE invoice_items (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  project_id UUID REFERENCES projects(id),
  item_type TEXT CHECK (item_type IN ('time','expense','fee','adjustment','deposit')),
  description TEXT NOT NULL,
  quantity NUMERIC(18,4) DEFAULT 1 CHECK (quantity >= 0),
  unit_price NUMERIC(18,4) NOT NULL,
  discount_amount NUMERIC(18,2) DEFAULT 0,
  tax_amount NUMERIC(18,2) DEFAULT 0,
  line_total NUMERIC(18,2) NOT NULL,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  justification TEXT,
  is_billable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CHECK (line_total = quantity * unit_price - discount_amount + tax_amount)
);

-- Optional exclusion constraint for non-overlapping time ranges (engine-specific)
-- CREATE EXTENSION IF NOT EXISTS btree_gist;
-- ALTER TABLE invoice_items
--   ADD CONSTRAINT invoice_items_no_overlap EXCLUDE USING gist (
--     project_id WITH =,
--     tstzrange(start_at, end_at, '[)') WITH &&
--   )
--   WHERE (project_id IS NOT NULL AND start_at IS NOT NULL AND end_at IS NOT NULL);

CREATE TABLE payments (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  payment_method TEXT CHECK (payment_method IN ('card','ach','bank_transfer','check','cash','other')),
  gateway TEXT CHECK (gateway IN ('stripe','adyen','paypal','other')),
  gateway_transaction_id TEXT,
  gateway_payment_id TEXT,
  status TEXT CHECK (status IN ('initiated','pending','succeeded','failed','refunded','charged_back')),
  amount NUMERIC(18,2) NOT NULL CHECK (amount >= 0),
  currency_code CITEXT NOT NULL,
  processed_at TIMESTAMPTZ,
  refunded_amount NUMERIC(18,2) DEFAULT 0,
  fee_amount NUMERIC(18,2) DEFAULT 0,
  net_amount NUMERIC(18,2),
  receipt_url TEXT,
  metadata_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (gateway, gateway_transaction_id)
);

CREATE TABLE communication_logs (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  invoice_id UUID REFERENCES invoices(id),
  channel TEXT CHECK (channel IN ('email','portal','sms','api')),
  event_type TEXT CHECK (event_type IN ('sent','delivered','opened','clicked','replied','bounced','unsubscribed','viewed_portal')),
  direction TEXT CHECK (direction IN ('outbound','inbound')),
  subject TEXT,
  body_summary TEXT,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  portal_viewed_at TIMESTAMPTZ,
  error_code TEXT,
  error_message TEXT,
  correlation_id TEXT,
  idempotency_key TEXT,
  metadata_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (idempotency_key)
);

CREATE TABLE transparency_scores (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  score INT NOT NULL CHECK (score BETWEEN 0 AND 100),
  fee_transparency INT NOT NULL CHECK (fee_transparency BETWEEN 0 AND 10),
  itemization_clarity INT NOT NULL CHECK (itemization_clarity BETWEEN 0 AND 10),
  fee_fairness_justification INT NOT NULL CHECK (fee_fairness_justification BETWEEN 0 AND 10),
  documentation_completeness INT NOT NULL CHECK (documentation_completeness BETWEEN 0 AND 10),
  explanations_provided INT NOT NULL CHECK (explanations_provided BETWEEN 0 AND 10),
  evidence_json JSONB,
  computed_at TIMESTAMPTZ DEFAULT now(),
  version INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (invoice_id)
);

CREATE TABLE client_satisfaction (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id),
  invoice_id UUID REFERENCES invoices(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  respondent_role TEXT CHECK (respondent_role IN ('customer_admin','approver','payer','viewer','other')),
  rating INT NOT NULL,
  nps INT CHECK (nps BETWEEN -100 AND 100),
  feedback_text TEXT,
  dispute_flag BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  consent_marketing BOOLEAN DEFAULT FALSE,
  consent_research BOOLEAN DEFAULT FALSE,
  metadata_json JSONB
);

CREATE TABLE team_members (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id),
  user_id UUID NOT NULL REFERENCES users(id),
  role TEXT CHECK (role IN ('owner','admin','manager','accountant','viewer','guest')),
  permissions_json JSONB,
  status TEXT CHECK (status IN ('invited','active','disabled')),
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (company_id, user_id)
);

CREATE TABLE cms_content (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id),
  type TEXT CHECK (type IN ('template','asset','legal_block','message')),
  slug CITEXT NOT NULL,
  title TEXT NOT NULL,
  language_code CITEXT DEFAULT 'en',
  version INT NOT NULL DEFAULT 1,
  status TEXT CHECK (status IN ('draft','approved','archived')),
  content_json JSONB,
  published_at TIMESTAMPTZ,
  created_by_user_id UUID REFERENCES users(id),
  approved_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (company_id, slug, version)
);

CREATE TABLE audit_trails (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  correlation_id TEXT,
  actor_type TEXT CHECK (actor_type IN ('user','system','integration')),
  actor_id UUID,
  action TEXT CHECK (action IN ('create','update','delete','status_change','approve','submit','reconcile','view')),
  event_time TIMESTAMPTZ DEFAULT now(),
  before_json JSONB,
  after_json JSONB,
  diff_json JSONB,
  evidence_refs_json JSONB,
  prev_hash TEXT,
  hash TEXT NOT NULL,
  app_version TEXT,
  request_id TEXT,
  ip_address INET
);
```

## Appendix B: Enumerations and Code Tables

Standardized enums improve consistency and reporting. Mappings to external systems are stored in JSON metadata.

```sql
-- Status enums
CREATE TABLE invoice_status_enum AS VALUES
  ('draft'), ('approved'), ('sent'), ('viewed'),
  ('partial_paid'), ('paid'), ('void'), ('disputed');

CREATE TABLE project_status_enum AS VALUES
  ('planned'), ('active'), ('on_hold'), ('completed'), ('cancelled');

CREATE TABLE payment_status_enum AS VALUES
  ('initiated'), ('pending'), ('succeeded'),
  ('failed'), ('refunded'), ('charged_back');

CREATE TABLE communication_event_enum AS VALUES
  ('sent'), ('delivered'), ('opened'), ('clicked'),
  ('replied'), ('bounced'), ('unsubscribed'), ('viewed_portal');

-- Mapping table for external system codes (example)
CREATE TABLE external_mappings (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  system_name TEXT NOT NULL, -- 'stripe','salesforce','peppol'
  local_entity TEXT NOT NULL, -- 'payments','customers'
  local_id UUID NOT NULL,
  external_id TEXT NOT NULL,
  metadata_json JSONB,
  UNIQUE (system_name, local_entity, local_id, external_id)
);
```

## Appendix C: Sample Queries

The following queries illustrate reporting patterns enabled by the schema.

1) Aging report (invoices by bucket):

```sql
SELECT
  i.company_id,
  i.customer_id,
  i.invoice_number,
  i.due_date,
  i.balance_due,
  CASE
    WHEN i.balance_due <= 0 THEN 'paid'
    WHEN i.due_date < CURRENT_DATE - INTERVAL '30 days' THEN '31-60'
    WHEN i.due_date < CURRENT_DATE - INTERVAL '60 days' THEN '61-90'
    WHEN i.due_date < CURRENT_DATE - INTERVAL '90 days' THEN '90+'
    ELSE 'current'
  END AS aging_bucket
FROM invoices i
WHERE i.status IN ('sent','viewed','partial_paid')
ORDER BY i.due_date ASC;
```

2) Transparency score trend:

```sql
SELECT
  DATE_TRUNC('month', ts.computed_at) AS month,
  AVG(ts.score) AS avg_score
FROM transparency_scores ts
GROUP BY month
ORDER BY month;
```

3) Portal engagement (communication logs):

```sql
SELECT
  cl.customer_id,
  cl.invoice_id,
  MAX(cl.portal_viewed_at) AS latest_portal_view,
  COUNT(*) FILTER (WHERE cl.event_type = 'opened') AS total_opens,
  COUNT(*) FILTER (WHERE cl.event_type = 'clicked') AS total_clicks
FROM communication_logs cl
GROUP BY cl.customer_id, cl.invoice_id
ORDER BY latest_portal_view DESC;
```

4) Payment reconciliation:

```sql
SELECT
  p.invoice_id,
  p.gateway,
  p.gateway_transaction_id,
  p.status,
  p.amount,
  p.currency_code,
  p.processed_at
FROM payments p
WHERE p.status = 'succeeded'
ORDER BY p.processed_at DESC;
```

5) Dispute resolution timeline:

```sql
SELECT
  i.id AS invoice_id,
  i.invoice_number,
  a1.event_time AS dispute_opened_at,
  a2.event_time AS dispute_closed_at,
  a2.action AS final_action
FROM invoices i
JOIN audit_trails a1 ON a1.entity_type = 'invoices' AND a1.entity_id = i.id AND a1.action = 'status_change' AND (a1.after_json->>'status') = 'disputed'
LEFT JOIN audit_trails a2 ON a2.entity_type = 'invoices' AND a2.entity_id = i.id AND a2.action = 'status_change' AND (a2.after_json->>'status') IN ('paid','partial_paid','void')
ORDER BY a1.event_time DESC;
```

## Information Gaps

The schema includes extension points for aspects that require partner- or jurisdiction-specific decisions:

- Payment gateway fee matrices and chargeback workflows beyond general fields.
- Jurisdiction-specific tax catalogs and rate tables; e-invoicing field requirements by country (e.g., PEPPOL, UBL).
- Precise data retention durations by region and regulatory regime.
- Legal invoicing fields per country (required disclosures, e-signature standards, archive obligations).
- Customer portal SSO/OAuth details and identity provider configurations.
- Anonymization and pseudonymization strategies for PII in compliance with GDPR/CCPA.
- Fraud detection signals and rules to inform `transparency_scores`.
- SMS/EDI providers and compliance requirements for omnichannel communications.

These gaps do not prevent implementation; they inform configuration and integration workstreams during deployment.

## References

[^1]: Security at Xero. https://www.xero.com/security/
[^2]: Zoho Invoice Pricing (Free for small businesses). https://www.zoho.com/us/invoice/pricing/
[^3]: How Invoice Personalization Improves AR Customer Experiences. VersaPay. https://www.versapay.com/resources/invoice-personalization
[^4]: 10 Must-Have Salesforce Integrations for Financial Management. Fuelfinance. https://fuelfinance.me/blog/salesforce-integrations
[^5]: SOX Compliance: A New Era of Financial Data Transparency. SafeBooks. https://safebooks.ai/resources/sox-compliance/sox-compliance-a-new-era-of-financial-data-transparency/
[^6]: Improving Financial Transparency: The Role of Invoice Reporting in Management. CloudFronts. https://www.cloudfronts.com/blog/power-bi/improving-financial-transparency-the-role-of-invoice-reporting-in-management/
[^7]: Wave Pricing. https://www.waveapps.com/pricing
[^8]: QuickBooks Online Pricing & Free Trial. https://quickbooks.intuit.com/pricing/
[^9]: What’s new in QuickBooks Online (April 2025). https://quickbooks.intuit.com/r/product-update/whats-new-quickbooks-online-april-2025/
[^10]: Clear and Transparent Invoices are Key to Customer Trust in 2025. InvoiceOnline. https://www.invoiceonline.com/business-newsletter/finance-and-accounting/clear-and-transparent-invoices-are-key-to-customer-trust-in-2025
[^11]: Billing Transparency Builds Customer Trust. Avalara. https://www.avalara.com/blog/en/north-america/2023/09/billing-transparency-builds-customer-trust.html
[^12]: 2024 Global E‑Invoicing Overview: Trends & Regulations. Billtrust. https://www.billtrust.com/resources/industry-reports/global-e-invoicing-2024-overview-trends-regulations
[^13]: Adobe Experience Manager Assets | Digital Asset Management. Adobe. https://business.adobe.com/products/experience-manager/assets.html
[^14]: E‑Invoicing: Global Mandates for Transparency & Tax Compliance. Ivalua. https://www.ivalua.com/blog/e-invoicing-compliance/
[^15]: The 7 Best Customer & Client Portal Software [2025]. Zapier. https://zapier.com/blog/customer-portal-software/