// GLOBAL VARIABLES
let tasks = [];
let currentSubTask = [];
let editingTaskIndex = null;
let editingSubTaskIndex = null;

// TASK MANAGER 
const taskModal = document.getElementById('taskModal');
const openTaskBtn = document.getElementById('taskCreate-btn'); // rename this later
const closeTaskBtn = document.getElementById('cancelTask');

openTaskBtn.addEventListener('click', () => {
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

saveTaskBtn.addEventListener('click', () => {
    const name = taskNameInput.value.trim();
    const description = taskDescInput.value.trim();

    if(!name) {
        alert('Please enter a task name!');
        return;
    }

    const newTask = {
        name,
        description,
        subtask: [...currentSubTask],
        createdAt: new Date().toISOString(),
        completed: false,
    };

    tasks.push(newTask);
    console.log('Tasks: ', tasks);  // TESTING

    taskNameInput.value = '';
    taskDescInput.value = '';
    subTaskList.innerHTML = '';
    currentSubTask = [];

    taskModal.classList.remove('active');

    alert('Task saved successfully!');
});

addSubTaskBtn.addEventListener('click', () => {
    const subtaskName = subTaskInput.value.trim();
    if(subtaskName) {
        currentSubTask.push(subtaskName);

        const li = document.createElement('li');
        li.textContent = subtaskName;
        subTaskList.appendChild(li);

        subTaskInput.value = '';
    }
});

openTaskListBtn.addEventListener('click', () => {
    renderTaskList();
    taskListModal.classList.add('active');
});

closeTaskListBtn.addEventListener('click', () => {
    taskListModal.classList.remove('active');
});

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
        li.innerHTML = ` <strong>${task.name}</strong> ${task.description ? `<p>${task.description}</p>` : ''} ${ task.subtask && task.subtask.length ? `<ul>${task.subtask.map(st => `<li>${st}</li>`).join('')}</ul>` : '' } `;
        taskListEl.appendChild(li);
    });
}

