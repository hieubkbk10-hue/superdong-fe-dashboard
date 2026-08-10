# Error Handling Guide

Use this as a fast troubleshooting table. Do not loop on the same failing source, switch strategy and report the fallback.

## Decision flow

```txt
Fetch/search failed
→ Is it a context7 URL issue? Try corrected context7 patterns.
→ Is official llms.txt missing? Search official domains and WebSearch.
→ Is repository missing/private? Use package registry and official website.
→ Is repo too large? Limit to docs/README/examples or use focused agents.
→ Are sources conflicting? Pin version and prioritize official/current docs.
```

## Common failures

| Symptom                  | Likely cause                                              | Response                                                                      |
| ------------------------ | --------------------------------------------------------- | ----------------------------------------------------------------------------- |
| context7 404             | Not indexed, wrong org/repo, wrong website normalization. | Try `{org}/{repo}`, then `websites/{domain_path}`, then official `/llms.txt`. |
| Official `/llms.txt` 404 | Docs do not support llms.txt or moved domain.             | Try docs subdomain, project site, WebSearch, then repo analysis.              |
| 403/429                  | Auth/rate limit/security block.                           | Stop retrying, switch source, mention limit.                                  |
| Empty/garbled page       | JS-rendered or blocked content.                           | Use docs repo, Markdown source, package docs, or public mirror.               |
| GitHub repo 404          | Private, renamed, wrong org, proprietary.                 | Find official site, package registry, or organization profile.                |
| Repomix hangs/OOM        | Repo too large or contains binaries.                      | Shallow clone, include docs only, exclude binaries/build artifacts.           |
| Conflicting versions     | Legacy docs mixed with current docs.                      | Identify version and label legacy/current clearly.                            |
| Agent findings disagree  | Source quality differs.                                   | Prefer official/versioned docs, cite disagreement.                            |

## context7 pattern checks

```txt
GitHub repo: https://context7.com/{org}/{repo}/llms.txt
Website:     https://context7.com/websites/{normalized-domain-path}/llms.txt
Topic:       .../llms.txt?topic={keyword}
```

Try 2-3 plausible normalizations, then move on. Do not spend minutes guessing.

## Official fallback patterns

```txt
https://docs.{name}.com/llms.txt
https://{name}.dev/llms.txt
https://{name}.io/llms.txt
https://{name}.com/llms.txt
https://www.{name}.com/llms.txt
```

If all fail, search:

```txt
{name} llms.txt
{name} documentation AI format
{name} GitHub docs
```

## Repository fallback

Use repository analysis when no reliable llms.txt exists.

Checklist:

- Verify org/repo is official by website links, README, package metadata, activity, and license.
- Prefer shallow clone or direct Markdown reads.
- Include only relevant docs when repo is large.

Focused include idea:

```txt
README*, docs/**, documentation/**, examples/**, packages/*/README*, *.md
```

Exclude:

```txt
node_modules/**, vendor/**, dist/**, build/**, *.png, *.jpg, *.pdf, *.zip
```

## Conflict resolution

Priority order:

1. Official docs for the requested version.
2. Official release notes or migration guide.
3. Official repo README/examples.
4. Package registry metadata.
5. Maintainer answers/issues.
6. Community posts, only with caveat.

Report shape:

```md
Conflict: [topic]

- Source A ([url], version/date): says ...
- Source B ([url], version/date): says ...
  Decision: prioritized ... because ...
```

## User-facing error notes

Keep notes short and actionable:

```md
I could not access [source] because [reason]. I used [fallback source] instead. Missing confidence area: [gap].
```

```md
No official docs found for [topic]. I used repository examples and package metadata; verify in your project before production use.
```

## Anti-patterns

- Repeating the same failing URL many times.
- Treating community tutorials as official.
- Mixing versioned docs without labels.
- Hiding access/rate-limit failures.
- Returning only links when the user asked for an answer.
