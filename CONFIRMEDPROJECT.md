# **TEAM: JJaCL**

## Project I-22: Assistive Task App

Sponsor: Dr. Stephanie Ludi

### **Project Overview**

For this app, you need to pitch an app that you assert will help persons with disabilities in some way (though people without disabilities can also use it). It may be for people generally or for a subgroup (e.g. Deaf/Hard of hearing community, Autism community) to be used for certain activities or scenarios. You will need to do some research on what will be useful that is not already on the market or is an improvement of what is on the market.

#### **JJaCL Further Features Suggestions/Ideas**

_These are suggestions adding on to the given Project Overview._

* Task-Oriented
  * Focus mode: visual/auditory countdown timer for task durations (pomodoro-style)
  * Task Break Down: assistant to help break down tasks into smaller and more digestible ones → useful for individuals with task paralysis
  * Routines: users can create their own routines with tasks and durations or select from pre-made ones
* Accessibility Customization
  * High contrast and/or color blindness mode
  * Read aloud mode and/or voice command compatibility → narrate screen page, depending on key stroke (or mobile touch) it will determine what to say next or switch pages (something similar to an automated call system)
  * Text size & font options → useful for individuals who may have dyslexia
* Miscellaneous
  * Mood tracker: user can log how certain tasks/routines make them feel, helping in identifying those that causes stress or satisfaction

#### **JJaCL’s Motivation**

* **Problem:** Many popular task management apps don’t really have users with disabilities in mind. We aim to provide an adaptive task management experience by providing useful accessibility features.

---

## POSSIBLE SPRINT OUTLINE

### SPRINT 1

#### **User Research**

* Identify target users (e.g., ADHD, Autism, Dyslexia, etc.)
* Survey/Interview to understand needs and challenges
* Conduct analysis of existing apps (e.g., Routinery)

#### **Prioritized Features**

* Task Create/Edit/Delete
* Routine Create/Edit/Delete
* Pomodoro-style focus timer (w/visual & auditory cues)

#### **Design & Architecture**

_Possible Tech Stack:_

* HTML/CSS, React.js, [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API), localStorage, [Service Worker and manifest.json](https://www.digitalocean.com/community/tutorials/js-intro-progressive-web-apps)
* Static App Hosting --> Use GitHub Pages

#### **Miscellaneous**

* Collect user feedback

## SPRINT 2

### Prioritized Features

* Any that weren't implemented in previous sprint(s)
* High-Contrast & Color-Blind Modes
* Text size and Dyslexia-friendly font toggle
* Screen read-aloud compatibility or voice navigation
* Task Breakdown Assistant (app/system suggests sub tasks based on the given task)
* Mood tracker tied to tasks/routines
* Preset Routines (e.g., template the user can choose from such as "Study")

### Enhancements

* Better Visuals (icons, progress bars, etc.) for users with cognitive disabilities
* User settings page for accessibility customization

## SPRINT 3

### Polish

* Improve responsiveness for different screen sizes
