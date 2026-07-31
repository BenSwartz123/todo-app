New Day
lets go

PS C:\Users\BenSwartz> Test-Path C:\Users\BenSwartz\Desktop\clean-test\data
True


Orchestrated sequential walkthrough checklist for remaining tasks
Orchestrated sequential walkthrough checklist for remaining tasks
Database created automatically on first run — so the README's claim that a clean clone needs no migration step is true.

Step 56. Now walk the brief's seven steps in order, in the browser at http://localhost:3000. Work through these and tell me if any misbehave:

Installs and starts from the README alone — already passed.
Create a task with all four fields. Add one with title, description, due date and topic filled in. Confirm it appears.
Edit it, and the change survives a reload. Click Edit, change the title and the topic, save, then press F5 and confirm both changes held.
Archive it. Add a second task first so the list isn't empty, then archive one. It should leave the active list and appear under Archived, still readable.
Sort by topic, status and due date. You'll need three or four tasks with different topics, statuses and dates for this to show anything. Click each sort link.
Overdue flagging. Add a task dated in the past — it should show the red badge. Then check the status dropdown offers only Todo, In-Progress, Complete, with no "Overdue" option.
Restart and persist. Ctrl+C in the server terminal, then npm run dev again, reload the page, confirm everything is still there including the archived task.
Take your time on step 7 — it's the one people skip.

all works

That's all seven passing from a clean clone, in a fresh environment, following only the README. The 28 marks are as protected as they can be before submission day.

Step 57. Clean up the rehearsal copy so it can't be mistaken for your real project later. Stop the server with Ctrl+C, then in a terminal that is not inside clean-test:

powershell
cd $HOME
Remove-Item -Recurse -Force $HOME\Desktop\clean-test
Then confirm it's gone:

powershell
Test-Path $HOME\Desktop\clean-test
Should print False. Paste that.

Then we've got one thing left today: the AI declaration document, which is the last of the 8 marks.

PS C:\Users\BenSwartz> cd $HOME
PS C:\Users\BenSwartz> Remove-Item -Recurse -Force $HOME\Desktop\clean-test
PS C:\Users\BenSwartz> Test-Path $HOME\Desktop\clean-test
False
PS C:\Users\BenSwartz>


Orchestrated honest declaration draft from session corrections
Orchestrated honest declaration draft from session corrections
Last piece. One caution before I draft it: this document is a declaration with your name on it, and it should describe what actually happened. I'll mark which points are unambiguously yours and which are more collaborative — cut anything you don't recognise as your own.


Created a file, read a file
Created a file, read a file
Read it before you commit it, and be honest with yourself about each item. My assessment of which are strongest:

Unambiguously yours: #2, the redirect on working method — that was you, in your own words, and it visibly changed how the rest of the project ran. And #7, verifying the build claim, since you ran it.

Collaborative, and I'd frame them as such: #1 and #5 and #6. You surfaced the failures by running things and pasting output; I proposed the fixes. That's still legitimate — the rubric wants the author identifying unsuitable output, and a dependency that can't install on your machine is unsuitable output — but don't let the document imply you diagnosed the EPERM cause yourself if you didn't.

Weakest: #3 and #4. You ran npx tsc --noEmit because I told you to. If you'd rather not claim those, cut them — you have enough without them.

The rubric asks for at least one clear instance. #2 alone satisfies it, and #1 is strong because it's traceable to an absence in package.json, which is unusual and checkable.

Step 58. Save the file as AI-USAGE.md in your project root, save today's chat as ai-transcripts/session-4-docs.md, then:

powershell
git add -A
git commit -m "Add AI usage declaration and session 4 transcript"
git push

Ai usage
Document · MD 





Claude is AI and can make mistakes. Please double-check responses.