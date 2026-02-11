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

    function dismissOverlay() {
        if (musicStarted) return;
        musicStarted = true;
        // This click counts as user interaction → browser allows play
        bgm.play().then(() => updateMusicUI(true)).catch(() => {});
        overlay.classList.add('fade-out');
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

    // Petal colors: soft pink/rose tones
    const petalColors = [
        '#f4c2c2', '#f5b7b1', '#e8c4c4', '#f0d0ce',
        '#ddc5a8', '#e6d2b5', '#f2e0d0', '#f7cac9'
    ];

    function createPetal() {
        const petal = document.createElement('div');
        petal.className = 'petal';

        const size = 12 + Math.random() * 14;
        const left = Math.random() * 100;
        const duration = 6 + Math.random() * 8;
        const delay = Math.random() * 2;
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

})();
