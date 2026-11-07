# SubFree domain review setup

## Required GitHub token permissions

The existing Supabase Edge Function secret `GITHUB_TOKEN` must be a fine-grained token scoped to `LordLOLQDH/subfree` with:

- Contents: Read and write
- Pull requests: Read and write

The Edge Function uses it to create a request branch, write the public request JSON, open a pull request, and verify a merged request.

## Automatic review without an AI API

SubFree does not use OpenAI or another paid AI API. GitHub Actions performs deterministic checks only: request JSON and schema, safe path slug, HTTPS target, terms acceptance, technical check results, and exclusion of private applicant information from the public PR.

After these checks pass, GitHub Actions posts a summary comment. These rules are not an AI security review and cannot reliably detect phishing, scams, malware, or deceptive websites. The operator must inspect the target website and request manually.

No `OPENAI_API_KEY` or paid AI subscription is needed.

## Manual approval

1. Review the request JSON and website.
2. Read the automatic technical test results.
3. Read the automatic validation comment. It checks structure, not website trustworthiness.
4. Check the actual website and the stated purpose.
5. Merge the pull request manually only when you approve it.

After the merge, GitHub Actions calls the SubFree API. The API verifies that the matching pull request is actually merged before enabling the path.
