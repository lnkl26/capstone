# Product Design

| Team | **JJaCL** |
| :---- | :---- |
| Team Members | Jesselle Ballesil, Jack Crawford, Chet Hefton, and Leann Kahal |

*Note: this is a **“living document”**, meaning its content will change with the implementation of the project. Use it to capture key project concepts and document your product design and decisions. Make sure the design is traceable to the requirements. Remove/replace the blue text and the descriptive paragraphs in each section prior to your submission as directed by your instructor.*

***REMOVE THE ITALICIZED TEXT BEFORE SUBMISSION.***

***THIS DOCUMENT IS A STARTING POINT, YOUR TEAM IS EXPECTED TO ADD/MODIFY ALL NECESSARY SECTIONS.***

*You may use any drawing tool for your UML diagrams. If you diagrams are too big to cut and paste into this document, provide a reference to the external image files(s) [JPG or PNG] where they can be found or segment your image into legible sections to make them fit.*

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

## Design Rationale

*This is a running list of issues that arise as your design process proceeds. This is an important section of the design document as it captures the thought process of the product's designers. It includes why or why not (rejected solutions) a design decision was made and supports future changes to the product. It should be updated whenever a design change occurs.***

*It is RARELY the case that the first design you consider is the best one that you can come up with that meets the requirements and that can be implemented, tested, and delivered on schedule. Your instructor will be looking for signs that you considered at least a few approaches, and that you had a coherent rationale for preferring the design your team eventually adopts.*

*This is the place to record such thoughts – what alternatives did you consider? What are the strengths (and deficiencies) of the final design compared to the other alternatives considered? Why did you select the approach you finally chose? This last question should be answered with an eye to the tradeoffs inevitably involved in creating an appropriate design.*

*In addition, if (not when) the design has to be adjusted to meet unexpected problems or new requirements, this is the place to record what changes were made, what effect these had on the work that had been completed to date, and the rationale for the making changes (as opposed to “just toughing it out”).*
