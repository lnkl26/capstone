import {
  db, addDoc, deleteDoc, doc, updateDoc,
  onSnapshot, query, orderBy, serverTimestamp,
  userReady, currentUser, userCollection
} from "../firebase.js";

console.log("task.js loaded");

let tasks = [];
let currentSubTask = [];
let editingTaskIndex = null;
let tasksCollection = null;

window.addEventListener("DOMContentLoaded", async () => {
  await userReady;
  console.log("User ready in task.js:", currentUser?.uid);
  tasksCollection = userCollection("tasks");
  startTaskSnapshotListener();
  wireEventListeners();
});

const taskModal = document.getElementById('taskModal');
const openTaskBtn = document.getElementById('taskCreate-btn');
const closeTaskBtn = document.getElementById('cancelTask');

const saveTaskBtn = document.getElementById('saveTask');
const taskNameInput = document.getElementById('taskInput-name');
const taskDescInput = document.getElementById('taskInput-desc');
const subTaskInput = document.getElementById('subtaskInput');
const addSubTaskBtn = document.getElementById('addSubtask');
const subTaskList = document.getElementById('subtaskList');

const taskListModal = document.getElementById('taskListModal');
const openTaskListBtn = document.getElementById('taskListView');
const closeTaskListBtn = document.getElementById('closeTaskList');
const taskListEl = document.getElementById('taskList');

function wireEventListeners() {
  const taskModal = document.getElementById('taskModal');
  const openTaskBtn = document.getElementById('taskCreate-btn');
  const closeTaskBtn = document.getElementById('cancelTask');

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
  });

  saveTaskBtn.addEventListener('click', saveTask);
  addSubTaskBtn.addEventListener('click', addSubtask);
}

function startTaskSnapshotListener() {
  if (!tasksCollection) return;

  onSnapshot(
    query(tasksCollection, orderBy("createdAt", "desc")),
    (snapshot) => {
      tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderTaskList();
      renderCurrentTasks(tasks);
    }
  );
}

function saveTask() {
  const name = taskNameInput.value.trim();
  const description = taskDescInput.value.trim();

  if (!name) {
    alert("Please enter a task name!");
    return;
  }

  const newTask = {
    name,
    description,
    subtask: [...currentSubTask],
    createdAt: serverTimestamp(),
    completed: editingTaskIndex !== null ? tasks[editingTaskIndex].completed : false
  };

  if (editingTaskIndex !== null) {
    const taskId = tasks[editingTaskIndex].id;
    const taskRef = doc(tasksCollection, taskId);
    updateDoc(taskRef, newTask).then(() => {
      editingTaskIndex = null;
      resetTaskModal();
    });
  } else {
    addDoc(tasksCollection, newTask).then(() => {
      resetTaskModal();
    });
  }
}

function resetTaskModal() {
  taskNameInput.value = "";
  taskDescInput.value = "";
  subTaskList.innerHTML = "";
  currentSubTask = [];
  taskModal.classList.remove("active");
}

function addSubtask() {
  const subtaskName = subTaskInput.value.trim();
  if (!subtaskName) return;
  currentSubTask.push({ name: subtaskName, completed: false });
  renderSubTasks(currentSubTask, subTaskList);
  subTaskInput.value = "";
}

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

function renderTaskList() {
  taskListEl.innerHTML = '';

  if (tasks.length === 0) {
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

    if (task.subtask.length) {
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
      if (confirm(`Delete "${task.name}"?`)) {
        const taskRef = doc(tasksCollection, task.id);
        await deleteDoc(taskRef);
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

    const span = document.createElement('span');
    span.textContent = st.name;
    span.style.cursor = 'pointer';

    span.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = st.name;
      li.replaceChild(input, span);
      input.focus();

      const saveEdit = () => {
        const newName = input.value.trim();
        if (newName) {
          st.name = newName;
          renderSubTasks(subtasks, container, taskIndex);
          if (taskIndex !== null) renderTaskList();
        } else {
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
      ${t.description ? `<div class="summary-sub">${escapeHtml(t.description)}</div>` : ""}
    </div>
  `).join("");
}

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
      ${Array.isArray(r.tasks) && r.tasks.length
        ? `<div class="summary-sub">${r.tasks.length} step${r.tasks.length > 1 ? "s" : ""}</div>`
        : ""}
    </div>
  `).join("");
}

window.renderCurrentTasks = renderCurrentTasks;
window.renderCurrentRoutines = renderCurrentRoutines;