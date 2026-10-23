/* ================================================================
   My Personal Dashboard - Vanilla JavaScript Application
   ================================================================
   Features:
   - Greeting with live clock and custom name
   - Focus timer (Pomodoro style)
   - To-do list with add, edit, complete, delete (prevents duplicates)
   - Quick links saved to Local Storage
   - Light / Dark mode toggle

   Challenges implemented (3 of 5):
   1. Light / Dark mode
   2. Custom name in greeting
   3. Prevent duplicate tasks
   ================================================================ */

(function () {
    'use strict';

    /* ================================================================
       LocalStorage Helpers
       ================================================================ */
    const storage = {
        get: function (key, fallback) {
            try {
                const value = localStorage.getItem(key);
                return value ? JSON.parse(value) : fallback;
            } catch (e) {
                console.warn('Failed to read from localStorage:', e);
                return fallback;
            }
        },
        set: function (key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.warn('Failed to write to localStorage:', e);
            }
        }
    };

    /* ================================================================
       Greeting & Clock Module
       ================================================================ */
    const Greeting = (function () {
        const greetingEl = document.getElementById('greeting');
        const nameDisplayEl = document.getElementById('userNameDisplay');
        const timeEl = document.getElementById('currentTime');
        const dateEl = document.getElementById('currentDate');

        let userName = storage.get('dashboard_userName', '');

        function getGreetingText(hour) {
            if (hour >= 5 && hour < 12) return 'Good morning';
            if (hour >= 12 && hour < 17) return 'Good afternoon';
            if (hour >= 17 && hour < 21) return 'Good evening';
            return 'Good night';
        }

        function updateClock() {
            const now = new Date();
            const hours = now.getHours();
            const mins = now.getMinutes();
            const secs = now.getSeconds();

            // Format time as HH:MM:SS
            timeEl.textContent = String(hours).padStart(2, '0') + ':' +
                                 String(mins).padStart(2, '0') + ':' +
                                 String(secs).padStart(2, '0');

            // Format date
            const dateOptions = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
            dateEl.textContent = now.toLocaleDateString('en-US', dateOptions);

            // Update greeting text
            const greetingBase = getGreetingText(hours);
            greetingEl.textContent = userName
                ? greetingBase + ', ' + userName + '!'
                : greetingBase + '!';
        }

        function updateNameDisplay() {
            if (userName) {
                nameDisplayEl.textContent = 'Click to change your name';
            }
        }

        function promptForName() {
            const input = prompt('What is your name?', userName);
            if (input !== null) {
                const trimmed = input.trim();
                if (trimmed) {
                    userName = trimmed;
                    storage.set('dashboard_userName', userName);
                } else if (input.trim() === '') {
                    // Clear the name
                    userName = '';
                    storage.set('dashboard_userName', '');
                }
                updateNameDisplay();
                updateClock();
            }
        }

        function init() {
            updateNameDisplay();
            updateClock();
            // Update clock every second
            setInterval(updateClock, 1000);

            nameDisplayEl.addEventListener('click', promptForName);
        }

        return { init: init };
    })();

    /* ================================================================
       Focus Timer Module
       ================================================================ */
    const FocusTimer = (function () {
        const displayEl = document.getElementById('timerDisplay');
        const startBtn = document.getElementById('timerStart');
        const stopBtn = document.getElementById('timerStop');
        const resetBtn = document.getElementById('timerReset');

        const DEFAULT_SECONDS = 25 * 60; // 25 minutes
        let remainingSeconds = DEFAULT_SECONDS;
        let intervalId = null;
        let isRunning = false;

        function formatTime(secs) {
            const mins = Math.floor(secs / 60);
            const seconds = secs % 60;
            return String(mins).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
        }

        function render() {
            displayEl.textContent = formatTime(remainingSeconds);
            startBtn.textContent = isRunning ? 'Pause' : 'Start';
        }

        function tick() {
            if (remainingSeconds > 0) {
                remainingSeconds--;
                render();
            } else {
                // Timer finished
                stop();
                alert('Time is up! Great job staying focused! 🎉');
            }
        }

        function start() {
            if (isRunning) {
                // Pause
                stop();
                return;
            }
            isRunning = true;
            intervalId = setInterval(tick, 1000);
            render();
        }

        function stop() {
            isRunning = false;
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
            render();
        }

        function reset() {
            stop();
            remainingSeconds = DEFAULT_SECONDS;
            render();
        }

        function init() {
            render();
            startBtn.addEventListener('click', start);
            stopBtn.addEventListener('click', stop);
            resetBtn.addEventListener('click', reset);
        }

        return { init: init };
    })();

    /* ================================================================
       To-Do List Module
       Challenge: Prevent duplicate tasks
       ================================================================ */
    const TodoList = (function () {
        const formEl = document.getElementById('todoForm');
        const inputEl = document.getElementById('todoInput');
        const listEl = document.getElementById('todoList');

        let tasks = storage.get('dashboard_todos', []);

        function save() {
            storage.set('dashboard_todos', tasks);
        }

        function render() {
            listEl.innerHTML = '';

            if (tasks.length === 0) {
                const hint = document.createElement('li');
                hint.className = 'empty-hint';
                hint.textContent = 'No tasks yet. Add one above!';
                listEl.appendChild(hint);
                return;
            }

            tasks.forEach(function (task, index) {
                const li = document.createElement('li');
                li.className = 'todo-item' + (task.done ? ' done' : '');

                // Checkbox
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = task.done;
                checkbox.addEventListener('change', function () {
                    toggleDone(index);
                });

                // Task text (click to edit)
                const span = document.createElement('span');
                span.className = 'todo-text';
                span.textContent = task.text;
                span.addEventListener('click', function () {
                    startEdit(index, li, span);
                });

                // Delete button
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'todo-actions';

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn btn-danger';
                deleteBtn.textContent = 'Delete';
                deleteBtn.addEventListener('click', function () {
                    deleteTask(index);
                });

                actionsDiv.appendChild(deleteBtn);

                li.appendChild(checkbox);
                li.appendChild(span);
                li.appendChild(actionsDiv);
                listEl.appendChild(li);
            });
        }

        function addTask(text) {
            const trimmed = text.trim();

            if (!trimmed) {
                return;
            }

            // Challenge: Prevent duplicate tasks
            const isDuplicate = tasks.some(function (task) {
                return task.text.toLowerCase() === trimmed.toLowerCase();
            });

            if (isDuplicate) {
                alert('That task already exists in your list!');
                return;
            }

            tasks.push({ text: trimmed, done: false });
            save();
            render();
        }

        function toggleDone(index) {
            tasks[index].done = !tasks[index].done;
            save();
            render();
        }

        function deleteTask(index) {
            tasks.splice(index, 1);
            save();
            render();
        }

        function startEdit(index, li, span) {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'todo-edit-input';
            input.value = tasks[index].text;
            input.autocomplete = 'off';

            li.replaceChild(input, span);
            input.focus();
            input.select();

            function saveEdit() {
                const newText = input.value.trim();
                if (newText && newText !== tasks[index].text) {
                    // Check for duplicates (excluding the current task)
                    const isDuplicate = tasks.some(function (task, i) {
                        return i !== index && task.text.toLowerCase() === newText.toLowerCase();
                    });
                    if (isDuplicate) {
                        alert('Another task with that text already exists!');
                        render(); // Revert
                        return;
                    }
                    tasks[index].text = newText;
                    save();
                }
                render();
            }

            input.addEventListener('blur', saveEdit);
            input.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    input.blur();
                } else if (e.key === 'Escape') {
                    render(); // Cancel edit
                }
            });
        }

        function init() {
            render();
            formEl.addEventListener('submit', function (e) {
                e.preventDefault();
                addTask(inputEl.value);
                inputEl.value = '';
                inputEl.focus();
            });
        }

        return { init: init };
    })();

    /* ================================================================
       Quick Links Module
       ================================================================ */
    const QuickLinks = (function () {
        const formEl = document.getElementById('linkForm');
        const nameInput = document.getElementById('linkName');
        const urlInput = document.getElementById('linkUrl');
        const listEl = document.getElementById('linksList');

        let links = storage.get('dashboard_links', []);

        function save() {
            storage.set('dashboard_links', links);
        }

        function normalizeUrl(url) {
            let normalized = url.trim();
            // Add https:// if no protocol is specified
            if (!/^https?:\/\//i.test(normalized)) {
                normalized = 'https://' + normalized;
            }
            return normalized;
        }

        function render() {
            listEl.innerHTML = '';

            if (links.length === 0) {
                const hint = document.createElement('p');
                hint.className = 'empty-hint';
                hint.textContent = 'No quick links yet. Add one above!';
                listEl.appendChild(hint);
                return;
            }

            links.forEach(function (link, index) {
                const item = document.createElement('div');
                item.className = 'link-item';

                const anchor = document.createElement('a');
                anchor.href = link.url;
                anchor.textContent = link.name;
                anchor.target = '_blank';
                anchor.rel = 'noopener noreferrer';

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'link-delete';
                deleteBtn.textContent = '✕';
                deleteBtn.title = 'Remove link';
                deleteBtn.addEventListener('click', function () {
                    deleteLink(index);
                });

                item.appendChild(anchor);
                item.appendChild(deleteBtn);
                listEl.appendChild(item);
            });
        }

        function addLink(name, url) {
            const trimmedName = name.trim();
            const trimmedUrl = url.trim();

            if (!trimmedName || !trimmedUrl) {
                alert('Please enter both a name and a URL for the link.');
                return;
            }

            const normalizedUrl = normalizeUrl(trimmedUrl);

            links.push({ name: trimmedName, url: normalizedUrl });
            save();
            render();
        }

        function deleteLink(index) {
            links.splice(index, 1);
            save();
            render();
        }

        function init() {
            render();
            formEl.addEventListener('submit', function (e) {
                e.preventDefault();
                addLink(nameInput.value, urlInput.value);
                nameInput.value = '';
                urlInput.value = '';
                nameInput.focus();
            });
        }

        return { init: init };
    })();

    /* ================================================================
       Theme Toggle Module
       Challenge: Light / Dark mode
       ================================================================ */
    const ThemeToggle = (function () {
        const toggleBtn = document.getElementById('themeToggle');
        const iconEl = toggleBtn.querySelector('.theme-icon');

        function applyTheme(theme) {
            document.body.setAttribute('data-theme', theme);
            iconEl.textContent = theme === 'dark' ? '☀️' : '🌙';
        }

        function getPreferredTheme() {
            const saved = storage.get('dashboard_theme', null);
            if (saved) return saved;

            // Fall back to system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return 'dark';
            }
            return 'light';
        }

        function toggle() {
            const current = document.body.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            applyTheme(next);
            storage.set('dashboard_theme', next);
        }

        function init() {
            applyTheme(getPreferredTheme());
            toggleBtn.addEventListener('click', toggle);
        }

        return { init: init };
    })();

    /* ================================================================
       Initialize All Modules on DOM Ready
       ================================================================ */
    document.addEventListener('DOMContentLoaded', function () {
        ThemeToggle.init();
        Greeting.init();
        FocusTimer.init();
        TodoList.init();
        QuickLinks.init();
    });

})();
