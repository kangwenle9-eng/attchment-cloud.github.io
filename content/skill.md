---
name: learning-material-analyzer
description: Analyze a PDF or a directory of learning materials into a structured summary, traceable knowledge points, graded practice questions, an answer key, and a quality report. Use for course notes, study guides, quizzes, or the Codex learning-lab capstone; do not use for editing the source PDF or for unrelated document conversion.
---

# Learning Material Analyzer

Create a faithful, reviewable learning package while preserving every source file.

## Required inputs

Resolve these four fields before authoring. Ask only when an omitted value would materially change the result.

- Input material path: one PDF or a directory.
- Learning goal: what the learner should understand or be able to do.
- Output directory: must be separate from the source.
- Acceptance criteria: use the capstone defaults when the request names the Codex learning lab.

## Workflow

1. Resolve the input to an explicit file list. Never overwrite, rename, move, or delete a source.
2. Run `scripts/inventory_materials.py` when Python and `pypdf` are available. Record file size, SHA-256, page count, text coverage, and extraction warnings.
3. For PDFs, use the available PDF-specific workflow. Read every relevant page and visually inspect pages where layout, tables, diagrams, or rendering affect meaning. Do not treat successful text extraction as visual verification.
4. Build a source outline before summarizing. Separate source facts, reasonable inferences, teaching suggestions, and unknowns.
5. Produce the output package defined in [references/output-contract.md](references/output-contract.md). Use stable filenames and include file/page evidence for important claims.
6. Design practice at three levels: recall, explanation, and transfer to a new example. Keep the answer key separate from the learner-facing quiz.
7. Validate the package against the acceptance criteria. Reopen generated files, check cross-file consistency, and recompute source hashes when source preservation is part of acceptance.

## Capstone collaboration

When the user explicitly runs the Codex learning-lab capstone and subagents are available, delegate two independent read-only tasks: one extracts the source structure and one reviews quiz quality and evidence. The parent agent must reconcile conflicts, perform its own spot check, and write the final package. Do not delegate when inputs are tiny, the work is tightly coupled, or parallelism would add more noise than value.

## Boundaries

- Never invent page references or claim that an unread page was inspected.
- Do not browse for external facts unless the learning goal requires current information. If browsing is required, keep external claims separate from source-derived notes and cite the original page.
- Do not expose passwords, API keys, private customer data, or hidden document metadata that is irrelevant to learning.
- If a parser, renderer, permission, or source file fails, state the exact gap and produce only the portions supported by available evidence.
- If the requested output directory already contains a prior run, stop and ask for a new run name or explicit overwrite authorization.

