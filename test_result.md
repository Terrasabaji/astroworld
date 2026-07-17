#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Finish and harden the Astro World Vedic astrology suite: productionize the auth
  flow (env-gated OTP bypass, real two-step OTP entry UI, delivery seam,
  AUTH_SECRET fail-closed), operational hardening of the Python calculation
  engine (executable resolution, spawn timeouts, datetime deprecation), stop
  tracking PII and ship anonymized seed fixtures, add owner-scoped auth to the
  births API, clean up legacy artifacts, add real auth tests, and fix the
  user-reported Education & Career adviser client-side crash. Reconcile the
  extracted working tree back into `main`.

backend:
  - task: "Python engine hardening: executable resolution, spawn timeout, datetime deprecation"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js, python_engine/*.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: true
        -agent: "main"
        -comment: "runPython now enforces ASTRO_WORLD_PYTHON_TIMEOUT_MS (default 90000ms), SIGKILLs on expiry and rejects with code PYTHON_TIMEOUT; pythonErrorResponse maps to 504 (timeout) or 500. Applied to all 9 runPython call sites. All datetime.utcnow() replaced with timezone-aware now(UTC). npm run build passes; python smoke tests pass under -W error::DeprecationWarning."

  - task: "Auth productionization: env-gated bypass, AUTH_SECRET fail-closed, OTP delivery seam"
    implemented: true
    working: true
    file: "lib/auth.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: true
        -agent: "main"
        -comment: "Removed module-level BYPASS_OTP=true and hardcoded secret. bypassEnabled() reads AUTH_BYPASS_OTP (default false) at call time. getAuthSecret()/assertSecret() fail closed in production when AUTH_SECRET is unset or the dev default. verifyToken also asserts the secret (forged tokens rejected). deliverOtp() seam logs OTP in dev, no-op/pending in prod. 13 automated tests in tests/auth.test.mjs pass (npm test)."

  - task: "Births API: require auth and owner-scoping (GET/POST/DELETE)"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js, lib/births.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: true
        -agent: "main"
        -comment: "Fixed live bug: lib/births.js was missing 'import fs from fs/promises' (GET /api/births returned 500 fs is not defined). Births routes now call authenticateRequest -> 401 without a token; list scoped to caller email; GET/DELETE by id return 404 on owner mismatch; POST stamps caller owner_email. Frontend callers send Authorization: Bearer <astro-world-token>. Live curl verified 401/200/404 paths."

  - task: "Stop tracking PII; ship anonymized seed fixtures"
    implemented: true
    working: true
    file: ".gitignore, data/seed/*.json, scripts/seed-data.mjs, README.md"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
        -working: true
        -agent: "main"
        -comment: "git rm --cached of real user/birth JSON and users-master.json; .gitignore updated to keep only .gitkeep. Added anonymized data/seed/users.sample.json + births.sample.json and idempotent scripts/seed-data.mjs (documented in README). git ls-files data/ shows only .gitkeep + seed samples."

frontend:
  - task: "Two-step OTP auth UI (register -> OTP entry) with env-gated bypass"
    implemented: true
    working: true
    file: "components/auth/AuthGate.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: true
        -agent: "main"
        -comment: "AuthGate now has step 'details' (name/mobile/email -> POST /api/auth/register) and step 'otp' (6-slot InputOTP, masked email, Back, Resend, inline error, Verifying loading). When otp_bypass is true it auto-verifies with 000000 (frictionless dev); when off it advances to OTP entry. Dev hint shows the literal 000000 only when bypass on, else notes the code is printed to the server log. Matches design mocks in /code/.plans/designs/. Needs visual UI validation by testing agent."

  - task: "Education & Career adviser client-side crash on Generate Full Report"
    implemented: true
    working: true
    file: "app/adviser/page.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: false
        -agent: "user"
        -comment: "User reported: 'Application error: a client-side exception has occurred while loading localhost'. API POST /api/adviser/report returns 200 with valid data, so it is a render-time error."
        -working: true
        -agent: "main"
        -comment: "Root cause: remedies rendering did (r.measures || []).map(...) but measures is an OBJECT {deity,mantra,gem,charity,day,lifestyle}, so .map on an object threw; remedies render on the default Education tab, crashing immediately on setReport. Fixed to render Object.entries(measures) as labeled list items (and still handle array/legacy shape). Verified end-to-end via agent-browser: Education and Career tabs both render fully with remedies; screenshot at /code/.generated_artifacts/images/adviser-fixed-education.png. Needs testing-agent regression pass on Generate Full Report."

metadata:
  created_by: "main_agent"
  version: "1.1"
  test_sequence: 0
  run_ui: true

test_plan:
  current_focus:
    - "Two-step OTP auth UI (register -> OTP entry) with env-gated bypass"
    - "Education & Career adviser client-side crash on Generate Full Report"
    - "Auth productionization: env-gated bypass, AUTH_SECRET fail-closed, OTP delivery seam"
    - "Births API: require auth and owner-scoping (GET/POST/DELETE)"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
    -agent: "main"
    -message: |
      Implemented auth productionization, python-engine hardening, births auth +
      owner scoping, PII/seed cleanup, legacy-artifact cleanup, real auth tests
      (npm test, 13 passing), and fixed the user-reported adviser crash. Please
      validate: (1) the two-step OTP screen visually against the design mocks at
      /code/.plans/designs/step1-register.html and otp-entry-*.html (bypass ON
      auto-logs in with 000000; bypass OFF shows the OTP entry step and rejects a
      wrong code); (2) the Education & Career adviser Generate Full Report flow on
      both the Education and Career tabs (must render with no client-side error);
      (3) python smoke via a chart calculation. Dev server: localhost:3100 with
      AUTH_BYPASS_OTP=true and ASTRO_WORLD_PYTHON exported.
