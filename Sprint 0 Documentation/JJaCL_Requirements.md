**Product Requirements**

*Assistive Task App \- ADHD/Autism-Friendly Focus & Food App*

| Team | JJaCL |
| :---- | :---- |

# **Team Members:** Jesselle Ballesil, Jack Crawford, Chet Hefton, and Leann Kahal

# **Brief problem statement** 

This should be 1-2 paragraphs describing what the motivation is for the project.  What is the problem to be solved?

Neurodivergent individuals, specifically those with ADHD or are Autistic, may struggle with executive functioning, task management, and maintaining consistent eating habits. This project aims to create an all-in-one task management and food tracking system designed for neurodivergent users in mind. Most apps geared towards these individuals often have features that are paywalled or follow a subscription-based model, we would like to avoid this and prioritize accessibility instead. 

# **System Requirements**

What system configuration needs to run your proposed system (including anything third party that is needed to run your system).

A modern web browser that supports HTML5, CSS3, and JavaScript ES6+ are needed for the system to run. Possible browsers are Google Chrome, Mozilla Firefox, Microsoft Edge, and Safari. Note, these browsers need to be running the latest version of themselves. This is to ensure that the browsers are able to support IndexedDB and localStorage, which is what we will be using for data storage. Browsers also need to support Service Workers (for offline support and caching) and Web Manifest (for progressive web app development) in order for the system to work as intended. Any device that can run these browsers should be able to run our web app.

The web application will be initially hosted using GitHub Pages. For the initial download, users will need internet connection. Login is not required to use the web app itself. In the future, we will expand our downloading options to other web hosting services that do not require users to create an account. 

We expect to use third-party dependencies such as React.js and Node.js for frontend framework and app deployment, respectively. Other possible software that need to work in tandem with our web app are screen readers available on the user’s OS and devices that should have microphone access (for voice command support).

# **Users Profile**

Who is the system intended for? What characteristics should the users have (this can also be a range of things such as reading level, etc.).

The system is intended for neurodivergent individuals, specifically for those who are Autistic, have ADHD, or experience executive dysfunction. The app is designed to support users who may struggle with planning, organizing, or maintaining consistency in their routines. There are also food-related features for people with sensory sensitivities, dietary needs, or restrictive eating habits, which are common in neurodivergent individuals.

Possible User Characteristics:

* Difficulty with executive functioning  
* Need for structure, routine, and visual clarity  
* Desire for non-judgemental, supportive systems that encourage autonomy  
* May include children, teens, and adults, with or without form diagnosis

We aim to keep the text at an 8th grade reading level, ensuring comprehension across a wider range of cognitive abilities. Those who are less tech-savvy will have an onboarding walkthrough, while tech-savvy individuals can skip the onboarding. 

# **List of Features**

# Provide a numbered list of features (F1, F2, etc.) that concisely, clearly, and accurately describe that which constitutes your project.

| No. | Feature Name | Description |
| :---- | :---- | :---- |
| F1 | Task Creation | Baseline, users are able to create and check-off tasks  |
| F2 | Routine Creation (& Routine Templates) | Routines are a group of tasks that appear consistently throughout the user’s life.  |
| F3 | Focus Mode | Inspired by the pomodoro-timer, which is often used for studying and completing tasks. The app will become a visual/auditory countdown timer with a tasklist on the side. |
| F4 | Assist Task Breakdown | Provides suggestions and/or prompts to help users break complex tasks into smaller, manageable steps. |
| F5 | Shared Tasks  | Add people/group members to a shared task list, creating your own tasks and checking it off. |
| F6 | Diet Tracker (w/Safe Food Tagging) | Track daily food intake with an option to tag “safe foods” for easy lookback. |
| F7  | Medication Reminders | Set up recurring alerts to take medication on time. |
| F8 | Exportable Food Logging | Allows users to export their food tracking data as a CSV file, useful for personal review or sharing with healthcare providers. |

# **Functional Requirements (user stories)**

List the Priority as 1 (High Priority \- Critical) to 3 (Low Priority – Would be nice if we have time)

| No. | Feature Name | Description | Priority |
| :---- | :---- | :---- | :---: |
| R1     | Task Creation | As a user, I want to create tasks and mark them as complete, so it is easier to keep track of what I need to do and feel a sense of progress | 1 |
| R2       | Routine Creation | As a user, I want to group tasks into routines that reoccur, so I can manage responsibilities efficiently | 1 |
| R3        | Focus Mode | As a user, I want a “Focus Mode” with a countdown timer with visible task, so I can stay productive and on-task using a Pomodoro system | 1 |
| R4        | Assist Task Breakdown | As a user, I want the app to suggest how to break larger tasks into smaller steps | 2 |
| R5   | Diet Tracker (w/Safe Food Tagging) | As a user with sensory issues around food, I want to track what I eat and mark “safe foods” so I can plan meals efficiently | 2 |
| R6 | Medication Reminders | As someone who often forgets my medication, I want a scheduled reminder so I can be consistent and avoid side effects from missed doses | 2 |
| R7 | Shared Task | As a student working on a group project, I want to assign and track shared tasks with my team so we can stay on the same without confusion | 3 |
| R8 | Exportable Food Logging | As someone managing my diet with a nutritionist, I want to export my food logs so I can share accurate information without rewriting everything | 3 |

# 

# **Non-Functional Requirements**

*Describe any constraints or cross-cutting characteristics of the system in a manner that is clear, specific, and testable.  Each requirement should have a unique identifier (e.g. NF1, NF2,..).  Only present those which are applicable to your system.  Categories include but are not limited to:*

Security

Reliability

Usability

Cross-Platform Compatibility

Accuracy

| No. | Category | Description |
| :---- | :---- | :---- |
| NF1 | Usability | The system will have an intuitive and minimalistic UI, so that at least 80%  of new users will be able to create a task within 2 minutes of opening the app (based on usability testing). |
| NF2 | Accessibility | The system will support accessibility features including screen reader compatibility, voice commands, and color-blind-friendly themes, therefore complying with WCAG 2.1 Level AA standards. |
| NF3 | Reliability | The system will support offline mode, so users are able to access features and their information when internet connection is unavailable. |
| NF4 | Performance | The app will function consistently on modern web browsers, Chrome v120+, Microsoft Edge v120+, Safari v18+, and Firefox v115+. |
| NF5 | Data Privacy | The system will not share or sell user data to third parties, therefore complying with GDPR and CCPA regulations. |
| NF6 | Accuracy | Focus timer and scheduling component will operate with no more than 1 second deviation, given a 25 minute cycle. |

Sponsor Requirements

I have read and approved the material in this document.  If there is no external sponsor, the TA or instructor will sign it for accuracy/scope.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_	\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_	\_\_\_\_\_\_\_\_\_

Print Name				Signature					Date

