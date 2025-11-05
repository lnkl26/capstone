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
        completed: editingTaskIndex !== null ? tasks[editingTaskIndex].completed : false
    };

    if(editingTaskIndex !== null) {
        tasks[editingTaskIndex] = newTask;
        editingTaskIndex = null;
    } else {
        tasks.push(newTask);
    }

    //tasks.push(newTask);
    console.log('Tasks: ', tasks);  // TESTING

    taskNameInput.value = '';
    taskDescInput.value = '';
    subTaskList.innerHTML = '';
    currentSubTask = [];

    taskModal.classList.remove('active');
    renderTaskList();
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
        li.classList.toggle('completed', task.completed);

        li.innerHTML = ` <div class="task-header"> <strong>${task.name}</strong> ${task.description ? `<p>${task.description}</p>` : ''} </div> ${task.subtask && task.subtask.length ? `<ul>${task.subtask.map(st => `<li>${st}</li>`).join('')}</ul>` : ''} <div class="task-actions"> <button class="edit-btn">Edit</button> <button class="complete-btn">${task.completed ? 'Undo' : 'Complete'}</button> <button class="delete-btn">Delete</button> </div> `;

        li.querySelector('.complete-btn').addEventListener('click', () => {
            tasks[index].completed = !tasks[index].completed;
            renderTaskList();
        });
    

        li.querySelector('.delete-btn').addEventListener('click', () => {
            if(confirm(`Delete "${task.name}"?`)) {
                tasks.splice(index, 1);
                renderTaskList();
            }
        });

        li.querySelector('.edit-btn').addEventListener('click', () => {
            taskNameInput.value = task.name;
            taskDescInput.value = task.description;
            subTaskList.innerHTML = ''; 
            currentSubTask = [...task.subtask];

            currentSubTask.forEach(st => {
                const li = document.createElement('li');
                li.textContent = st;
                subTaskList.appendChild(li);
            });
            taskListModal.classList.remove('active');
            editingTaskIndex = index;
            taskModal.querySelector('h2').textContent = 'Edit Task';
            saveTaskBtn.textContent = 'Save Changes';
            taskModal.classList.add('active');
        });

    taskListEl.appendChild(li);
    });
}

