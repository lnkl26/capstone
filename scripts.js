// DOM elements
const taskCreateBtn = document.getElementById('taskCreate-btn');
const taskArea = document.getElementById('task-area');
const taskInputName = document.getElementById('taskInput-name');
const taskInputDesc = document.getElementById('taskInput-desc');
const saveTaskBtn = document.getElementById('saveTask');
const taskListPopup = document.getElementById('task-list-popup');
const taskListBtn = document.getElementById('taskListView');
const taskList = document.getElementById('task-list');
const closeListBtn = document.getElementById('close-task-list');

// subtask elements
const subtaskInput = document.getElementById('subtaskInput');
const addSubtaskBtn = document.getElementById('addSubtask');
const subtaskList = document.getElementById('subtaskList');

// store all tasks
let tasks = [];
let currentSubtasks = []; // temporary subtasks for the task being created

// toggle task input area
taskCreateBtn.addEventListener('click', () => {
    if (taskArea.style.display === 'none' || taskArea.style.display === '') {
        taskArea.style.display = 'block';
        taskInputName.focus();
    } else {
        taskArea.style.display = 'none';
    }
});

// add subtask
addSubtaskBtn.addEventListener('click', () => {
    const subtaskName = subtaskInput.value.trim();

    if (!subtaskName) return;

    currentSubtasks.push(subtaskName);

    const li = document.createElement('li');
    li.textContent = subtaskName;

    // optionally allow deleting subtasks
    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'x';
    removeBtn.style.marginLeft = '10px';
    removeBtn.addEventListener('click', () => {
        subtaskList.removeChild(li);
        currentSubtasks = currentSubtasks.filter(st => st !== subtaskName);
    });

    li.appendChild(removeBtn);
    subtaskList.appendChild(li);

    subtaskInput.value = '';
    subtaskInput.focus();
});

// save a new task
saveTaskBtn.addEventListener('click', () => {
    const taskName = taskInputName.value.trim();
    const taskDesc = taskInputDesc.value.trim();

    if (!taskName) {
        alert('Task name is required.');
        return;
    }

    // create task object
    const newTask = {
        name: taskName,
        description: taskDesc || null,
        subtasks: [...currentSubtasks]
    };

    tasks.push(newTask);

    // reset form
    taskInputName.value = '';
    taskInputDesc.value = '';
    subtaskList.innerHTML = '';
    currentSubtasks = [];

    taskArea.style.display = 'none';

    alert(`Task "${taskName}" created successfully!`);
});

// show all tasks
taskListBtn.addEventListener('click', () => {
    taskList.innerHTML = '';

    if (tasks.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No tasks created yet.';
        taskList.appendChild(li);
    } else {
        tasks.forEach(task => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${task.name}</strong><br>
                ${task.description ? `<em>${task.description}</em><br>` : ''}
                ${
                    task.subtasks.length
                        ? `<ul>${task.subtasks.map(st => `<li>${st}</li>`).join('')}</ul>`
                        : ''
                }
            `;
            taskList.appendChild(li);
        });
    }

    taskListPopup.style.display = 'flex';
});

// close popup
closeListBtn.addEventListener('click', () => {
    taskListPopup.style.display = 'none';
});

// close popup by clicking outside
taskListPopup.addEventListener('click', (e) => {
    if (e.target === taskListPopup) {
        taskListPopup.style.display = 'none';
    }
});