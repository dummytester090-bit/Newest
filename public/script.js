const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const overlay = document.createElement('div');
overlay.className = 'overlay';
document.body.appendChild(overlay);

if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        overlay.classList.toggle('active');
    });
}

overlay.addEventListener('click', () => {
    navLinks.classList.remove('active');
    overlay.classList.remove('active');
});

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
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

document.querySelectorAll('.card').forEach(card => {
    const timerElement = card.querySelector('.timer');
    const getKeyBtn = card.querySelector('.get-key-btn');
    const reduceBtn = card.querySelector('.reduce-btn');
    const blurredKey = card.querySelector('.blurred-key');
    const keyType = card.dataset.keyType;
    const validityMinutes = parseInt(card.dataset.validity);
    const fullTimerSeconds = parseInt(card.dataset.timer);
    const maxUses = parseInt(card.dataset.uses);
    if (isNaN(validityMinutes) || isNaN(fullTimerSeconds) || isNaN(maxUses)) return;

    // State for this card only
    let timer = fullTimerSeconds;
    let interval = null;
    let isTimerRunning = true;
    let canClick = true;

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

    function enableGetKeyButton() {
        getKeyBtn.disabled = false;
        getKeyBtn.classList.add('glow');
        reduceBtn.disabled = true;
    }

    function startTimer() {
        updateTimerDisplay(timer);
        if (timer <= 0) {
            enableGetKeyButton();
            clearInterval(interval);
            isTimerRunning = false;
            sessionStorage.removeItem(storageKey);
            return;
        }
        reduceBtn.disabled = false;
        interval = setInterval(() => {
            if (!isTimerRunning) return;
            timer--;
            updateTimerDisplay(timer);
            if (timer <= 0) {
                clearInterval(interval);
                enableGetKeyButton();
                isTimerRunning = false;
                sessionStorage.removeItem(storageKey);
            } else {
                saveEndTime(timer);
            }
        }, 1000);
    }

    startTimer();

    // Cloud Function URL – replace with your actual function URL
    const functionUrl = 'https://halurea1.onrender.com/';

    getKeyBtn.addEventListener('click', async () => {
        try {
            getKeyBtn.disabled = true;
            getKeyBtn.textContent = 'Generating...';

            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    validityMinutes: validityMinutes,
                    maxUses: maxUses
                })
            });

            const data = await response.json();

            if (data.success) {
                const key = data.key;
                blurredKey.textContent = key;
                blurredKey.style.filter = 'none';
                showKeyModal(key);

                timer = fullTimerSeconds;
                clearInterval(interval);
                isTimerRunning = true;
                getKeyBtn.disabled = true;
                getKeyBtn.textContent = 'Get Key';
                getKeyBtn.classList.remove('glow');
                sessionStorage.removeItem(storageKey);
                startTimer();
            } else {
                throw new Error(data.error || 'Failed to generate key');
            }
        } catch (error) {
            console.error('Key generation error:', error);
            alert('Failed to generate key. Please try again.');
            getKeyBtn.disabled = false;
            getKeyBtn.textContent = 'Get Key';
        }
    });

    // FIXED: Reduce timer by exactly 2 seconds, never increase
    reduceBtn.addEventListener('click', () => {
        if (!canClick || timer <= 0) return;

        // Subtract 2 seconds, but never below 0
        timer = Math.max(0, timer - 2);
        updateTimerDisplay(timer);

        if (timer <= 0) {
            clearInterval(interval);
            enableGetKeyButton();
            isTimerRunning = false;
            sessionStorage.removeItem(storageKey);
            return;
        }

        // Cooldown: disable button for 1 second
        canClick = false;
        reduceBtn.disabled = true;
        clearInterval(interval);
        saveEndTime(timer);
        startTimer();

        setTimeout(() => {
            canClick = true;
            reduceBtn.disabled = false;
        }, 1000);
    });
});
