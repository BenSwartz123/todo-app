University of the Witwate
rsrand Starting a Project
COMS3011A Lab 1 COMS3
011A Lab 1 Brendan Griffit
hs 1 Starting a Project Due
date: 4 August 2026 1.1 …
PASTED
Strategized iterative project development with emphasis on commit history and collaborative refin…
Thanks for sharing the brief — Lab 1 is due 4 August, so you've got a week, and one
detail is worth acting on today rather than later.
Commit history is 18 marks and partly time-gated. Full marks require at least six
coherent commits visibly spread over more than one session. That's the one criterion
you can't recover retroactively — if the whole thing lands on 3 August, the timestamps
cap you at level 1 no matter how good the code is. Same logic applies to the AI usage
mark (8): level 0 is explicitly "whole-project generation with no input beyond the brief,"
and level 2 needs a transcript showing you rejecting or correcting something I
produced. So it's worth us working in slices, and worth you saving transcripts as you go
rather than reconstructing them at the end.
A few design decisions the rubric quietly dictates:
Overdue is derived, never stored. No is_overdue column, no fourth status.
Compute it at read time: due date in the past AND status isn't Complete. Storing it
is an explicit level-1 penalty.
Archive is a flag or timestamp on the task row — an archived_at that's NULL
for active tasks works well. Copying rows to an archive table is called out as
unsound.
Documentation says "tables and the relationships between them", plural —
which nudges toward a separate topics table with a foreign key from tasks,
rather than topic as a free-text column. Either can be defensible, but the two-table
version gives you an actual relationship to document.
Tests must run against a throwaway database. If they read your dev .db file,
that's a level-1 cap even if the assertions are good. A temp file or in-memory DB
seeded per test is the fix, and at least one test needs to cover archiving or the
overdue rule.
On the stack: better-sqlite3 is the conventional pick for this shape of app —
synchronous API, no separate process, which suits a local-first single-user tool. You'll
want a written reason like that for each dependency, since bare dependency lists are
the named level-1 failure for documentation.
Lab 1 project setup and commit strategy 
Where would you like to start — schema design, or scaffolding the Next.js project first?
lets start right now
Architected database schema and scaffolding strategy with testability
Right — slice one: repo, schema, and a database layer that's testable from the start.
1. Scaffold
Take the App Router. I'll write TypeScript below; if you chose JS, drop the annotations
and rename to .js .
Then pin your Node version now, because the documentation criterion explicitly
requires naming it:
2. Schema — db/schema.sql
bash
npx create-next-app@latest todo-app
cd todo-app
npm install better-sqlite3
bash
node --version > .nvmrc # check it lands as e.g. v22.14.0
sql
Three things here are doing rubric work. The CHECK constraint enforces "three fixed
statuses" at the database level rather than trusting the UI — worth a sentence in your
docs. archived_at as a nullable timestamp is the archive-as-flag pattern the rubric
asks for. And there is deliberately no overdue column: it's derived at read time as
due_date < today AND status <> 'complete' .
3. Connection layer — lib/db.ts
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS topics (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT NOT NULL UNIQUE COLLATE NOCASE
);
CREATE TABLE IF NOT EXISTS tasks (
id INTEGER PRIMARY KEY AUTOINCREMENT,
title TEXT NOT NULL,
description TEXT NOT NULL DEFAULT '',
due_date TEXT NOT NULL, -- ISO 8601, YYYY-MM-DD
topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE RESTRICT,
status TEXT NOT NULL DEFAULT 'todo'
CHECK (status IN ('todo','in_progress','complete')),
archived_at TEXT, -- NULL = active
created_at TEXT NOT NULL DEFAULT (datetime('now')),
updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tasks_archived ON tasks(archived_at);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date);
ts
The DB_PATH env var is the single most important line for your testing mark. It means
your tests can point at a throwaway file in tmp/ instead of your development database
— which is exactly the difference between level 1 and level 2 on that criterion. Build it
in now and you never have to retrofit it.
4. Verify and commit
That won't run TS directly — simpler check: start the dev server ( npm run dev ), hit
the page once, and confirm data/todo.db appears. Then:
 
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), 'data', 'todo.db
// Next's dev server reloads modules; cache on globalThis so we don't
// reopen the database on every hot reload.
const g = globalThis as unknown as { __db?: Database.Database };
export function getDb(): Database.Database {
if (!g.__db) {
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(fs.readFileSync(path.join(process.cwd(), 'db', 'schema.sql'), 'utf8'
g.__db = db;
}
return g.__db;
}
 
bash
node -e "process.env.DB_PATH='./tmp/smoke.db'; require('./lib/db.ts')" 2>/dev/nu
bash
That commit message shape — what changed, plus the why where the diff doesn't
show it — is what the rubric asks for. Two lines is plenty.
One thing I'd flag as genuinely arguable: I've made topic_id a foreign key to a
topics table, which gives you a real relationship to write about in the database
section. The cost is that creating a task now needs topic-selection UI and a "create new
topic" path. A plain topic TEXT column on tasks is simpler and defensible for a
single-user local app — if you'd rather trade the relationship for less UI work, say so and
I'll rework the schema before you build anything on top of it.
Once you've committed, the next slice is the query layer: create, edit, archive, and the
sorted list read.
echo -e "data/\ntmp/\n*.db\n*.db-wal\n*.db-shm" >> .gitignore
git add -A
git commit -m "Add SQLite schema and connection layer
Archive is a nullable timestamp on tasks rather than a separate table,
so archived tasks stay viewable through the same queries. Overdue is
derived from due_date at read time, not stored."
where do i put step 1 into
Deliberated terminal setup requirements and project initialization logistics
A terminal — not the browser, not a file in the project. The commands run on your
machine's command line.
Opening one:
VS Code (easiest if you're already using it): Ctrl+` opens an integrated terminal.
Windows otherwise: Windows Terminal, or PowerShell from the Start menu.
macOS: Terminal.app, or iTerm.
Linux: whatever your distro gives you.
Before anything else, check Node exists:
If that errors or prints something below v18, install Node 20 or 22 LTS from nodejs.org
first — Next.js 15 won't run on older versions, and you need to know this number
anyway for the README.
Then navigate to wherever you keep code and run the scaffold there. create-nextapp creates the todo-app folder for you, so you want to be in the parent directory:
It'll ask you a series of questions — TypeScript, ESLint, Tailwind, App Router, and so
on. Defaults are fine; take App Router when it asks. Then cd todo-app and the rest of
the commands run from inside the project.
bash
node --version
bash
cd ~/Documents # or wherever — Windows: cd C:\Users\you\Documents
npx create-next-app@latest todo-app
Everything after that — the schema file, lib/db.ts — goes in the project folder,
created with your editor rather than typed into the terminal.
Show more
PS C:\auction-house> cd ~/Documents # or wherever — Windows: cd
C:\Users\you\Documents
>> npx create-next-app@latest todo-app
node:internal/modules/cjs/loader:1215
throw err;
^
Error: Cannot find module
'C:\Users\BenSwartz\node20\node_modules\npm\bin\npm-prefix.js'
at Module._resolveFilename (node:internal/modules/cjs/loader:1212:15)
Diagnosed missing npm binaries and formulated reinstallation solutions
Node itself is fine — v20.19.4 runs. It's npm that's broken: your Node lives in
C:\Users\BenSwartz\node20 , and the node_modules\npm folder inside it is missing
or gutted. That usually happens after a failed npm install -g npm , or from a zip
extraction that got partially deleted. Both npm and npx are just shims that call into
those missing files, so nothing that needs them will work until it's repaired.
First, confirm the diagnosis:
If that last line prints False , npm is genuinely gone and that's the whole problem.
Also check whether a version manager is in play:
If that works, you have nvm-windows, and the fix is cheap — nvm install 20.19.4
then nvm use 20.19.4 will lay down a clean copy of Node and npm. Reopen the
terminal afterwards.
If nvm isn't recognised, that node20 folder is a manual install, and the cleanest repair
is the official installer. Go to nodejs.org, download the Windows LTS .msi (Node 22
powershell
where.exe node
where.exe npm
Test-Path C:\Users\BenSwartz\node20\node_modules\npm
powershell
nvm list
LTS is current), and run it. It bundles a matching npm and sets PATH properly.
One thing to do after installing: the old C:\Users\BenSwartz\node20 path is probably
still in your PATH and may shadow the new install. Once the MSI finishes, open a fresh
terminal and check:
If where.exe node still lists the node20 path first, edit your PATH (Win+R →
sysdm.cpl → Advanced → Environment Variables) and remove the node20 entry.
Then reopen the terminal again.
Whichever route you take, the npm --version printing a number is the signal you're
clear. Report what nvm list and Test-Path give you and I'll take it from there — and
once Node is settled, note the exact node --version output, since that's the number
your README has to name.
powershell
where.exe node
node --version
npm --version
PS C:\Users\BenSwartz\Documents> where.exe node
>> where.exe npm
>> Test-Path C:\Users\BenSwartz\node20\node_modules\npm
C:\Users\BenSwartz\node20\node.exe
C:\Program Files\nodejs\node.exe
C:\Program Files\nodejs\npm
C:\Program Files\nodejs\npm.cmd
False
PS C:\Users\BenSwartz\Documents>
Diagnosed duplicate Node installation conflict and prescribed PATH reordering solution
There's your problem, and it's a good outcome: you have two Node installs. C:\Program
Files\nodejs is intact and has npm. C:\Users\BenSwartz\node20 is the broken one
— and it sits first in PATH, so its node.exe wins, and npm then goes looking for its
libraries next to that binary, where they don't exist ( False ). Nothing needs
reinstalling; the bad entry just needs to stop shadowing the good one.
Quick check on the good install first:
powershell
The second line should print nothing. If it prints a path pointing into node20 , tell me —
that's a separate stale setting to clear.
Unblock this session immediately (temporary, dies when you close the terminal):
If both print versions, you're working again right now.
Then make it permanent. Look at what's actually in your PATH:
Note which of the two lists contains the node20 entry. If it's in User, this removes it
safely — it prints a backup first, so copy that line somewhere before continuing:
If it's in Machine instead, don't script it — use the GUI: Win+R → sysdm.cpl →
Advanced → Environment Variables → select Path under System variables → Edit →
select the node20 line → Delete. Editing the machine PATH by script needs an admin
shell and is easy to get wrong.
Either way, close the terminal, open a fresh one, and confirm:
& "C:\Program Files\nodejs\node.exe" --version
$env:npm_config_prefix
 
powershell
$env:Path = ($env:Path -split ';' | Where-Object { $_ -notlike '*node20*' }) -jo
node --version
npm --version
powershell
[Environment]::GetEnvironmentVariable('Path','User') -split ';'
[Environment]::GetEnvironmentVariable('Path','Machine') -split ';'
 
powershell
$old = [Environment]::GetEnvironmentVariable('Path','User')
$old # <- copy this output somewhere as a backup
$new = ($old -split ';' | Where-Object { $_ -notlike '*node20*' -and $_ -ne '' }
[Environment]::SetEnvironmentVariable('Path', $new, 'User')
powershell
where.exe node
node --version
npm --version
You want C:\Program Files\nodejs\node.exe listed first and no node20 line at all.
Once npm --version prints a number, npx create-next-app@latest todo-app will
run.
Whatever node --version reports at that point is the number your README has to
name — jot it down now rather than hunting for it next week. And you can delete the
C:\Users\BenSwartz\node20 folder once you've confirmed the other install works,
though there's no harm in leaving it.
PS C:\Users\BenSwartz\Documents> & "C:\Program
Files\nodejs\node.exe" --version
>> $env:npm_config_prefix
v25.9.0
PS C:\Users\BenSwartz\Documents> $env:Path = ($env:Path -split ';' |
Where-Object { $_ -notlike '*node20*' }) -join ';'
>> node --version
>> npm --version
v25.9.0
11.12.1
PS C:\Users\BenSwartz\Documents>
Weighed Node version compatibility and prioritized permanent PATH configuration
Working — npm 11.12.1 responding. Two things before you scaffold, both cheap now
and annoying later.
The PATH fix was session-only. That $env:Path = ... line dies when you close this
window, and the next terminal will be broken again. Run the permanent removal from
my last message — check which list holds the node20 entry:
then remove it from User by script, or from Machine via sysdm.cpl .
Node v25 is the wrong version for this project. Odd-numbered Node releases never
become LTS and get roughly six months of support, so v25 is at or past end-of-life by
now. Two concrete problems: better-sqlite3 is a native module that downloads a
prebuilt binary matching your Node ABI, and prebuilds for a short-lived odd release
are the ones most likely to be missing — which drops you into compiling from source,
which on Windows means installing Visual Studio build tools. Second, your README
powershell
[Environment]::GetEnvironmentVariable('Path','User') -split ';'
[Environment]::GetEnvironmentVariable('Path','Machine') -split ';'
names a Node version and a marker runs it from a clean clone; naming an EOL release
invites exactly the "doesn't start" failure that costs you the first walkthrough step.
Install Node 24 LTS from nodejs.org (the Windows .msi ) before scaffolding. It'll
overwrite C:\Program Files\nodejs cleanly. Then in a fresh terminal:
You want a single C:\Program Files\nodejs\node.exe , no node20 , and a v24.x.x.
Write that exact version string down — it goes in the README.
Then you're clear to scaffold:
Take App Router when prompted; other defaults are fine.
If npm install better-sqlite3 still throws a gyp or MSBuild error even on Node 24,
stop there and paste the output — that's the one dependency likely to fight you on
Windows, and there are cleaner fixes than installing a C++ toolchain.
powershell
where.exe node
node --version
npm --version
powershell
cd C:\Users\BenSwartz\Documents
npx create-next-app@latest todo-app
cd todo-app
npm install better-sqlite3
Show more
PS C:\Users\BenSwartz\Documents>
[Environment]::GetEnvironmentVariable('Path','User') -split ';'
>> [Environment]::GetEnvironmentVariable('Path','Machine') -split ';'
C:\Users\BenSwartz\node20
C:\windows\system32
C:\windows
C:\windows\System32\Wbem
C:\windows\System32\WindowsPowerShell\v1.0\
C:\windows\System32\OpenSSH\
Diagnosed PATH corruption and formulated cleanup strategy
Both node20 entries are in the User PATH — and note it appears twice, at position 1
and again further down. The first one is why it was winning. That means the scripted
fix works, and it'll catch both:
One thing worth knowing but not worth fixing today: your User PATH has swallowed a
copy of the system PATH. C:\windows\system32 , Wbem , dotnet , nodejs and friends
appear in both lists. That's the signature of an old setx PATH "%PATH%;something" —
it expands to machine+user combined and writes the lot back into User. It's untidy and
makes PATH long, but it's harmless, and unpicking it is a good way to break a working
machine on a day you have a lab due. Leave it.
Then close the terminal, open a fresh one, and check the fix survived:
You want C:\Program Files\nodejs\node.exe as the only line, with no node20 .
Then install Node 24 LTS from nodejs.org — grab whatever the site labels LTS rather
than trusting my version number. The MSI overwrites C:\Program Files\nodejs in
place and PATH already points there, so nothing else to configure. Reopen the terminal
once more, and the node --version it prints is the string your README names.
After that:
App Router when prompted. If better-sqlite3 throws anything mentioning gyp ,
MSBuild or node-gyp , stop and paste it — don't start installing Visual Studio build
tools on my say-so, there are lighter fixes.
 
powershell
$old = [Environment]::GetEnvironmentVariable('Path','User')
$old # <- copy this whole line of output somewhere first, as a backup
$new = ($old -split ';' | Where-Object { $_ -notlike '*node20*' -and $_ -ne '' }
[Environment]::SetEnvironmentVariable('Path', $new, 'User')
powershell
where.exe node
node --version
npm --version
powershell
cd C:\Users\BenSwartz\Documents
npx create-next-app@latest todo-app
cd todo-app
npm install better-sqlite3
Show more
PS C:\Users\BenSwartz\Documents> $old =
[Environment]::GetEnvironmentVariable('Path','User')
>> $old # <- copy this whole line of output somewhere first, as a backup
>> $new = ($old -split ';' | Where-Object { $_ -notlike '*node20*' -and $_ -
ne '' }) -join ';'
>> [Environment]::SetEnvironmentVariable('Path', $new, 'User')
C:\Users\BenSwartz\node20;C:\windows\system32;C:\windows;C:\windo
ws\System32\Wbem;C:\windows\System32\WindowsPowerShell\v1.0\;C:\
windows\System32\OpenSSH\;C:\Program Files\dotnet\;C:\Program
Verified backup integrity and charted next installation steps
Done — and your backup is printed right there in the transcript if you ever need to
restore it.
Now close this terminal entirely and open a fresh one (the change only applies to
newly-launched processes), then:
You want a single C:\Program Files\nodejs\node.exe and no node20 line at all. If
node20 still shows up, it didn't take and we'll look again.
Assuming it's clean: install Node LTS from nodejs.org — take whatever the site marks
LTS rather than my version number, since I can't see what's current from here. The MSI
overwrites C:\Program Files\nodejs in place and your PATH already points there, so
there's nothing to configure after. Reopen the terminal one more time, and the node -
-version output is the string your README will name.
Then scaffold:
powershell
where.exe node
node --version
npm --version
powershell
cd C:\Users\BenSwartz\Documents
npx create-next-app@latest todo-app
cd todo-app
npm install better-sqlite3
App Router when prompted; other defaults fine.
Two things to paste back if they happen: better-sqlite3 failing with anything about
gyp , MSBuild or node-gyp , or where.exe node still showing node20 . Otherwise,
next message can be the schema files and your first commit.
PS C:\auction-house> where.exe node
>> node --version
>> npm --version
C:\Users\BenSwartz\node20\node.exe
C:\Program Files\nodejs\node.exe
v20.19.4
11.12.1
Diagnosed stale environment inheritance and formulated verification strategy
Registry's likely fine — this terminal is inheriting a stale environment. The prompt is
back at C:\auction-house , which says this is an integrated terminal inside Cursor or
VS Code. That editor process was launched before you edited PATH, so every new
terminal it spawns inherits the old copy. Closing a tab isn't enough; the editor itself has
to restart.
Confirm the registry actually took:
No output means the change saved and it's purely inheritance.
Then open a PowerShell straight from the Start menu — not from inside the editor —
and check there:
If that one's clean, you've confirmed it. Fully quit Cursor/VS Code (and check Task
Manager for lingering processes if it's stubborn), reopen, and its terminals will pick up
the new PATH too.
 
powershell
[Environment]::GetEnvironmentVariable('Path','User') -split ';' | Select-String
powershell
where.exe node
node --version
Separately: node --version is reporting v20.19.4, which is the node20 binary
winning again — so I can't tell from this whether you've installed the LTS yet. Once
you're in a clean terminal, check with:
Earlier that said v25.9.0. If it still does, the LTS install hasn't happened and it's worth
doing before npm install better-sqlite3 — the native-module prebuilds are the
thing most likely to bite on an odd-numbered release.
powershell
& "C:\Program Files\nodejs\node.exe" --version
where is the start menu?
Thought for 4s
Bottom-left corner of the screen — the Windows logo button on the taskbar. On
Windows 11 it sits in the middle of the taskbar instead, but it's the same logo.
The fastest route skips it entirely: press the Windows key on your keyboard (bottomleft, between Ctrl and Alt, with the Windows logo on it), type powershell , and hit
Enter. That opens a fresh PowerShell window with a clean environment — which is the
whole point here, since it's launched by Windows rather than by your editor.
Once it's open, run:
That third line tells us whether the LTS install has happened yet.
powershell
where.exe node
node --version
& "C:\Program Files\nodejs\node.exe" --version
PS C:\Users\BenSwartz> where.exe node
C:\Users\BenSwartz\node20\node.exe
C:\Program Files\nodejs\node.exe
PS C:\Users\BenSwartz> node --version
v20.19.4
PS C:\Users\BenSwartz> & "C:\Program Files\nodejs\node.exe" --version
v25.9.0
Diagnosed PATH propagation issue and devised pragmatic resolution strategy
Two separate things here, and neither is fixed yet.
First, find out whether the PATH edit actually saved. Run the check I mentioned but
we skipped:
No output = the registry is clean and Windows just hasn't propagated the change to
newly-launched processes (explorer.exe caches the environment; a sign-out or reboot
forces it). Output = the edit didn't stick and we'll try the GUI instead.
Second, and independent of that: the LTS install hasn't happened. C:\Program
Files\nodejs is still v25.9.0. Go to nodejs.org, download the Windows LTS .msi , run
it. That needs doing regardless of the PATH situation.
The robust fix for node20 — rather than fighting environment propagation, make the
PATH entry point at nothing:
A PATH entry pointing at a folder that doesn't exist is simply skipped, so where.exe
node will fall through to C:\Program Files\nodejs whether or not the environment
has refreshed. Renaming rather than deleting means it's trivially reversible if
something unexpected depended on it — though given npm inside it is already
missing, it wasn't functional anyway.
So: run the registry check, install the LTS MSI, rename the folder, then reboot (this
clears the stale environment in one go rather than chasing it). After the reboot, in a
Start-menu PowerShell:
One clean C:\Program Files\nodejs\node.exe , a v22 or v24 version string, and an
npm version. That version string is what your README names.
 
powershell
[Environment]::GetEnvironmentVariable('Path','User') -split ';' | Select-String
powershell
Rename-Item C:\Users\BenSwartz\node20 node20-broken
powershell
where.exe node
node --version
npm --version
fucking hell you keep jumping so many steps, if this then that. go step by
fucking step. and anything to do with administartor i can't do because its
a company laptop
Identified admin constraint and pinpointed single actionable workaround
Fair. One step at a time, and I'll wait for output before the next.
Also noted on admin — that rules out the nodejs.org installer. You have scoop in your
PATH, which installs into your user profile and needs no admin, so there's a clean route
to a good Node version later. Not now.
Step 1. In the PowerShell window you have open, run this one command:
It renames the broken Node folder. A PATH entry pointing at a folder that no longer
exists is just skipped, so this removes the shadowing without touching environment
variables, without a reboot, and without admin.
Paste whatever it prints — including an error, if it errors.
powershell
Rename-Item C:\Users\BenSwartz\node20 node20-broken
it printed nothing
Thought for 2s
Nothing printed is what success looks like — PowerShell stays quiet when a rename
works.
Step 2. Same window, one command:
Paste the output.
powershell
where.exe node
PS C:\Users\BenSwartz> where.exe node
C:\Program Files\nodejs\node.exe
Thought for 2s
One line. The shadowing is gone.
Step 3. Same window:
powershell
node --version
PS C:\Users\BenSwartz> node --version
v25.9.0
Deliberated pragmatic troubleshooting strategy for Node version compatibility
That's the good install now — the one with working npm.
It's a slightly odd version (25 is past end-of-life), but rather than spend more steps on
Node installs, let's find out if it actually causes a problem. It only matters for one
package, and we'll know within a minute.
Step 4. Same window:
Then:
It'll ask a series of yes/no questions. Take the defaults for all of them, and choose App
Router if it asks. It then downloads for a minute or two.
Paste what it prints when it finishes.
powershell
cd C:\Users\BenSwartz\Documents
powershell
npx create-next-app@latest todo-app
what am i busy downloading
create-next-app — the official Next.js project generator. It creates a folder called
todo-app with a working skeleton: package.json , a starter page, config files, and the
node_modules folder holding React, Next.js and their dependencies. That's the bulk of
the download, a few hundred MB. Nothing is installed system-wide; it all lands inside
C:\Users\BenSwartz\Documents\todo-app and disappears if you delete the folder.
npx means "fetch this tool, run it once, don't keep it" — so the generator itself isn't
permanently installed either.
This is the standard way to start a Next.js project, and Next.js is what your brief
specifies. So the output is the starting point for the todo app: an app you can already
run with npm run dev and see in a browser, which you then build the tasks features
into.
Worth noting for later: the packages it installs are the beginning of your Third-Party
Code documentation section. Next.js and React come from this step, and bettersqlite3 follows. The rubric wants a line on why each was chosen — for these two the
reason is simply that the brief mandates the stack, which is a legitimate answer.
Go ahead and run it, and paste what it prints.
its still downloading - been like 5-8 minutes already
Investigated prolonged download status and connection integrity
Could be either — a few hundred MB on a slow or throttled connection genuinely takes
that long, and company laptops often have a proxy or security scanner in the middle
that slows npm right down. But it can also stall silently.
Tell the difference without touching that terminal: is anything still moving on screen?
create-next-app usually shows a spinner or a progress line while it works. If the last
line has been byte-for-byte identical for several minutes with no spinner, it's likely
stuck. If anything is animating, it's just slow — leave it.
Don't cancel it yet either way. Give it to 15 minutes total.
Meanwhile, open a second PowerShell window (Windows key, type powershell ,
Enter) and run:
powershell
Paste what that says.
Test-Path C:\Users\BenSwartz\Documents\todo-app\node_modules
PS C:\Users\BenSwartz> Test-Path
C:\Users\BenSwartz\Documents\todo-app\node_modules
True
Thinking about interpreting PowerShell command output and file system verification
node_modules exists, so it got past the questions and is installing. Now find out
whether it's still growing or has stalled.
In that second window, run this:
It takes a few seconds and prints a number. Paste it, then wait about 60 seconds and run
the exact same command again and paste the second number.
Two different numbers means it's working and just slow. The same number twice
means it's stalled.
 
powershell
(Get-ChildItem C:\Users\BenSwartz\Documents\todo-app\node_modules -Recurse -File
Initialized a git repository.
Success! Created todo-app at C:\Users\BenSwartz\Documents\todo-app
Thought for 2s
Done — and it initialised a git repository for you, which matters for the commit-history
mark later.
Step 5. Go back to the first window (the one that just finished) and run:
Then:
powershell
cd todo-app
This is the one package that might complain on Node 25. If it prints anything
mentioning gyp , MSBuild or node-gyp , paste it and stop there — don't act on any
advice it gives about installing build tools.
powershell
npm install better-sqlite3
PS C:\Users\BenSwartz\D
ocuments\todo-app> np
m install better-sqlite3 np
m warn ERESOLVE overri
ding peer dependency np
m warn While resolving:…
PASTED
Evaluated built-in SQLite compatibility and recommended dependency cleanup
better-sqlite3 has no ready-made binary for Node 25, so npm tried to compile it
from C++ source. That needs Python and a Microsoft C++ compiler. You can't install
either without admin. Dead end — not something you did wrong.
We don't need it. Node has SQLite built in now: since Node 22.5.0 a built-in
node:sqlite module ships with Node itself — no installation, no package.json entry,
no native build step, and it no longer requires the --experimental-sqlite flag since
Node 22.13 / 23.4. Same SQLite, same .db file, nearly the same API. Nothing to install,
and it removes the compile problem for your marker too.
Step 6. One command, to clear out the failed install:
Paste the output.
Mapsam Brian Douglass
powershell
npm uninstall better-sqlite3
done
Thought for 3s
Quick sanity check that the built-in module actually works on your Node before we
build on it.
Step 7. One command:
It should print something like { x: 42 } . An experimental warning above that is fine
and expected.
Paste what it prints.
 
powershell
node -e "const {DatabaseSync}=require('node:sqlite'); const d=new DatabaseSync('
PS C:\Users\BenSwartz\Documents\todo-app> node -e "const
{DatabaseSync}=require('node:sqlite'); const d=new
DatabaseSync(':memory:'); d.exec('CREATE TABLE t(x)');
d.prepare('INSERT INTO t VALUES (?)').run(42);
console.log(d.prepare('SELECT x FROM t').get());"
[Object: null prototype] { x: 42 }
Deliberated Node version requirements and schema implementation strategy
Working — and that's the last of the environment problems.
One good side effect: node:sqlite needs Node 22.13 or later, so your README can
say "Node 22.13+" and be honest. Any marker on Node 22 or 24 LTS will be fine, and
nobody has to compile anything.
Step 8. In your editor, create a new folder db inside todo-app , and in it a file called
schema.sql . Paste this in and save:
sql
So the file ends up at C:\Users\BenSwartz\Documents\todo-app\db\schema.sql .
Tell me when it's saved.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS topics (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT NOT NULL UNIQUE COLLATE NOCASE
);
CREATE TABLE IF NOT EXISTS tasks (
id INTEGER PRIMARY KEY AUTOINCREMENT,
title TEXT NOT NULL,
description TEXT NOT NULL DEFAULT '',
due_date TEXT NOT NULL,
topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE RESTRICT,
status TEXT NOT NULL DEFAULT 'todo'
CHECK (status IN ('todo','in_progress','complete')),
archived_at TEXT,
created_at TEXT NOT NULL DEFAULT (datetime('now')),
updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tasks_archived ON tasks(archived_at);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date);
saved, when do i push my commits and stuff?
Orchestrated commit timing and repository setup strategy
Commit now, and after each slice that leaves the app working — schema, db layer,
create-task, edit, archive, sorting, tests, docs. That naturally gets you past six commits
without padding.
Pushing is separate and doesn't change anything about the history: your commits keep
the timestamp of when you committed, not when you pushed. So push whenever, but
do it at least at the end of each session so the work is backed up. We'll create the GitHub
repo in a moment — create-next-app already made a local git repo and an initial
commit, so there's history to push to it.
One thing to get right before the first commit: the database file must not go into git. If it
does, a marker's clean clone starts with your data in it.
Step 9. Open .gitignore in the todo-app folder (it already exists), scroll to the
bottom, and add these lines:
Save it, and tell me when it's done.
# local database
data/
*.db
*.db-wal
*.db-shm
done
Orchestrated git workflow for schema persistence
Step 10. In the terminal, from inside todo-app :
Two -m flags give you a subject line and a body — that's the "what changed and why"
shape the rubric asks for.
If git complains that it doesn't know who you are, paste the error and don't run
anything it suggests yet.
 
powershell
git add -A
git commit -m "Add SQLite schema for tasks and topics" -m "Archive is a nullable
PS C:\Users\BenSwartz\Documents\todo-app> git add -A
>> git commit -m "Add SQLite schema for tasks and topics" -m "Archive is
a nullable timestamp on the task row so archived tasks stay viewable
through the same queries. Overdue is derived from due_date at read
time, not stored, so it can never go stale."
warning: in the working copy of '.gitignore', LF will be replaced by CRLF
the next time Git touches it
warning: in the working copy of 'package-lock.json', LF will be replaced by
CRLF the next time Git touches it
[master f2aa9f6] Add SQLite schema for tasks and topics
2 files changed, 28 insertions(+)
create mode 100644 DB/schema.sql
Identified case sensitivity issue requiring strategic git rename
Committed. The LF/CRLF warnings are normal on Windows and harmless.
One thing to fix before anything references that path: the folder got created as DB
(uppercase), not db . Windows treats those as the same, so it'll work fine on your
machine — but git recorded DB , and a marker cloning onto Linux or macOS would hit
"file not found" when the code looks for db/schema.sql . That's walkthrough step 1,
the expensive one.
Step 11. Because Windows can't tell the two names apart, it takes a rename in two hops:
Paste the output.
powershell
git mv DB db-tmp
git mv db-tmp db
git commit -m "Rename DB folder to lowercase db for case-sensitive filesystems"
done
Thought for 2s
Step 12. Verify git actually recorded the lowercase name:
powershell
git ls-files
Paste the output — I want to see db/schema.sql in lowercase in that list.
Show more
PS C:\Users\BenSwartz\Documents\todo-app> git ls-files
.gitignore
AGENTS.md
CLAUDE.md
README.md
app/favicon.ico
app/globals.css
app/layout.tsx
app/page.tsx
Architected database module adapting SQLite API conventions
db/schema.sql in lowercase, and it's a TypeScript project — good, the code below
matches.
Step 13. Create a folder lib inside todo-app , and a file db.ts in it. Paste this and
save:
ts
The DB_PATH line is the one that matters for your testing mark — it lets the tests point
at a throwaway database instead of your real one, which is the difference between level
1 and level 2 on that criterion.
Save it, then tell me and we'll check it runs.
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
const DB_PATH =
process.env.DB_PATH ?? path.join(process.cwd(), 'data', 'todo.db');
// Next's dev server reloads modules on every change; cache the connection
// on globalThis so we don't reopen the database each time.
const g = globalThis as unknown as { __db?: DatabaseSync };
export function getDb(): DatabaseSync {
if (!g.__db) {
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');
const schema = fs.readFileSync(
path.join(process.cwd(), 'db', 'schema.sql'),
'utf8',
);
db.exec(schema);
g.__db = db;
}
return g.__db;
}
done
Architected testing strategy for TypeScript module compatibility
Step 14. Create a temporary file tmp-check.ts in the todo-app folder (top level, next
to package.json ) with this:
ts
Save it, then run in the terminal:
That should print an array with one topic in it. Paste the output.
import { getDb } from './lib/db.ts';
const db = getDb();
db.prepare('INSERT OR IGNORE INTO topics (name) VALUES (?)').run('Test topic');
console.log(db.prepare('SELECT * FROM topics').all());
powershell
$env:DB_PATH="./tmp/check.db"
node tmp-check.ts
PS C:\Users\BenSwartz\Documents\todo-app>
$env:DB_PATH="./tmp/check.db"
>> node tmp-check.ts
(node:441928) [MODULE_TYPELESS_PACKAGE_JSON] Warning: Module
type of file:///C:/Users/BenSwartz/Documents/todo-app/tmp-check.ts is
not specified and it doesn't parse as CommonJS.
Reparsing as ES module because module syntax was detected. This
incurs a performance overhead.
To eliminate this warning, add "type": "module" to
C:\Users\BenSwartz\Documents\todo-app\package.json.
(Use node --trace-warnings ... to show where the warning was
created)
[ [Object: null prototype] { id: 1, name: 'Test topic' } ]
Deliberated cleanup strategy and environment variable reset procedures
Schema created, row inserted, read back. The database layer works. Both warnings are
cosmetic — the second one is just Node noting you ran a TypeScript file directly, and
you don't need to act on it (don't add "type": "module" to package.json; that can
upset Next's config files).
Step 15. Clean up the scratch file and clear that environment variable, so the dev server
doesn't keep writing to the test database:
powershell
Then commit:
Paste the output.
Remove-Item tmp-check.ts
Remove-Item -Recurse -Force tmp
$env:DB_PATH=""
 
powershell
git add -A
git commit -m "Add database connection module" -m "Schema is applied on first co
done,
how much more work today?
must i kepe some for tomorrow?
Strategized pacing work across multiple sessions deliberately
Yes — deliberately stop today. The commit-history criterion (18 marks) wants work
"visibly spread over more than one session," and that's judged on timestamps. You
physically cannot earn it by working harder today. Two commits today and more
tomorrow already satisfies it; three or four sessions across the week is comfortable.
You're two commits in and the foundation is done, which is a decent day given the
environment fight ate an hour. I'd suggest one more slice today, then stop:
Today, one more thing: create the GitHub repo and push. It's quick, gets your work
backed up, and the submission needs the link anyway. Then close the laptop.
Tomorrow: the query layer (create, edit, archive, sorted list reads) plus the first UI —
probably two or three commits.
Day after: remaining UI, overdue flagging, then tests.
Then: documentation, and a clean-clone rehearsal — clone your own repo into a fresh
folder and follow your own README literally. That last one is worth a whole session;
it's what walkthrough step 1 tests, and it's where most people lose four marks to
something small.
That leaves slack before 4 August.
One thing to do before you stop, while it's fresh: save today's chat as yourAI transcript.
The rubric wants evidence of you constraining and correcting output — the better-
sqlite3 dead end and the pivot to node:sqlite is exactly that, and so is you telling
me to slow down and go step by step. Don't reconstruct it later; just keep the log.
Want to do the GitHub push now, or leave it for tomorrow?
yes lets do github push now
Deliberated web UI approach for GitHub repository setup
Step 16. In a browser, go to github.com and sign in. Click the + in the top right → New
repository.
Name: todo-app
Private or public — either is fine, but if you make it private you'll need to add your
marker as a collaborator later. Public is simpler.
Do not tick "Add a README", "Add .gitignore", or "Choose a license". You already
have those locally, and ticking them creates a conflict on first push.
Click Create repository.
It'll then show you a page with setup commands. Don't run them yet — just tell me
when the repo exists, and paste the repo URL it shows you.
can't i just do it from vs code that's logged into github?
Yes, that works and it's fewer steps.
Step 16 (VS Code route). Open the todo-app folder in VS Code if it isn't already, then
open the Source Control panel — the branching icon in the left sidebar, or
Ctrl+Shift+G .
You should see a Publish Branch button (it may say "Publish to GitHub"). Click it. VS
Code will ask whether to publish as public or private, and what to name it — take
todo-app , and public is simpler unless you'd rather add the marker as a collaborator
later.
It creates the repo and pushes everything in one go.
Two things to check when it finishes: that it says something like "Successfully
published", and that the panel now shows a branch name with a sync icon rather than
"Publish".
Tell me how it goes — and if it asks you to authorise anything in a browser window,
that's expected.
it says successfully published?
Verified deployment status and planned browser testing
That's it done.
Step 17. Verify it landed properly. In your browser, go to github.com/<yourusername>/todo-app and check three things:
1. db/schema.sql is there — and the folder is lowercase db .
2. lib/db.ts is there.
3. There is no data folder and no .db file anywhere.
That third one is the one worth actually looking for. If your database file got pushed, a
marker's clean clone starts pre-loaded with your test data.
Also click the commit count near the top (it'll say something like "4 commits") and
confirm your two real commit messages are listed.
Tell me what you see, and that's a sensible place to stop for today.
what does this lab actually do lol
Weighed practical assignment goals against broader learning objectives
Two readings, both short.
The app: a personal todo list. Tasks with title, description, due date, topic; three
statuses; sort the list; archive instead of delete; overdue gets flagged. Runs on your own
machine, no accounts, no server. Genuinely small — you could build the features in an
afternoon.
The lab: which is why the features aren't the point. Look at where the marks are — 72 of
100 sit on documentation, commit history, schema design, tests, and AI transcripts.
Only 28 are "does it work." It's a software-engineering-practice lab wearing a todo app
as a costume.
And the specific things it's drilling are the ones that bite in real work:
Can someone else run your code from a clean clone? That's the README and the
whole first walkthrough step — the failure mode you and I have been dodging all
day.
Do you derive facts or duplicate them? The overdue rule is the whole lesson in
miniature. Store it as a column and it goes stale the moment midnight passes.
Is your history readable, or one commit called "final"?
Do your tests run anywhere, or only on your machine with your data?
Can you use an AI tool as a tool — reject bad output, redirect it — rather than paste
whatever it emits?
That last one you've already got a clean example of. better-sqlite3 was my
suggestion, it hit a wall your laptop couldn't get past, and we swapped it out. Write two
sentences about that in the transcript and it evidences the top rubric level better than
anything you could stage.
Stop here for today. The timestamps are doing work for you overnight.
there is no data file but there is a db file
Disambiguated database file formats and clarified project structure
Two different things with confusingly similar names — worth pinning down which
you're seeing.
db/ — a folder containing schema.sql . That one should be there. It's your
schema, it belongs in the repo.
todo.db — an actual database file, ending in .db . That one should not be there.
If what you're seeing is the db folder with schema.sql inside it, you're fine and
nothing needs doing.
To be certain, run this in the terminal:
No output means no database file is tracked, and you're clear. If it prints something,
paste it.
powershell
git ls-files | Select-String "\.db"
so i have to download our chat when i submit?
Yes — the transcripts are a listed submission item, and they're 8 marks.
The practical bit: don't leave it to 4 August. Chats get long, and this one has already
been through a whole environment saga. Grab it at the end of each session while it's
short and you remember what mattered.
Two things about how the marks work here. Level 0 is transcripts showing wholeproject generation with nothing but the brief pasted in. Level 2 needs constraints
stated up front, plus a clear instance of you spotting bad output and redirecting it —
and decisions in the transcript traceable to the shipped code.
You already have that second part twice over today, but it'd be easy to miss on a skim of
a long log. So when you submit, put a short markdown file alongside the raw transcript
— half a page, pointing at the moments:
better-sqlite3 was the suggested dependency; it failed to build because there's
no prebuilt binary for the installed Node and no admin rights to install a compiler.
Rejected it and moved to Node's built-in node:sqlite . Traceable to lib/db.ts
and the absence of that dependency in package.json .
Redirected the assistant when it was jumping ahead several steps at once.
Constraints you set: no admin rights, Windows, must run from a clean clone.
That file is what makes the marks findable rather than buried.
One more thing worth doing now while it's cheap: keep a running note of any point
where you disagree with something I suggest or change it. The schema is the obvious
candidate — I picked a separate topics table over a plain text column, and I flagged
that as arguable. If you end up thinking that's overkill for a single-user app and change
it, that's another clean example.
okay, so what must i do now?
i never gave constraints up front?
Reconciled constraint documentation and charted forward documentation strategy
You did, just not at the top — "company laptop, can't do administrator" is a constraint,
and so is "go step by step." Mid-conversation still counts as stated. But you can
strengthen it cheaply, because you have three more sessions ahead.
Now, two things, then stop:
1. Save this chat. Whatever export your interface offers, or select-all and paste into a
file. Call it ai-transcripts/session-1-setup.md inside the project. Don't edit it — the
raw log is the evidence.
2. Write yourself a constraints block to open every future session with. Save it
somewhere you can paste from:
Constraints for this project: Windows, company laptop with no administrator
rights, so nothing requiring an installer or compiler. Node 22.13+ using the builtin node:sqlite — no native modules. Next.js App Router, TypeScript. Localfirst, single user, no accounts. Must run from a clean clone following the
README alone. Work in small slices I can commit separately; one step at a time,
wait for my output before the next.
Paste that at the start of tomorrow's chat. Sessions two, three and four then all open
with constraints explicitly up front, which is precisely what the rubric asks for — and
it's honest, because those genuinely are your constraints.
That's the day. You've got a working database layer, three commits, a published repo,
and the timestamps working in your favour overnight.
    
how do i export this chat?
Thought for 3s
Weighed manual export options for workplace security constraints
Let me check the current options rather than guess at the UI.
There's no built-in "export this one chat" button. Claude lets you export your account
data, but there's no built-in option to export an individual conversation directly as a
PDF — the account export is a ZIP of JSON files emailed to you, which is overkill here
and awkward to read.
For a single chat, the manual route is fine and it's what I'd do on a company laptop — I'd
skip the browser extensions entirely, since they require read access to all your
conversations and you probably can't install them anyway.
Two options:
Markdown (better for submission): click into the conversation, Ctrl+A , Ctrl+C ,
then paste into a new file in VS Code and save it as ai-transcripts/session-1-
setup.md . It lands as plain text, keeps the code blocks readable, and lives in your repo
alongside the code it produced.
PDF: Ctrl+P in the browser, then choose "Save as PDF" as the destination.
Chrome Web Store
Markdown in the repo is the one I'd pick — it means the transcript is version-controlled
next to the commits it explains, and a marker can see both without opening a second
file.
One caution if you use the Share-link method some guides suggest: that creates a
publicly accessible link, so don't use it for anything you'd rather not have public.
Step 18. Make an ai-transcripts folder in todo-app , save this chat into it as
session-1-setup.md , then:
 
powershell
git add -A
git commit -m "Add AI transcript for session 1: environment setup and database l
git push
ctrl +a didnt do the whole chat?
Brainstormed practical workarounds for incomplete text selection
Long chats lazy-load — messages that haven't been scrolled into view aren't in the
page yet, so Ctrl+A only grabs what's rendered.
Fix: scroll all the way up to the very first message, slowly enough that everything loads,
then scroll back down to the bottom. Now Ctrl+A , Ctrl+C .
If it still misses chunks, use click-and-drag instead: click just before the first word of
your opening message, scroll to the bottom, then shift-click after the last word. That
selects everything between, including anything loaded on the way.
Failing that, Ctrl+P → Save as PDF tends to force the whole page to render, and you
can convert or just submit the PDF.
Worth checking the paste before you commit it: the very first thing should be your lab
brief, and the last should be this exchange. If the top is missing, you didn't scroll far
enough up.
    