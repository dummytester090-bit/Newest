// public/script.js

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

// 🔥 REMOVE FIREBASE IMPORT (TEMP FIX)
// Firebase is NOT needed on frontend right now

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
        navigator.clipboard.writeText(generatedKeyDisplay.textContent)
            .then(() => alert('Key copied to clipboard!'));
    });
}

if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
}

window.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
});

// --- TIMER & KEY SYSTEM ---
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

    let timer = fullTimerSeconds;
    let interval;
    let canClick = true;

    function updateTimerDisplay(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        timerElement.textContent = `${mins}:${secs < 10 ? '0'+secs : secs}`;
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
            return;
        }

        reduceBtn.disabled = false;

        interval = setInterval(() => {
            timer--;
            updateTimerDisplay(timer);

            if (timer <= 0) {
                clearInterval(interval);
                enableGetKeyButton();
            }
        }, 1000);
    }

    startTimer();

    // ✅ BACKEND URL
    const functionUrl = 'https://halurea1.onrender.com/generatekey';

    getKeyBtn.addEventListener('click', async () => {
        try {
            getKeyBtn.disabled = true;
            getKeyBtn.textContent = 'Generating...';

            const res = await fetch(functionUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    validityMinutes,
                    maxUses
                })
            });

            const data = await res.json();

            if (data.success) {
                blurredKey.textContent = data.key;
                blurredKey.style.filter = 'none';
                showKeyModal(data.key);

                timer = fullTimerSeconds;
                clearInterval(interval);
                startTimer();

                getKeyBtn.textContent = 'Get Key';
                getKeyBtn.classList.remove('glow');

            } else {
                throw new Error(data.error);
            }

        } catch (err) {
            console.error(err);
            alert('Failed to generate key');
            getKeyBtn.disabled = false;
            getKeyBtn.textContent = 'Get Key';
        }
    });

    reduceBtn.addEventListener('click', () => {
        if (!canClick || timer <= 0) return;

        timer = Math.max(0, timer - 2);
        updateTimerDisplay(timer);

        if (timer <= 0) {
            clearInterval(interval);
            enableGetKeyButton();
            return;
        }

        canClick = false;
        reduceBtn.disabled = true;

        setTimeout(() => {
            canClick = true;
            reduceBtn.disabled = false;
        }, 1000);
    });

});
