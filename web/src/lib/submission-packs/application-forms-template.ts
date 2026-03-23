/**
 * Default scaffold for the unified application form (single Markdown).
 * New submission packs start with this; users replace sections with call-specific questions.
 */
export const DEFAULT_APPLICATION_FORMS_MD = `## Unified application form (single Markdown)

Use **this one document** as the working copy for every funder field. Copy sections into PDFs, portals, or Word as required.

**Conventions**

| Pattern | Use for |
| --- | --- |
| \`- [ ]\` | Checkbox — tick when done (Markdown: \`[x]\`). |
| \`- ( )\` / \`- (x)\` | **Single choice** — mark one \`(x)\` manually (portals often mirror radio buttons). |
| **Word limit** / **Character limit** | Match the funder portal; count before pasting. |
| **Multi-select** | Tick **all** that apply under one heading. |

---

### 1. Call / project identity

**Funder / programme name:**  
_Response:_

**Call reference / opportunity ID:**  
_Response:_

**Project title (exactly as in the call):**  
_Response:_

**Acronym (if any):**  
_Response:_

---

### 2. Eligibility & declarations — multi-select

Tick **all** that apply. Add notes if the portal asks for evidence.

- [ ] Meets SME definition (or other stated definition)
- [ ] UK-based (or territory as required)
- [ ] Not subject to exclusion / sanctions
- [ ] Match funding available (if required)
- [ ] Other (add bullets from the call): _ _

**Evidence / notes:**  
_Response (free text):_

---

### 3. Single-choice (radio-style) — pick one

**Topic:** _e.g. state aid / subsidy regime — replace with call question_

- ( ) Option A
- ( ) Option B
- ( ) Option C

**Chosen option (repeat for your records):**  
_Response:_

---

### 4. Budget & funding

**Total project cost:**  
_Response (numbers + currency):_

**Grant amount requested:**  
_Response:_

**Match funding (% and source):**  
_Response:_

**In-kind contributions (if any):**  
_Response:_

---

### 5. Free text — short

**Character limit: 500**  
_Response:_

**Word limit: ~150 words**  
_Response:_

---

### 6. Free text — medium

**Word limit: ~250 words**  
_Response:_

---

### 7. Free text — long

**Word limit: ~500 words**  
_Response:_

---

### 8. Impact, outcomes & KPIs

**Outcome 1 (measurable):**  
_Response:_

**Outcome 2 (measurable):**  
_Response:_

**Outcome 3 (measurable):**  
_Response:_

---

### 9. Work plan & timeline

**Start date / duration:**  
_Response:_

**Key milestones (M1, M2, …):**  
_Response:_

**Dependencies / risks to delivery:**  
_Response:_

---

### 10. Partners & consortium

**Lead organisation:**  
_Response:_

**Partner 1 — name, role, contribution:**  
_Response:_

**Partner 2 — name, role, contribution:**  
_Response:_

**Letters of support (status):**  
_Response:_

---

### 11. Ethics, data & security (if required)

- [ ] Privacy / GDPR addressed
- [ ] Data handling described
- [ ] Security / DPIA if applicable

**Notes:**  
_Response:_

---

### 12. Attachments & uploads

| Document | Portal field name | Status |
| --- | --- | --- |
| CV | — | - [ ] |
| Financial annex | — | - [ ] |
| Letters of support | — | - [ ] |
| Other (specify) | — | - [ ] |

**Additional uploads:**  
_Response:_

---

### 13. Final checks before submit

- [ ] All mandatory portal fields completed
- [ ] Word/character limits checked
- [ ] Files uploaded where required
- [ ] Proofread by second reader
- [ ] Submitted version archived (PDF/screenshot)
`;
