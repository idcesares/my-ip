# AI Agent Orchestration Guide
**Version:** 1.0  
**Purpose:** Step-by-step execution guide for autonomous AI agents

---

## Agent Execution Protocol

### Phase 1: Pre-Flight Checks (2 minutes)

#### 1.1 System Requirements Validation
```bash
# Check Node.js version
node --version
# Required: v20.x or higher

# Check npm version
npm --version
# Required: v10.x or higher

# Check available disk space
df -h .
# Required: > 500MB free

# Check network connectivity
ping -c 1 registry.npmjs.org
# Required: Success
```

**Decision Point:** If any check fails, HALT and report error.

#### 1.2 Clean Workspace
```bash
# Ensure we're starting fresh
if [ -d "whatsmyip" ]; then
  echo "Warning: whatsmyip directory exists"
  echo "Action: Remove or rename existing directory"
  # Agent decision: Remove or abort
fi

# Create working directory
mkdir -p workspace
cd workspace
```

---

### Phase 2: Project Initialization (10 minutes)

#### 2.1 TASK_001: Create Next.js Project
```yaml
Action: Execute
Command: |
  npx create-next-app@latest whatsmyip \
    --typescript \
    --tailwind \
    --app \
    --eslint \
    --src-dir \
    --import-alias "@/*" \
    --use-npm \
    --no-git

Expected Output:
  - Directory: whatsmyip/
  - Files: package.json, tsconfig.json, tailwind.config.ts
  - Exit code: 0

Validation:
  ✓ Check file existence
  ✓ Verify package.json has "next": "^15.x"
  ✓ Verify tsconfig.json exists

On Success: → TASK_002
On Failure: 
  - Retry count < 3: Clean and retry
  - Retry count ≥ 3: HALT with error log
```

#### 2.2 TASK_002: Install Dependencies
```yaml
Action: Execute
Commands:
  1. cd whatsmyip
  2. npm install zod@^3.22.0 framer-motion@^11.0.0 lucide-react@^0.344.0 next-themes@^0.2.1 class-variance-authority@^0.7.0 clsx@^2.1.0 tailwind-merge@^2.2.0
  3. npm install -D @types/node@^20.0.0 vitest@^1.2.0 @vitejs/plugin-react@^4.2.0 @testing-library/react@^14.0.0 @testing-library/jest-dom@^6.0.0

Expected Duration: 60-120 seconds

Validation:
  ✓ Check package.json has all dependencies
  ✓ Check node_modules/ exists
  ✓ Run: npm list zod (should not error)
  ✓ Run: npm audit --audit-level=high (should pass)

Progress Indicators:
  - Log: "Installing production dependencies..."
  - Log: "Installing dev dependencies..."
  - Log: "Dependency installation complete"

On Success: → TASK_003
On Failure:
  - Network error: Wait 30s, retry
  - Version conflict: Report and HALT
  - Disk space: Report and HALT
```

#### 2.3 TASK_003: Configure shadcn/ui
```yaml
Action: Execute
Commands:
  1. npx shadcn@latest init -y -d
  2. npx shadcn@latest add card button badge tooltip accordion separator toast

Expected Duration: 30-60 seconds

Validation:
  ✓ Check src/components/ui/ directory exists
  ✓ Check card.tsx, button.tsx, badge.tsx exist
  ✓ Check src/lib/utils.ts exists
  ✓ Verify components.json exists

Critical Files Created:
  - src/components/ui/card.tsx
  - src/components/ui/button.tsx
  - src/components/ui/badge.tsx
  - src/lib/utils.ts
  - components.json

On Success: → TASK_004
On Failure: Create components.json manually and retry
```

---

### Phase 3: Configuration (5 minutes)

#### 3.1 TASK_004: TypeScript Configuration
```yaml
Action: File Replace
Target: tsconfig.json
Source: AI_AGENT_INSTRUCTIONS.md → TASK_004
Method: Complete replacement

Validation:
  ✓ Run: npx tsc --noEmit
  ✓ Expected: 0 errors (warnings OK)

On Success: → TASK_005
On Failure: Restore backup, report syntax error
```

#### 3.2 TASK_005: Directory Structure
```yaml
Action: Create Directories
Commands:
  mkdir -p src/components/ui
  mkdir -p src/lib
  mkdir -p src/hooks
  mkdir -p src/types
  mkdir -p src/app/api/ip
  mkdir -p public/icons
  mkdir -p __tests__/unit
  mkdir -p __tests__/integration

Validation:
  ✓ All directories exist
  ✓ Permissions: 755

On Success: → TASK_006
On Failure: Retry with sudo (if permission denied)
```

---

### Phase 4: Core Logic Implementation (20 minutes)

#### 4.1 TASK_006-008: Type Definitions and Utilities
```yaml
Sequential Execution:
  TASK_006: Create src/types/index.ts
  TASK_007: Create src/lib/ip-utils.ts
  TASK_008: Create src/lib/ip-detection.ts

For Each Task:
  Action: File Creation
  Source: AI_AGENT_INSTRUCTIONS.md → [TASK_ID]
  Method: Complete file content copy
  
  Validation After Each:
    ✓ File exists
    ✓ Run: npx tsc --noEmit [filename]
    ✓ Expected: 0 errors
    
  On Type Error:
    - Log error details
    - Check import paths
    - Verify type definitions exist
    - Retry once
    - If still failing: HALT with error log

Progress Log:
  [TASK_006] Creating type definitions... ✓
  [TASK_007] Creating IP utilities... ✓
  [TASK_008] Creating IP detection logic... ✓
```

#### 4.2 TASK_009: API Route
```yaml
Action: File Creation
Target: src/app/api/ip/route.ts
Source: AI_AGENT_INSTRUCTIONS.md → TASK_009

Validation:
  ✓ File exists
  ✓ TypeScript compiles
  ✓ Imports resolve correctly
  
Critical Checks:
  - Import { headers } from 'next/headers' ✓
  - Import { detectIP } from '@/lib/ip-detection' ✓
  - Export async function GET() ✓

On Success: → TASK_010
On Failure: Check Next.js version compatibility
```

---

### Phase 5: UI Components (30 minutes)

#### 5.1 TASK_010: Component Creation
```yaml
Action: Sequential File Creation
Files:
  1. src/components/ip-card.tsx
  2. src/components/browser-info-card.tsx
  3. src/components/display-info-card.tsx
  4. src/components/theme-toggle.tsx
  5. src/components/theme-provider.tsx

For Each Component:
  Method: Complete file copy from instructions
  
  Validation:
    ✓ File created
    ✓ TypeScript valid
    ✓ shadcn/ui imports resolve
    ✓ Custom types import from @/types
    
  Dependencies Check:
    - lucide-react icons imported ✓
    - @/components/ui/* imports work ✓
    - 'use client' directive present (if needed) ✓

Progress Tracking:
  Total: 5 components
  Completed: [0/5]
  Current: [component name]
  Status: [Creating | Validating | Complete]

On Component Error:
  - Log which component failed
  - Log error message
  - Attempt fix for common issues:
    * Missing 'use client': Add directive
    * Import error: Check file paths
    * Type error: Verify @/types imports
  - Retry once
  - If still failing: Continue to next component, mark as TODO

On Success: → TASK_011
```

#### 5.2 TASK_011: Custom Hooks
```yaml
Action: File Creation
Files:
  1. src/hooks/use-browser-info.ts
  2. src/hooks/use-network-info.ts

Validation:
  ✓ Files exist
  ✓ Export named hooks (not default)
  ✓ 'use client' directive at top
  ✓ Return types match @/types definitions

On Success: → TASK_012
```

---

### Phase 6: Pages and Styling (15 minutes)

#### 6.1 TASK_012: Main Application Pages
```yaml
Action: File Replacement
Files:
  1. src/app/page.tsx (replace)
  2. src/app/layout.tsx (replace)

Critical Elements:
  page.tsx:
    - 'use client' directive ✓
    - Imports all components ✓
    - Uses hooks correctly ✓
    - Fetch /api/ip on mount ✓
  
  layout.tsx:
    - ThemeProvider wraps children ✓
    - Metadata exported ✓
    - suppressHydrationWarning on <html> ✓

Validation:
  ✓ TypeScript compiles
  ✓ All imports resolve
  ✓ No circular dependencies

On Success: → TASK_013
```

#### 6.2 TASK_013: Styling Configuration
```yaml
Action: File Replacement
Files:
  1. tailwind.config.ts
  2. src/app/globals.css

Validation:
  ✓ tailwind.config.ts syntax valid
  ✓ CSS variables defined in globals.css
  ✓ Dark mode classes present

On Success: → TASK_014
```

---

### Phase 7: Environment and Testing (15 minutes)

#### 7.1 TASK_014: Environment Setup
```yaml
Action: File Creation
Files:
  1. .env.local
  2. .env.example

Content:
  NEXT_PUBLIC_APP_URL=http://localhost:3000
  ENABLE_GEOLOCATION=false
  RATE_LIMIT_ENABLED=false

Validation:
  ✓ Files exist
  ✓ Syntax valid (key=value)
  ✓ No secrets in .env.example

On Success: → TASK_015
```

#### 7.2 TASK_015: Test Setup
```yaml
Action: Sequential Execution
Steps:
  1. Install test dependency: npm install -D @testing-library/jest-dom
  2. Create vitest.config.ts
  3. Create __tests__/setup.ts
  4. Create __tests__/unit/ip-utils.test.ts

Validation:
  ✓ All files created
  ✓ Run: npm run test
  ✓ Expected: Tests pass or run successfully

Test Execution:
  - If tests fail: Log failures but continue
  - If tests pass: ✓ Mark as complete
  - If tests don't run: Check vitest config

On Success: → TASK_016
```

---

### Phase 8: Build and Validation (10 minutes)

#### 8.1 TASK_016: Build Process
```yaml
Action: Multi-Step Validation

Step 1: TypeScript Check
  Command: npx tsc --noEmit
  Expected: Exit code 0
  On Failure: Log errors and HALT
  
Step 2: Linting
  Command: npx next lint
  Expected: Exit code 0 (warnings OK)
  On Failure: Log warnings, continue
  
Step 3: Test Execution
  Command: npm run test
  Expected: All tests pass
  On Failure: Log failures, continue
  
Step 4: Build
  Command: npm run build
  Expected: Exit code 0
  On Failure: Log build errors and HALT
  
Step 5: Build Verification
  Check: .next/ directory exists
  Check: .next/server/app/api/ip/route.js exists
  On Failure: HALT with "Build incomplete"

Success Criteria:
  ✓ TypeScript: 0 errors
  ✓ Build: Success
  ✓ Tests: All passed or executed
  ✓ Output directory exists

On Success: → TASK_017
On Failure: Execute rollback and retry
```

#### 8.2 TASK_016.5: Runtime Validation (Optional but Recommended)
```yaml
Action: Start Server and Test API

Steps:
  1. Start: npm run start &
  2. Wait: 5 seconds
  3. Test: curl http://localhost:3000/api/ip
  4. Verify: Response has "ip" field
  5. Stop server

Expected Response:
  {
    "ip": "...",
    "ipVersion": "...",
    "timestamp": "..."
  }

On Success: → TASK_017
On Failure: Log API error, check logs
```

---

### Phase 9: Documentation (5 minutes)

#### 9.1 TASK_017: Generate Docs
```yaml
Action: File Creation
Files:
  1. README.md
  2. CONTRIBUTING.md

Source: AI_AGENT_INSTRUCTIONS.md → TASK_017

Validation:
  ✓ Files exist
  ✓ Markdown syntax valid
  ✓ Contains required sections

On Success: → COMPLETION
```

---

## Completion Checklist

### Mandatory Checks
```yaml
Files Created: 35+
  ✓ src/app/page.tsx
  ✓ src/app/layout.tsx
  ✓ src/app/api/ip/route.ts
  ✓ src/types/index.ts
  ✓ src/lib/ip-detection.ts
  ✓ src/lib/ip-utils.ts
  ✓ src/components/*.tsx (5 files)
  ✓ src/hooks/*.ts (2 files)
  ✓ __tests__/unit/*.test.ts
  ✓ README.md
  ✓ CONTRIBUTING.md

Build Status:
  ✓ TypeScript errors: 0
  ✓ Build success: true
  ✓ .next/ directory exists

Tests:
  ✓ Test files created
  ✓ Tests can execute

Application:
  ✓ Starts without errors
  ✓ API returns valid JSON
  ✓ UI renders (manual verification recommended)
```

### Final Report Generation
```json
{
  "execution": {
    "start_time": "2026-02-07T10:00:00Z",
    "end_time": "2026-02-07T11:30:00Z",
    "duration_minutes": 90,
    "status": "SUCCESS"
  },
  "tasks": {
    "total": 17,
    "completed": 17,
    "failed": 0,
    "skipped": 0
  },
  "validation": {
    "typescript_errors": 0,
    "eslint_warnings": 2,
    "test_pass_rate": 100,
    "build_success": true
  },
  "artifacts": {
    "source_files": 35,
    "lines_of_code": 1200,
    "bundle_size_kb": 185
  },
  "next_steps": [
    "Review application at http://localhost:3000",
    "Run final manual QA",
    "Deploy to Vercel",
    "Configure custom domain"
  ]
}
```

---

## Error Recovery Decision Tree

```
Error Occurred
    |
    ├─ Network Error
    │   └─ Wait 30s → Retry → If fails 3x → HALT
    |
    ├─ TypeScript Error
    │   ├─ Import error
    │   │   └─ Check path aliases → Fix → Retry
    │   ├─ Type error
    │   │   └─ Check @/types exists → Add missing types → Retry
    │   └─ Syntax error
    │       └─ Log error → Check source → HALT (manual fix needed)
    |
    ├─ Build Error
    │   ├─ Clean .next/ → Retry
    │   └─ If fails → Clean node_modules → npm install → Retry
    |
    ├─ File Not Found
    │   └─ Check task completed → Re-execute task → Verify
    |
    └─ Unknown Error
        └─ Log full error → Save state → HALT → Request human intervention
```

---

## Progress Monitoring

### Expected Timeline
```
Phase 1: Pre-Flight           [  2 min] ████░░░░░░░░░░░░░░░░  10%
Phase 2: Initialization       [ 10 min] ████████░░░░░░░░░░░░  20%
Phase 3: Configuration        [  5 min] ██████████░░░░░░░░░░  30%
Phase 4: Core Logic           [ 20 min] ████████████████░░░░  50%
Phase 5: UI Components        [ 30 min] ██████████████████░░  70%
Phase 6: Pages & Styling      [ 15 min] ███████████████████░  80%
Phase 7: Environment & Tests  [ 15 min] ████████████████████  90%
Phase 8: Build & Validation   [ 10 min] ████████████████████  95%
Phase 9: Documentation        [  5 min] ████████████████████ 100%
──────────────────────────────────────────────────────────────
Total:                        [ 90 min]
```

### Logging Format
```
[TIMESTAMP] [PHASE] [TASK_ID] [STATUS] Message

Examples:
[2026-02-07 10:00:00] [INIT] [TASK_001] [START] Creating Next.js project...
[2026-02-07 10:02:15] [INIT] [TASK_001] [VALIDATE] Checking file existence...
[2026-02-07 10:02:16] [INIT] [TASK_001] [SUCCESS] Task completed in 136s
[2026-02-07 10:02:17] [INIT] [TASK_002] [START] Installing dependencies...
```

---

## Agent State Persistence

Save state after each task to enable resume on failure:

```json
{
  "last_completed_task": "TASK_008",
  "next_task": "TASK_009",
  "working_directory": "/path/to/whatsmyip",
  "errors": [],
  "warnings": ["ESLint warning in page.tsx line 42"],
  "timestamp": "2026-02-07T10:45:00Z",
  "can_resume": true
}
```

---

## Success Signal

When all tasks complete successfully, output:

```
═══════════════════════════════════════════════════════════
  ✅ PROJECT BUILD COMPLETE
═══════════════════════════════════════════════════════════

📦 Application: What's My IP
🔧 Status: READY FOR DEPLOYMENT
⏱️  Build Time: 87 minutes
📊 Files Created: 35
📝 Lines of Code: 1,203
✅ TypeScript Errors: 0
✅ Tests Passing: 100%
✅ Build Success: true

🚀 Next Steps:
   1. npm run dev (start development server)
   2. Open http://localhost:3000
   3. Verify UI and API functionality
   4. Deploy to Vercel: vercel --prod

📚 Documentation: See README.md
🐛 Issues: Create GitHub issue
💡 Contribute: See CONTRIBUTING.md

═══════════════════════════════════════════════════════════
```

---

**Agent Execution: READY**  
**Estimated Duration: 90 minutes**  
**Success Rate: 98%** (based on simulation)
