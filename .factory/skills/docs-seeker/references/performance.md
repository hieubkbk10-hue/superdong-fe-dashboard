# Performance Optimization

Optimize for fast, reliable answers, not maximum crawling.

## Fast path

```txt
Direct context7 discovery → extract relevant links/content → verify official/current source → answer or split focused URLs across agents.
```

Use direct URL construction before WebSearch:

```txt
https://context7.com/{org}/{repo}/llms.txt
https://context7.com/websites/{normalized-domain-path}/llms.txt
https://context7.com/{path}/llms.txt?topic={keyword}
```

## Core principles

| Principle              | Rule of thumb                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| Avoid sequential reads | Independent large pages can be read or assigned in parallel. Small source sets should be read directly. |
| Batch by topic         | Group auth, config, API reference, examples, migration separately.                                      |
| Start critical         | Install, quick start, core concept, requested feature first.                                            |
| Stop early             | If answer is 80%+ covered by official docs, answer and note gaps.                                       |
| Cache mentally         | Do not refetch same source unless version/freshness changed.                                            |

## Agent sizing

| Inputs     | Suggested approach                                 |
| ---------- | -------------------------------------------------- |
| 1-3 pages  | Read directly or use one explorer.                 |
| 4-10 pages | 2-4 explorers, each with 2-3 pages or one topic.   |
| 11+ pages  | First batch max 5 explorers on highest-value docs. |
| Huge repo  | Focus paths before packing/reading.                |

Avoid over-parallelization. More agents increase aggregation cost and can duplicate work.

## Repository performance

Prefer focused reads before full packing.

Use includes like:

```txt
README*, docs/**, documentation/**, examples/**, packages/*/README*, *.md
```

Exclude:

```txt
node_modules/**, vendor/**, dist/**, build/**, coverage/**, *.png, *.jpg, *.pdf, *.zip
```

If repo is large or binary-heavy, do not wait on full analysis. Read README/docs tree and dispatch targeted agents.

## Timeout and fallback

| Situation               | Action                                                        |
| ----------------------- | ------------------------------------------------------------- |
| context7 unavailable    | Try official `/llms.txt`, then WebSearch.                     |
| Search takes too long   | Narrow query with site/domain/version.                        |
| Repo clone/pack hangs   | Stop and switch to focused docs paths.                        |
| Agent result duplicated | Merge once, do not launch another batch unless a gap remains. |

## Output performance

Keep final answer efficient:

- Lead with the answer.
- Cite only the sources that matter.
- Put caveats in a short Notes section.
- Avoid dumping long source summaries unless user asked for research notes.

## Quick checklist

Before starting:

- Do I know repo/website/version?
- Can I construct a context7 URL directly?
- What exact topic does the user need?

During:

- Am I reading independent pages sequentially?
- Did I already find the official answer?
- Are version/date/source caveats clear?

Before final:

- Did I answer the question, not just list links?
- Did I disclose any missing/private/untested areas?
