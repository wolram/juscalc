# Playwright Workflow Automation

This folder contains a CLI-first workflow script:

- `automate-workflow.sh`

The script:

- opens the app login page
- optionally signs in
- navigates core screens
- captures a browser screenshot on every screen change
- optionally captures OS/window screenshots using the screenshot skill helper

## Run Steps

1. Start the app server in another terminal:

```bash
pnpm dev
```

2. Run the workflow (without login):

```bash
bash scripts/playwright/automate-workflow.sh
```

3. Run the workflow with login:

```bash
WORKFLOW_EMAIL="your-user@example.com" \
WORKFLOW_PASSWORD="your-password" \
bash scripts/playwright/automate-workflow.sh
```

4. Optional: also capture OS-level active-window screenshots at each state change:

```bash
CAPTURE_OS_SCREENSHOTS=1 \
bash scripts/playwright/automate-workflow.sh
```

## Useful Environment Variables

- `BASE_URL` (default: `http://localhost:3000`)
- `PLAYWRIGHT_SESSION` (default: `revisional-workflow`)
- `OUTPUT_DIR` (default: `output/playwright/revisional-workflow/<timestamp>`)
- `HEADED` (`1` default, set `0` for headless)
- `WORKFLOW_EMAIL`, `WORKFLOW_PASSWORD` (optional login)
- `CAPTURE_OS_SCREENSHOTS` (`0` default, `1` enables screenshot skill helper)

## Output

Artifacts are saved under:

```bash
output/playwright/revisional-workflow/<timestamp>/
```

Including command logs in `commands.log` and generated screenshots.
