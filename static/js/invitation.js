/* ==========================================================================
   Invitation Page – JavaScript
   - Background music control (auto-play on interaction)
   - Scroll-based fade-in animations
   - Floating petal effects
   ========================================================================== */

(function () {
    'use strict';

    // ---------- Music ----------
    const bgm = document.getElementById('bgm');
    const musicBtn = document.getElementById('music-btn');
    const iconPlaying = musicBtn.querySelector('.music-icon.playing');
    const iconPaused = musicBtn.querySelector('.music-icon.paused');
    let musicStarted = false;

    function updateMusicUI(playing) {
        if (playing) {
            musicBtn.classList.add('is-playing');
            iconPlaying.style.display = '';
            iconPaused.style.display = 'none';
        } else {
            musicBtn.classList.remove('is-playing');
            iconPlaying.style.display = 'none';
            iconPaused.style.display = '';
        }
    }

    function toggleMusic() {
        if (bgm.paused) {
            bgm.play().then(() => updateMusicUI(true)).catch(() => {});
        } else {
            bgm.pause();
            updateMusicUI(false);
        }
    }

    musicBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleMusic();
    });

    // ---------- Landing Overlay ----------
    const overlay = document.getElementById('landing-overlay');
    const openBtn = document.getElementById('open-btn');

    // Prevent scrolling before opening invitation
    document.body.classList.add('no-scroll');

    function dismissOverlay() {
        if (musicStarted) return;
        musicStarted = true;
        // This click counts as user interaction → browser allows play
        bgm.play().then(() => updateMusicUI(true)).catch(() => {});
        overlay.classList.add('fade-out');

        // Re-enable scrolling
        document.body.classList.remove('no-scroll');

        setTimeout(() => { overlay.style.display = 'none'; }, 600);
    }

    openBtn.addEventListener('click', dismissOverlay);
    overlay.addEventListener('click', dismissOverlay);

    // ---------- Scroll Fade-in ----------
    const faders = document.querySelectorAll('.fade-in');

    function checkFade() {
        const triggerBottom = window.innerHeight * 0.85;
        faders.forEach(function (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top < triggerBottom) {
                el.classList.add('visible');
            }
        });
    }

    // Initial check
    checkFade();

    // Throttled scroll listener
    let ticking = false;
    window.addEventListener('scroll', function () {
        if (!ticking) {
            requestAnimationFrame(function () {
                checkFade();
                ticking = false;
            });
            ticking = true;
        }
    });

    window.addEventListener('resize', checkFade);

    // ---------- Floating Petals ----------
    const petalsContainer = document.getElementById('petals-container');

    // Get theme-specific colors
    function getThemeColors() {
        const theme = document.body.dataset.theme || 'classic';
        const themeColors = {
            classic: ['#f4c2c2', '#f5b7b1', '#e8c4c4', '#f0d0ce', '#ddc5a8', '#e6d2b5', '#f2e0d0', '#f7cac9'],
            pink: ['#ffc2d4', '#ffb3c6', '#ffa8c5', '#ff9ec1', '#f5a9c1', '#e899b3', '#f0b8d0', '#ffd1e0'],
            blue: ['#a8d5f7', '#9bc7e6', '#b3d9f2', '#c2e0f5', '#aed4eb', '#9ec9e0', '#b8dcf0', '#d0e8f7'],
            green: ['#b8e6b8', '#a8dba8', '#c1e6c1', '#d1f0d1', '#b0deb0', '#9dd39d', '#c8e8c8', '#d8f0d8'],
            lavender: ['#d4c2f0', '#c9b8e8', '#dcc8f5', '#e6d4f7', '#d0bfeb', '#c0afe0', '#dcc8f0', '#e8d8f7'],
            red: ['#ffb3b3', '#ffa8a8', '#ff9999', '#ff8c8c', '#f5a8a8', '#e89999', '#f0b3b3', '#ffc2c2']
        };
        return themeColors[theme] || themeColors.classic;
    }

    function createPetal() {
        const petal = document.createElement('div');
        petal.className = 'petal';

        const size = 12 + Math.random() * 14;
        const left = Math.random() * 100;
        const duration = 6 + Math.random() * 8;
        const delay = Math.random() * 2;

        const petalColors = getThemeColors();
        const color = petalColors[Math.floor(Math.random() * petalColors.length)];

        petal.style.width = size + 'px';
        petal.style.height = size + 'px';
        petal.style.left = left + '%';
        petal.style.animationDuration = duration + 's';
        petal.style.animationDelay = delay + 's';

        // SVG petal shape
        petal.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M12 2C8 6 4 10 4 14c0 4.4 3.6 8 8 8s8-3.6 8-8c0-4-4-8-8-12z" ' +
            'fill="' + color + '" opacity="0.6"/></svg>';

        petalsContainer.appendChild(petal);

        // Remove after animation
        setTimeout(function () {
            petal.remove();
        }, (duration + delay) * 1000);
    }

    // Create petals at intervals
    function startPetals() {
        // Initial burst
        for (var i = 0; i < 5; i++) {
            setTimeout(createPetal, i * 300);
        }
        // Continuous gentle petals
        setInterval(createPetal, 2500);
    }

    startPetals();

    // ---------- Floating Hearts ----------
    const heartSymbols = ['♥', '❤', '💕', '💗'];

    function createHeart() {
        const heart = document.createElement('div');
        heart.className = 'heart';
        heart.textContent = heartSymbols[Math.floor(Math.random() * heartSymbols.length)];

        const size = 14 + Math.random() * 10;
        const left = Math.random() * 100;
        const duration = 8 + Math.random() * 6;
        const delay = Math.random() * 3;

        heart.style.fontSize = size + 'px';
        heart.style.left = left + '%';
        heart.style.animationDuration = duration + 's';
        heart.style.animationDelay = delay + 's';

        petalsContainer.appendChild(heart);

        setTimeout(function () {
            heart.remove();
        }, (duration + delay) * 1000);
    }

    function startHearts() {
        // Initial hearts
        for (var i = 0; i < 3; i++) {
            setTimeout(createHeart, i * 800);
        }
        // Continuous hearts
        setInterval(createHeart, 4000);
    }

    startHearts();

    // ---------- Sparkle Particles on Scroll ----------
    function createSparkle(x, y) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle-particle';
        sparkle.style.left = x + 'px';
        sparkle.style.top = y + 'px';
        document.body.appendChild(sparkle);

        setTimeout(function () {
            sparkle.remove();
        }, 1500);
    }

    let lastSparkleTime = 0;
    window.addEventListener('scroll', function () {
        const now = Date.now();
        if (now - lastSparkleTime > 200) {
            const x = Math.random() * window.innerWidth;
            const y = window.scrollY + Math.random() * window.innerHeight;
            createSparkle(x, y);
            lastSparkleTime = now;
        }
    });

    // ---------- RSVP Functionality ----------
    const rsvpForm = document.getElementById('rsvp-form');
    const rsvpMessage = document.getElementById('rsvp-message');
    const rsvpYesBtn = document.getElementById('rsvp-yes');
    const rsvpNoBtn = document.getElementById('rsvp-no');
    const guestCountSection = document.getElementById('guest-count-section');
    const guestCountSelect = document.getElementById('guest-count');
    const rsvpSubmitBtn = document.getElementById('rsvp-submit');
    const rsvpMessageText = document.getElementById('rsvp-message-text');
    const rsvpChangeBtn = document.getElementById('rsvp-change');

    let selectedAttending = null;

    // Check if user has already responded
    if (typeof IS_ATTENDING !== 'undefined' && IS_ATTENDING !== null) {
        showRsvpMessage(IS_ATTENDING, GUEST_COUNT);
    }

    // Handle RSVP button clicks
    rsvpYesBtn.addEventListener('click', function () {
        selectAttending(true);
    });

    rsvpNoBtn.addEventListener('click', function () {
        selectAttending(false);
    });

    function selectAttending(willAttend) {
        selectedAttending = willAttend;

        // Update button states
        rsvpYesBtn.classList.toggle('active', willAttend === true);
        rsvpNoBtn.classList.toggle('active', willAttend === false);

        // Show guest count selector if attending
        if (willAttend) {
            guestCountSection.style.display = 'block';
            // Pre-select previous count if exists
            if (typeof GUEST_COUNT !== 'undefined' && GUEST_COUNT > 0) {
                guestCountSelect.value = GUEST_COUNT;
            }
        } else {
            guestCountSection.style.display = 'none';
        }

        // Show submit button
        rsvpSubmitBtn.style.display = 'block';
    }

    // Handle RSVP submission
    rsvpSubmitBtn.addEventListener('click', function () {
        const guestCount = selectedAttending ? parseInt(guestCountSelect.value) : 0;

        // Disable button during submission
        rsvpSubmitBtn.disabled = true;
        rsvpSubmitBtn.textContent = '提交中...';

        // Submit to API
        fetch('/api/rsvp/' + GUEST_CODE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                is_attending: selectedAttending,
                guest_count: guestCount
            })
        })
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            if (data.ok) {
                showRsvpMessage(data.is_attending, data.guest_count);
                rsvpMessageText.textContent = data.message;
            } else {
                alert('提交失败：' + (data.error || '未知错误'));
                rsvpSubmitBtn.disabled = false;
                rsvpSubmitBtn.textContent = CONFIG.rsvpSubmitText || '确认提交';
            }
        })
        .catch(function (error) {
            alert('提交失败，请重试');
            rsvpSubmitBtn.disabled = false;
            rsvpSubmitBtn.textContent = CONFIG.rsvpSubmitText || '确认提交';
        });
    });

    function showRsvpMessage(isAttending, guestCount) {
        rsvpForm.style.display = 'none';
        rsvpMessage.style.display = 'block';

        const message = isAttending
            ? CONFIG.groomName + ' & ' + CONFIG.brideName + ' ' + CONFIG.rsvpThankYou + '\n您已确认' + guestCount + '人参加。'
            : CONFIG.rsvpRegret;

        rsvpMessageText.textContent = message;
    }

    // Handle change RSVP
    rsvpChangeBtn.addEventListener('click', function () {
        rsvpForm.style.display = 'block';
        rsvpMessage.style.display = 'none';
        rsvpSubmitBtn.disabled = false;
        rsvpSubmitBtn.textContent = CONFIG.rsvpSubmitText || '确认提交';

        // Pre-select previous response
        if (typeof IS_ATTENDING !== 'undefined' && IS_ATTENDING !== null) {
            selectAttending(IS_ATTENDING);
        }
    });

})();
