# SubFree domain review setup

## Required GitHub token permissions

The existing Supabase Edge Function secret `GITHUB_TOKEN` must be a fine-grained token scoped to `LordLOLQDH/subfree` with:

- Contents: Read and write
- Pull requests: Read and write

The Edge Function uses it to create a request branch, write the public request JSON, open a pull request, and verify a merged request.

## Optional AI review

The workflow in `.github/workflows/domain-requests.yml` supports an OpenAI Responses API review. It is deliberately not active unless the repository secret `OPENAI_API_KEY` is configured.

Add the secret under:

GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Name: `OPENAI_API_KEY`

The AI step sends only the public request fields (slug, target website, purpose, technical check results). It does not send applicant name, email, project access code, or IP hash.

**Cost warning:** OpenAI API usage may be billed separately from ChatGPT. Do not add a key or enable this integration unless the account owner understands and approves the possible charges. The AI must only comment on risk and never merge or approve a pull request.

Without the secret, the workflow posts a warning and the request still requires your own review. Do not treat a missing AI review as an approval.

## Manual approval

1. Review the request JSON and website.
2. Read the automatic technical test results.
3. Read the AI review comment if configured.
4. Check the actual website and the stated purpose.
5. Merge the pull request manually only when you approve it.

After the merge, GitHub Actions calls the SubFree API. The API verifies that the matching pull request is actually merged before enabling the path.
