# Capstone Project: Assistive Task Web App

CSCE 4901 & CSCE 4902 Capstone Project Repository

## Team Members

* [Jesselle Ballesil](https://github.com/CjBallesil) - (Task & Routine Functionality)
* [Jack Crawford](https://github.com/jhc027) - (Reminder & Food Logging Functionality)
* [Chet Hefton](https://github.com/ChetHefton) - (Web Navigation, Food Logging Functionality, Backend Development)
* [Leann Kahal](https://github.com/lnkl26) - (Documentation, Task & Routine Functionality)

## Project Status

### In Progress

* AUG 26 2025 | Deciding on our project
* SEP 03 2025 | Project decided: [Assistive Task Web App](https://github.com/lnkl26/capstone/blob/main/Sprint%200%20Documentation/CONFIRMEDPROJECT.md)
* SEP 12 2025 | Written [Product Requirements Document](https://github.com/lnkl26/capstone/blob/main/Sprint%200%20Documentation/JJaCL_Requirements.md)

## How to Run

Locally in the directory

```text
start index.html
```

## Current Bugs

* DATE FOUND-DATE SOLVED | "(bug description) happens when (action that lead to bugs)"

| Bug Description | Replication Steps | Date Found | Date Solved |
| --- | --- | --- | --- |
| settings.html:37 WebSocket connection to 'ws://127.0.0.1:5500/htmlPages/settings.html/ws' failed: | Will repaire next chance I get! | 10/09/2025 | mm/dd/yy |
| Create tasks fields disappearing after task created | Create task -> save task -> open up create task pop-up again -> task fields not shown -> refresh the screen and it will reappear | 10/10/2025 | 10/10/2025 |
| Running the site via GitHub Pages doesn't show the modal popups, but running locally is fine | For comparison, run locally by "start index.html" and navigate to create tasks, then run via GitHub Pages by going to the link lnkl26.github.io/capstone/ | 10/10/2025 | 10/10/2025 |
| Visual bug when creating a sub-task | Navigate to task creation and add a sub task. | 10/12/2025 | mm/dd/yy |
| Sub-tasks cannot be edited or deleted when editing a task. | - | 10/14/2025 | mm/dd/yy |
| Clicking outside of the window to cancel does not reset form | Navigate to task creation and fill in input >> Click outside of popup window to close. >> Open create task again. | 10/14/2025 | 10/14/2025 |

## Notes

10/09/2025 Chet H - In a live hosted / dev environment, service worker fetters CSS, so if the styling looks off while live hosting, re-save your style.css file and it will show what the user would see upon landing.

10/10/2025 | Leann Kahal | GitHub Pages is rather slow to update (compared to running the site locally), so do expect some changes to not fully appear on the "live" site for a bit. This could range from instantantenously to an hour or two.

10/12/2025 | Leann Kahal | Bug #4 is only a visual bug, functionalities works just as intended, therefore this is a low priority fix for now.

10/13/2025 | Jesselle Ballesil | Currently editing a task links to same modal as creating one, so while functionality is fine it still says "Create a new task" in the popup. Will need to eventually create a new modal for editing tasks.

10/14/2025 | Jesselle Ballesil | On iOS, fonts for buttons are colored blue instead of black.

10/14/2025 | Jesselle Ballesil | Resolved bug by making sure closing modal calls resetTaskForm(). May need to review code for redundancies, but the bug is resolved.
