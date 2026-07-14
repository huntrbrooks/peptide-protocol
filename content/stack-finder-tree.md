# Find Your Ideal Peptide Stack — Decision Tree

Editable map of the adaptive questionnaire. Runtime logic lives in `src/content/stackFinder.ts` and must stay in sync with this file.

**Framing:** Research / educational only. Not medical advice. Not for human consumption.

---

## Research knowledge base (summary)

### Goal → peptide associations (literature & common discussion)

| Goal | Primary research compounds | Notes |
|---|---|---|
| Tissue recovery / injury | BPC-157, TB-500 | Angiogenesis, cytoskeletal / healing models; mostly preclinical |
| Fat loss / metabolic | Tirzepatide, Retatrutide, MOTS-c, Tesamorelin | Incretin / mitochondrial / visceral-fat pathways |
| Muscle / GH axis | Ipamorelin, CJC-1295 (DAC / no DAC), Sermorelin, Tesamorelin | GHRH analogues + ghrelin mimetics; pulsed vs sustained GH |
| Cognition / neuro | Semax, (Selank not in catalogue) | Neurotrophic / nootropic research; Semax used clinically in some regions |
| Sleep | DSIP, Epitalon (secondary) | Sleep architecture & circadian / pineal models |
| Skin / anti-aging | GHK-Cu, Epitalon | ECM / copper-peptide & telomere / pineal research |
| Libido / melanocortin | Melanotan II, (PT-141 not in catalogue) | Melanocortin receptor research; MT-II also pigmentation |
| Gut | BPC-157 | GI mucosal protection models |
| Solvent / reconstitution | Bacteriostatic water | Diluent only — not a “stack peptide” |

### Major caution / withhold categories

| Flag | Behaviour |
|---|---|
| Pregnancy or breastfeeding | **Hard stop** — no peptide recommendations |
| Active cancer / malignancy history | **Hard caution** — withhold GH secretagogues, angiogenic recovery peptides; educational only |
| History of medullary thyroid cancer / MEN2 | Caution on incretin-pathway compounds (tirzepatide / retatrutide class) |
| Type 1 diabetes / insulin / sulfonylureas | Caution on metabolic agonists (hypoglycemia risk discussion) |
| Uncontrolled cardiovascular disease | Soft caution; prefer conservative educational tone |
| Psychiatric meds / seizure history | Soft caution on CNS peptides (Semax, DSIP) |
| Melanoma / atypical nevi | Caution on Melanotan II |

### Adaptive UX principles used

- Target **8–14 questions** per path (not a flat 20+)
- Broad goal first → deep goal branch → shared demographics → health screen → preferences
- One question per screen, visible progress, back navigation
- Health screen early enough to hard-stop before long paths finish
- Branching changes *which* questions appear, not just labels

---

## Flow overview

```
[ack] → [primary_goal] → [GOAL BRANCH 1–2 Qs] → [secondary_goal]
      → [age_range] → [biological_sex] → [lifestyle]
      → [sleep_quality] (skipped if primary_goal = sleep)
      → [health_flags]
           ├─ pregnancy → HARD STOP (no LLM stack)
           └─ else → [medications] (if metabolic/thyroid/diabetes-related flags or goals)
      → [experience] → [delivery_pref] → [risk_tolerance]
      → COMPLETE → POST /api/stack-recommendation → results
```

---

## Questions

### Shared trunk

1. **ack** — Confirm research/educational framing (must accept)
2. **primary_goal** — Single select: recovery | fat_loss | muscle_gh | cognition | sleep | skin_aging | libido | gut
3. **secondary_goal** — Optional single select (same list minus primary, plus `none`)
4. **age_range** — 18–29 | 30–39 | 40–49 | 50–59 | 60+
5. **biological_sex** — female | male | prefer_not
6. **lifestyle** — sedentary | lightly_active | train_regularly | high_performance
7. **sleep_quality** — poor | fair | good | excellent *(hidden if primary_goal = sleep)*
8. **health_flags** — multi: none | pregnancy | cancer_history | thyroid_men2 | cardiovascular | diabetes_t2 | psychiatric | melanoma_nevi | other_chronic
9. **medications** — multi *(shown if diabetes_t2, thyroid_men2, or primary/secondary is fat_loss)*: none | insulin_secretagogue | glp1_current | thyroid_meds | ssri_snri | blood_thinners | other_rx
10. **experience** — none | researched_only | prior_research_use | advanced
11. **delivery_pref** — injectable_ok | prefer_non_injectable | no_preference
12. **risk_tolerance** — conservative | balanced | exploratory

### Goal branches (inserted after primary_goal)

#### recovery
- **recovery_tissue** — tendon_ligament | muscle | joint | gut_overlap | general_soft_tissue | post_procedure_model
- **recovery_timeline** — acute_recent | subacute | chronic_stubborn

#### fat_loss
- **fat_loss_focus** — appetite_weight | visceral_central | insulin_sensitivity | recomposition
- **fat_loss_context** — already_on_incretin | never_tried_metabolic | lab_assay_focus

#### muscle_gh
- **gh_focus** — lean_mass | recovery_between_sessions | sleep_gh_pulse | body_comp_age
- **gh_style** — prefer_pulsatile | prefer_sustained | unsure

#### cognition
- **cognition_focus** — focus_attention | memory_learning | stress_resilience | neuroprotection_model

#### sleep
- **sleep_issue** — latency | fragmented | non_restorative | stress_linked | circadian

#### skin_aging
- **skin_focus** — collagen_wrinkles | hair_scalp | wound_scar_model | cellular_ageing

#### libido
- **libido_focus** — desire | erectile_model | pigmentation_also_interested | melanocortin_research_only

#### gut
- **gut_focus** — mucosal_barrier | post_irritation_model | paired_with_injury_recovery

---

## Hard-stop & caution rules

| Condition | Result |
|---|---|
| `health_flags` includes `pregnancy` | Skip LLM stack; show educational hard-stop screen |
| `health_flags` includes `cancer_history` | Allow LLM but prompt forces withhold of BPC-157, TB-500, GH secretagogues; emphasize caution |
| `health_flags` includes `thyroid_men2` | Prompt forces caution / likely withhold tirzepatide & retatrutide |
| `health_flags` includes `melanoma_nevi` | Prompt forces caution / likely withhold Melanotan II |
| `medications` includes `glp1_current` | Avoid stacking additional incretin agonists |
| `delivery_pref` = `prefer_non_injectable` | Prefer Semax discussion; note most catalogue items are injectable research materials |

---

## Catalogue constraint

Recommendations should prefer in-stock slugs:

`bpc-157-10mg`, `tb-500-10mg`, `cjc-1295-dac-5mg`, `cjc-1295-no-dac-10mg`, `ipamorelin-10mg`, `sermorelin-10mg`, `tesamorelin-10mg`, `tirzepatide-10mg`, `retatrutide-10mg`, `mots-c-10mg`, `semax-11mg`, `dsip-5mg`, `epitalon-10mg`, `ghk-cu-100mg`, `melanotan-ii-10mg`, `hcg-5000iu`, `bacteriostatic-water-10ml`

Out-of-catalogue compounds (e.g. Semaglutide, PT-141, Selank) may be mentioned only as educational comparators, not primary stack picks.
