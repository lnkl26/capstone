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
        subtask: [ ... currentSubTask],
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
        currentSubTask.push({ name: subtaskName, completed: false });
        renderSubTasks(currentSubTask, subTaskList);
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
        deleteBtn.addEventListener('click', () => {
            if(confirm(`Delete "${task.name}"?`)) {
                tasks.splice(index, 1);
                renderTaskList();
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

        const span = document.createElement('span');
        span.textContent = st.name;

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

