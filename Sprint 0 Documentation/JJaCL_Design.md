# Product Design

| Team | **JJaCL** |
| :---- | :---- |
| Team Members | Jesselle Ballesil, Jack Crawford, Chet Hefton, and Leann Kahal |

| Revision Number | Revision Date | Summary of Changes | Author(s) |
| ----- | ----- | ----- | ----- |
| 0.1 | 09/25/2025 | Initial creation of UML class diagram | Leann Kahal |
| 0.1 | 09/25/2025 | Initial creation of Information Architecture diagram | Leann Kahal |
| 0.1 | 09/27/2025 | Initial creation of Entity Relationship diagram | Leann Kahal |
| 0.2 | 09/27/2025 | Reformated and Added CRUD functions to the UML class diagram | Leann Kahal |
| 0.2 | 09/27/2025 | Reformated and added Services to the IA diagram | Leann Kahal |
| 0.1 | 09/27/2025 | Initial creation of UI Wireframes | Leann Kahal |

***The Revision Table above must be augmented after any version of this document is updated. Insert any necessary rows at the bottom of the table.***

## Class Diagram(s)

![UML Class Diagram](https://github.com/lnkl26/capstone/blob/main/Sprint%200%20Documentation/UML%20Class%20Diagram/uml_class_diagram.png)

## ER Diagram(s)

![Entity Relationship Diagram](https://github.com/lnkl26/capstone/blob/main/Sprint%200%20Documentation/Entity%20Relationsip%20Diagram/ER_diagram.png)

## Information Architecture Diagram

![Information Architecture Diagram](https://github.com/lnkl26/capstone/blob/main/Sprint%200%20Documentation/Information%20Architecture%20Diagram/IA_diagram.png)

## User Interface Wireframe(s)/Screenshot(s)

![Home Screen / Dashboard UI](https://github.com/lnkl26/capstone/blob/main/Sprint%200%20Documentation/UI%20Wireframes/SCR-HOME.png)

![User Profile UI](https://github.com/lnkl26/capstone/blob/main/Sprint%200%20Documentation/UI%20Wireframes/SCR-USER.png)

![Productivity Tile UI](https://github.com/lnkl26/capstone/blob/main/Sprint%200%20Documentation/UI%20Wireframes/SCR-PRODUCTIVITY.png)

![Food / Medication Tile UI](https://github.com/lnkl26/capstone/blob/main/Sprint%200%20Documentation/UI%20Wireframes/SCR-FOODMED.png)

![Settings Tile UI](https://github.com/lnkl26/capstone/blob/main/Sprint%200%20Documentation/UI%20Wireframes/SCR-SETTINGS.png)

## Design Summary

JJaCL's Assistive Task Web App is a modular productivity and wellness application that is meant to help users manage their tasks, create routines, and track medication. 

### UML Class Design
* There is a separation between core domain models (e.g., Task, Routine, MedicationReminder) and service classes (e.g., TaskService, RoutineService, ReminderService) that handles Create, Read, Update, and Delete (CRUD) operations.

* The User class does not directly interact with the domain models, but instead interacts with the services and tools, which is ideal for scalability.

* Tasks and routines are extended via RepeatRule for modularity, and AssistTaskBreakdown is an assistive feature offers further enhancements.

### Entity Relationship Design

Key relationships include:
* User to Task, Routine, FocusMode, DietTracker, and MedicationReminder.

* Many-to-Many relationships for shared task lists using associative entities.

* RepeatRule is reusable for both Task and MedicationReminder.

* FoodLogExport allows users to export their food log history.

### Information Architecture Design

The main goal here is to have a simple navigation hierarchy, where:
* Home / Dashboard is the central hub for navigation.

* Productivity Management allows users to access their tasks, routines, and focus mode.

* Food / Med Management allows users to access diet and medication tracking tools.

* Settings allows users to modify or update their system preferences for the web app. 

### User Interface Design

We are aimining for minimalistic and non-cluttered UI using tile layouts. Where nxm, n being rows, and m being columns.

* The Home screen uses a 2x2 tile format: 
    * User Profile
    * Productivity
    * Food / Medication
    * Settings

* The Productivity screen uses 3x1 tile format:
    * "Your Tasks" for task managment
    * "Your Routine" for routine managment
    * "Focus Mode" for the built in Pomodoro Timer

* The Food/Med screen uses 2x1 tile format:
    * "Your Diet" for food logging
    * "Your Medication" for medication tracking

* Overall Visual Design
    * Clean whitespace
    * Home screen tiles/buttons are unique from each other, in addition to unique icons and accurate labelling
    * All screens will have a "?" button for users to click-on if they do not understand the use of the current screen they're on
    * Screens besides the Home screen will have a \[back arrow] button, so users can access the previous screen again.

## Design Rationale

### Navigation and UI Structure

We (JJaCL) explored over a dozen different types of sidebar and navigations styles commonly used for web applications. One of the first few designs we noticed was text-only navigation menus. While functional, we noted that this style was rather uninspiring and lacked the visual appeal we were aiming for. We concluded that this type of navigation would come off as disengaging for our user base.

Another common design we noticed was combining both icons and text labels for navigation. This was promising, however most of the examples we were revieweing used rather small icons. We believed this was not useful as it would recude their clarity and impact for first-time users.

After reviewing other various formats, we decided on a tile-based layout for the home screen. We believe this would feel cleaner, and be visually engaging for users. But, many references we were looking at used borderless tiles, which we believed would make the UI looked too flat and lead to frequent misclicks. So, in our final layout, we wanted clearly spaced and bordered tiles to improve usability and visual clarity.

### Shape-Based Visual Cues

To reinforce hierarchy and functionality, we decided using distinct tiles shapes would be most useful.

* Rounded squares for primary managemnt sections (e.g., Task Management, and Food/Med Management).

* Circle for user profile access

* Octagon for system settings to signify its importance 

### Icons and Labels

We are prioritizing large and clear icons for visual clarity and accessibility, but we will still include text labels beneath or beside each icon. This is to avoid ambigious buttons.

Additionally, many designs we reviewed lack in-screen help features or a clear back button, so we decided to include them in our UI.

* A Help button/tool for each major screen, allowing users to easily understand where they and what they can do.

* A Back button on all secondary and details screens, ensuring simple navigation

### Trade-Offs

Although, we stated that we wanted to prioritize minimalistic UI, we still wanted to provide visual engagement, so we discarded the text-only navigation idea.