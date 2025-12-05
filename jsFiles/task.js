import {
  db, collection, addDoc, deleteDoc, doc, updateDoc, 
  onSnapshot, query, orderBy, serverTimestamp, 
} from "../firebase.js";

import { userReady, currentUser } from "../firebase.js";

window.addEventListener("load", async () => {
  await userReady;
  console.log("Final UID on load:", currentUser.uid);
});


// GLOBAL VARIABLES
let tasks = [];
let currentSubTask = [];
let editingTaskIndex = null;
let editingSubTaskIndex = null;
const tasksCollection = collection(db, "tasks");

// TASK MANAGER 
const taskModal = document.getElementById('taskModal');
const openTaskBtn = document.getElementById('taskCreate-btn'); // rename this later
const closeTaskBtn = document.getElementById('cancelTask');

document.addEventListener('DOMContentLoaded', () => {
    onSnapshot(query(tasksCollection, orderBy("createdAt", "desc")), (snapshot) => {
        tasks = snapshot.docs.map(doc => ({
            id: doc.id,
            ... doc.data()
        }));
        renderTaskList();
        renderCurrentTasks(tasks);
    });
});

openTaskBtn.addEventListener('click', () => {
    taskNameInput.value = '';
    taskDescInput.value = '';
    currentSubTask = [];
    renderSubTasks(currentSubTask, subTaskList);

    editingTaskIndex = null;
    taskModal.querySelector('h2').textContent = 'Create New Task';
    saveTaskBtn.textContent = 'Save';
    taskModal.classList.add('active');
});

closeTaskBtn.addEventListener('click', () => {
    taskModal.classList.remove('active');
})

const saveTaskBtn = document.getElementById('saveTask');
const taskNameInput = document.getElementById('taskInput-name');
const taskDescInput = document.getElementById('taskInput-desc');
const subTaskInput = document.getElementById('subtaskInput');
const addSubTaskBtn = document.getElementById('addSubtask');
const subTaskList = document.getElementById('subtaskList');

const taskListModal = document.getElementById('taskListModal');
const openTaskListBtn = document.getElementById('taskListView'); // rename this later
const closeTaskListBtn = document.getElementById('closeTaskList');
const taskListEl = document.getElementById('taskList');

saveTaskBtn.addEventListener('click', async () => {
    const name = taskNameInput.value.trim();
    const description = taskDescInput.value.trim();

    if(!name) {
        alert('Please enter a task name!');
        return;
    }

    const newTask = {
        name,
        description,
        subtask: [ ... currentSubTask],
        createdAt: serverTimestamp(),
        completed: editingTaskIndex !== null ? tasks[editingTaskIndex].completed : false
    };

    try {
        if(editingTaskIndex !== null) {
            const taskId = tasks[editingTaskIndex].id;
            console.log("Editing task ID:", taskId);
            const taskRef = doc(db, "tasks", taskId);
            await updateDoc(taskRef, newTask);
            editingTaskIndex = null;
        } else {
            await addDoc(tasksCollection, newTask);
        }
        alert('Task saved successfully!');
    } catch (error) {
        console.error("Error saving task: ", error);
        alert("Failed to save task.");
    }

    taskNameInput.value = '';
    taskDescInput.value = '';
    subTaskList.innerHTML = '';
    currentSubTask = [];

    taskModal.classList.remove('active');
    renderTaskList();
});

addSubTaskBtn.addEventListener('click', () => {
    const subtaskName = subTaskInput.value.trim();
    if(subtaskName) {
        currentSubTask.push({ name: subtaskName, completed: false });
        renderSubTasks(currentSubTask, subTaskList);
        subTaskInput.value = '';
    }
});

//only wire these up if the View button still exists
if (openTaskListBtn) {
    openTaskListBtn.addEventListener('click', () => {
        renderTaskList();
        taskListModal.classList.add('active');
    });
}

if (closeTaskListBtn) {
    closeTaskListBtn.addEventListener('click', () => {
        taskListModal.classList.remove('active');
    });
}

// DELETE TASK FROM TASK LIST VIEW
// COMPLETE TASK FROM TASK LIST VIEW
function renderTaskList() {
    taskListEl.innerHTML = '';
    
    if(tasks.length === 0) {
        taskListEl.innerHTML = '<li>You have no tasks yet!</li>';
        return;
    }

    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.classList.toggle('completed', task.completed);

        const taskCheckbox = document.createElement('input');
        taskCheckbox.type = 'checkbox';
        taskCheckbox.checked = task.completed;

        taskCheckbox.addEventListener('change', () => {
            task.completed = taskCheckbox.checked;
            task.subtask.forEach(st => st.completed = task.completed);
            renderTaskList();
        });

        const taskLabel = document.createElement('span');
        taskLabel.innerHTML = `<strong>${task.name}</strong> ${task.description ? `<p>${task.description}</p>` : ''}`;

        li.appendChild(taskCheckbox);
        li.appendChild(taskLabel);

        if(task.subtask.length) {
            const ul = document.createElement('ul');
            renderSubTasks(task.subtask, ul, index);
            li.appendChild(ul);
        }

        const actions = document.createElement('div');
        actions.className = 'task-actions';
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.className = 'edit-btn';

        editBtn.addEventListener('click', () => {
            taskNameInput.value = task.name;
            taskDescInput.value = task.description;
            currentSubTask = task.subtask.map(st => ({ name: st.name, completed: st.completed }));

            renderSubTasks(currentSubTask, subTaskList);

            taskListModal.classList.remove('active');
            editingTaskIndex = index;
            taskModal.querySelector('h2').textContent = 'Edit Task';
            saveTaskBtn.textContent = 'Save Changes';
            taskModal.classList.add('active');
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', async () => {
            if (confirm('Delete "${task.name}"?')) {
                try {
                    const taskId = task.id; //firebase id
                    await deleteDoc(doc(db, "tasks", taskId));
                } catch (error) {
                    console.error("Error deleting task: ", error);
                    alert("Failed to delete task.");
                }
            }
        });

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
        li.appendChild(actions);

        taskListEl.appendChild(li);
    });

}

function renderSubTasks(subtasks, container, taskIndex = null) {
    container.innerHTML = '';

    subtasks.forEach((st, i) => {
        const li = document.createElement('li');

        li.classList.toggle('completed', st.completed);

        // Checkbox for the subtask
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = st.completed;

        checkbox.addEventListener('change', () => {
            st.completed = checkbox.checked;
            li.classList.toggle('completed', st.completed);

            if (taskIndex !== null) {
                const allDone = subtasks.every(s => s.completed);
                tasks[taskIndex].completed = allDone;
                renderTaskList();
            }
        });

        //edit subtask
        const span = document.createElement('span');
        span.textContent = st.name;
        span.style.cursor = 'pointer';

        span.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'text';
            input.value = st.name;
            input.style.marginRight = '8px';

            //replace span with input
            li.replaceChild(input, span);
            input.focus();

            //save on blur or enter key
            const saveEdit = () => {
                const newName = input.value.trim();
                if (newName) {
                    st.name = newName;
                    renderSubTasks(subtasks, container, taskIndex);
                    if (taskIndex !== null) renderTaskList();
                } else {
                    alert('Subtask name cannot be empty.');
                    input.focus();
                }
            };

            input.addEventListener('blur', saveEdit);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') saveEdit();
            });
        });

        const removeBtn = document.createElement('button');
        removeBtn.textContent = '×';
        removeBtn.style.marginLeft = '8px';
        removeBtn.addEventListener('click', () => {
            subtasks.splice(i, 1);

            if (taskIndex !== null) {
                const allDone = subtasks.every(s => s.completed);
                tasks[taskIndex].completed = allDone;
            }

            renderSubTasks(subtasks, container, taskIndex);
            if (taskIndex !== null) renderTaskList();
        });

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(removeBtn);

        container.appendChild(li);
    });
}

//small html escape helper for summary boxes
function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderCurrentTasks(summaryTasks) {
  const box = document.getElementById("currentTasks");
  if (!box) return;

  if (!summaryTasks || !summaryTasks.length) {
    box.innerHTML = '<div class="empty">No tasks yet.</div>';
    return;
  }

  box.innerHTML = summaryTasks.map(t => `
    <div class="summary-item${t.completed ? " completed" : ""}">
      <strong>${escapeHtml(t.name || "")}</strong>
      ${t.description
        ? `<div class="summary-sub">${escapeHtml(t.description)}</div>`
        : ""}
    </div>
  `).join("");
}

//fills the Curr Routines box
//routine objects expected like { name, tasks: [...] }
function renderCurrentRoutines(routines) {
  const box = document.getElementById("currentRoutines");
  if (!box) return;

  if (!routines || !routines.length) {
    box.innerHTML = '<div class="empty">No routines yet.</div>';
    return;
  }

  box.innerHTML = routines.map(r => `
    <div class="summary-item">
      <strong>${escapeHtml(r.name || "")}</strong>
      ${
        Array.isArray(r.tasks) && r.tasks.length
          ? `<div class="summary-sub">${r.tasks.length} step${r.tasks.length > 1 ? "s" : ""}</div>`
          : ""
      }
    </div>
  `).join("");
}

//keep Curr Tasks in sync with firestore snapshot as well
document.addEventListener('DOMContentLoaded', () => {
  onSnapshot(query(tasksCollection, orderBy("createdAt", "desc")), (snapshot) => {
    const summaryTasks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    renderCurrentTasks(summaryTasks);
  });
});

//expose summary renderers so routine.js can call renderCurrentRoutines()
window.renderCurrentTasks = renderCurrentTasks;
window.renderCurrentRoutines = renderCurrentRoutines;
