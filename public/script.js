const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-analytics.js";

const firebaseConfig = {
    apiKey: "AIzaSyCIaeNa81nbHhBNyJeBG_IWR-LhJNUjRvg",
    authDomain: "halurea1.firebaseapp.com",
    databaseURL: "https://halurea1.firebaseio.com",
    projectId: "halurea1",
    storageBucket: "halurea1.firebasestorage.app",
    messagingSenderId: "216574232987",
    appId: "1:216574232987:web:fd4968243045e25505f93e",
    measurementId: "G-GS3ZZYM5KH"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const analytics = getAnalytics(app);

const modal = document.getElementById('keyModal');
const closeBtn = document.querySelector('.close');
const copyKeyBtn = document.getElementById('copyKey');
const generatedKeyDisplay = document.getElementById('generatedKey');

function showKeyModal(key) {
    if (generatedKeyDisplay) {
        generatedKeyDisplay.textContent = key;
        modal.style.display = 'block';
    }
}

if (copyKeyBtn) {
    copyKeyBtn.addEventListener('click', () => {
        const key = generatedKeyDisplay.textContent;
        navigator.clipboard.writeText(key).then(() => alert('Key copied to clipboard!'));
    });
}

if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
}

window.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
});

function generateKey(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$&-+/?!*';
    let key = '';
    for (let i = 0; i < length; i++) key += chars.charAt(Math.floor(Math.random() * chars.length));
    return key;
}

document.querySelectorAll('.card').forEach(card => {
    const timerElement = card.querySelector('.timer');
    const getKeyBtn = card.querySelector('.get-key-btn');
    const blurredKey = card.querySelector('.blurred-key');
    const keyType = card.dataset.keyType;
    const validityMinutes = parseInt(card.dataset.validity);
    const fullTimerSeconds = parseInt(card.dataset.timer);
    if (isNaN(validityMinutes) || isNaN(fullTimerSeconds)) return;

    let timer = fullTimerSeconds;
    let interval;
    let isTimerRunning = true;

    // Load saved end time from sessionStorage
    const storageKey = `halurea_timer_end_${keyType}`;
    let endTime = sessionStorage.getItem(storageKey);
    let remainingSeconds = null;

    if (endTime) {
        endTime = parseInt(endTime);
        const now = Date.now();
        if (endTime > now) {
            remainingSeconds = Math.floor((endTime - now) / 1000);
            if (remainingSeconds > 0 && remainingSeconds <= fullTimerSeconds) {
                timer = remainingSeconds;
            } else {
                timer = fullTimerSeconds;
                sessionStorage.removeItem(storageKey);
            }
        } else {
            timer = fullTimerSeconds;
            sessionStorage.removeItem(storageKey);
        }
    }

    function updateTimerDisplay(seconds) {
        const mins = Math.max(0, Math.floor(seconds / 60));
        const secs = Math.max(0, seconds % 60);
        timerElement.textContent = `${mins}:${secs < 10 ? '0' + secs : secs}`;
    }

    function saveEndTime(secondsRemaining) {
        if (secondsRemaining <= 0) {
            sessionStorage.removeItem(storageKey);
            return;
        }
        const newEndTime = Date.now() + (secondsRemaining * 1000);
        sessionStorage.setItem(storageKey, newEndTime);
    }

    function startTimer() {
        let seconds = timer;
        updateTimerDisplay(seconds);
        if (seconds <= 0) {
            getKeyBtn.disabled = false;
            getKeyBtn.classList.add('glow');
            isTimerRunning = false;
            sessionStorage.removeItem(storageKey);
            return;
        }
        saveEndTime(seconds);
        interval = setInterval(() => {
            if (!isTimerRunning) return;
            seconds--;
            updateTimerDisplay(seconds);
            if (seconds <= 0) {
                clearInterval(interval);
                getKeyBtn.disabled = false;
                getKeyBtn.classList.add('glow');
                isTimerRunning = false;
                sessionStorage.removeItem(storageKey);
            } else {
                saveEndTime(seconds);
            }
        }, 1000);
    }

    startTimer();

    getKeyBtn.addEventListener('click', async () => {
        const key = generateKey();
        const expiryTime = Date.now() + validityMinutes * 60 * 1000;
        const userId = `user_${Math.random().toString(36).substr(2, 9)}`;
        try {
            await set(ref(db, `keys/${userId}`), { key, expiry: expiryTime, used: false });
            blurredKey.textContent = key;
            blurredKey.style.filter = 'none';
            showKeyModal(key);

            // Reset timer and clear stored end time
            timer = fullTimerSeconds;
            clearInterval(interval);
            isTimerRunning = true;
            getKeyBtn.disabled = true;
            getKeyBtn.classList.remove('glow');
            sessionStorage.removeItem(storageKey);
            startTimer();
        } catch (error) {
            alert('Failed to generate key. Please try again.');
            console.error(error);
        }
    });
});
