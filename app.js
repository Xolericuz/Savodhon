class XolericApp {
    constructor() {
        this.state = {
            user: localStorage.getItem('xoleric_user') || null,
            xp: parseInt(localStorage.getItem('xoleric_xp')) || 0,
            streak: parseInt(localStorage.getItem('xoleric_streak')) || 0,
            lastPlayDate: localStorage.getItem('xoleric_lastDate') || null,
            letterProgress: JSON.parse(localStorage.getItem('xoleric_letterProgress')) || {},
            categoryProgress: JSON.parse(localStorage.getItem('xoleric_categoryProgress')) || {},
            globalProgress: JSON.parse(localStorage.getItem('xoleric_globalProgress')) || { step1: 0, step2: 0, step3: 0, step4: 0, step5: 0, step6: 0 },
            achievements: JSON.parse(localStorage.getItem('xoleric_achievements')) || {
                firstWord: false,
                tenWords: 0,
                hundredXP: false,
                streak3: false,
                allLetters: false
            },
            focusMode: 'practice',
            dailyChallenge: null
        };

        this.currentMode = 'letter';
        this.currentLetter = 'A';
        this.currentCategory = 'Hayvonlar';
        this.currentStep = 1;
        this.currentWordIdx = 0;
        this.currentWordList = [];

        this.initializeDOM();
        this.attachEventListeners();
        this.checkStreak();
        this.generateDailyChallenge();
        this.renderHub();
    }

    initializeDOM() {
        this.dom = {
            // Screens
            welcomeScreen: document.getElementById('welcomeScreen'),
            mainScreen: document.getElementById('mainScreen'),
            focusView: document.getElementById('focusView'),
            guardOverlay: document.getElementById('guardOverlay'),

            // Input/Auth
            userNameInput: document.getElementById('userNameInput'),
            startBtn: document.getElementById('startBtn'),
            continueLastBtn: document.getElementById('continueLastBtn'),

            // Header
            userNameDisplay: document.getElementById('userNameDisplay'),
            xpDisplay: document.getElementById('xpDisplay'),
            streakDisplay: document.getElementById('streakCount'),

            // Views
            hubView: document.getElementById('hubView'),
            achievementsView: document.getElementById('achievementsView'),
            statsView: document.getElementById('statsView'),

            // Grids
            letterGrid: document.getElementById('letterGrid'),
            categoryGrid: document.getElementById('categoryGrid'),
            globalGrid: document.getElementById('globalGrid'),
            dailyWordPreview: document.getElementById('dailyWordPreview'),

            // Focus Mode
            focusView: document.getElementById('focusView'),
            backBtn: document.getElementById('backBtn'),
            speakBtn: document.getElementById('speakBtn'),
            stepLabel: document.getElementById('stepLabel'),
            focusModeTabs: document.getElementById('focusModeTabs'),

            // Practice
            wordBox: document.getElementById('wordBox'),
            mirrorField: document.getElementById('mirrorField'),
            textMirror: document.getElementById('textMirror'),
            cursor: document.getElementById('cursor'),
            hiddenInput: document.getElementById('hiddenInput'),
            statusMsg: document.getElementById('statusMsg'),
            nextBtn: document.getElementById('nextBtn'),

            // Catalog
            catalogMode: document.getElementById('catalogMode'),
            practiceMode: document.getElementById('practiceMode'),
            catalogStepLabel: document.getElementById('catalogStepLabel'),
            catalogGrid: document.getElementById('catalogGrid'),
            prevStepBtn: document.getElementById('prevStepBtn'),
            nextStepBtn: document.getElementById('nextStepBtn'),

            // Navigation
            navItems: document.querySelectorAll('.nav-item'),

            // Achievements & Stats
            achievementsGrid: document.getElementById('achievementsGrid'),
            statTotalXP: document.getElementById('statTotalXP'),
            statStreak: document.getElementById('statStreak'),
            statWordsLearned: document.getElementById('statWordsLearned'),
            statLettersDone: document.getElementById('statLettersDone')
        };

        if (this.state.user) {
            this.showMainScreen();
        }
    }

    attachEventListeners() {
        this.dom.startBtn.addEventListener('click', () => this.handleStartGame());
        this.dom.continueLastBtn.addEventListener('click', () => this.handleContinueLastSession());
        this.dom.backBtn.addEventListener('click', () => this.closeSessionAndReturnHub());
        this.dom.speakBtn.addEventListener('click', () => this.speakCurrentWord());
        this.dom.nextBtn.addEventListener('click', () => this.handleNextWord());
        this.dom.prevStepBtn.addEventListener('click', () => this.navigatePrevStep());
        this.dom.nextStepBtn.addEventListener('click', () => this.navigateNextStep());

        this.dom.focusModeTabs.forEach(tab => {
            tab.addEventListener('click', (e) => this.setFocusMode(e.target.dataset.focusmode));
        });

        this.dom.navItems.forEach(item => {
            item.addEventListener('click', () => this.navigateView(item.dataset.nav));
        });

        this.dom.hiddenInput.addEventListener('input', (e) => this.handleInputChange(e));
        this.dom.hiddenInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && this.dom.nextBtn.classList.contains('active')) {
                this.handleNextWord();
            }
        });
    }

    handleStartGame() {
        const name = this.dom.userNameInput.value.trim();
        if (!name) {
            alert('Ismingizni kiriting');
            return;
        }
        this.state.user = name;
        localStorage.setItem('xoleric_user', name);
        this.requestFullAccess();
        this.showMainScreen();
    }

    handleContinueLastSession() {
        if (!this.state.user) {
            alert('Avval isinggiz davom ettiring');
            return;
        }
        this.requestFullAccess();
        this.showMainScreen();
    }

    showMainScreen() {
        this.dom.welcomeScreen.classList.add('hidden');
        this.dom.mainScreen.classList.remove('hidden');
        this.dom.userNameDisplay.textContent = this.state.user?.toUpperCase() || 'Foydalanuvchi';
        this.updateHeaderStats();
    }

    renderHub() {
        this.renderLetters();
        this.renderCategories();
    }

    renderLetters() {
        const letters = Object.keys(DB);
        this.dom.letterGrid.innerHTML = '';
        letters.forEach(letter => {
            const tile = document.createElement('div');
            tile.className = 'hub-tile glass';
            const prog = this.state.letterProgress[letter] || 0;
            const bar = document.createElement('div');
            bar.className = 'tile-progress';
            const fill = document.createElement('div');
            fill.className = 'tile-progress-fill';
            fill.style.width = `${prog}%`;
            bar.appendChild(fill);
            tile.innerHTML = `<span>${letter}</span>`;
            tile.appendChild(bar);
            tile.addEventListener('click', () => this.startLetterMode(letter));
            this.dom.letterGrid.appendChild(tile);
        });
    }

    renderCategories() {
        const cats = Object.keys(CATEGORIES);
        this.dom.categoryGrid.innerHTML = '';
        cats.forEach(cat => {
            const tile = document.createElement('div');
            tile.className = 'hub-tile glass small';
            tile.innerHTML = `<span>${cat}</span>`;
            const prog = this.state.categoryProgress[cat] || 0;
            const bar = document.createElement('div');
            bar.className = 'tile-progress';
            const fill = document.createElement('div');
            fill.className = 'tile-progress-fill';
            fill.style.width = `${prog}%`;
            bar.appendChild(fill);
            tile.appendChild(bar);
            tile.addEventListener('click', () => this.startCategoryMode(cat));
            this.dom.categoryGrid.appendChild(tile);
        });
    }

    startLetterMode(letter) {
        this.currentMode = 'letter';
        this.currentLetter = letter;
        const prog = this.state.letterProgress[letter] || 0;
        this.currentStep = prog >= 100 ? 6 : Math.floor(prog / 16.67) + 1;
        this.currentWordIdx = 0;
        this.updateWordList();
        this.showFocusMode();
    }

    startCategoryMode(category) {
        this.currentMode = 'category';
        this.currentCategory = category;
        const prog = this.state.categoryProgress[category] || 0;
        this.currentStep = prog >= 100 ? 6 : Math.floor(prog / 16.67) + 1;
        this.currentWordIdx = 0;
        this.updateWordList();
        this.showFocusMode();
    }

    startGlobalMode() {
        this.currentMode = 'global';
        let step = 1;
        for (let s = 1; s < 6; s++) {
            if ((this.state.globalProgress[`step${s}`] || 0) < 100) {
                step = s;
                break;
            }
        }
        this.currentStep = step;
        this.globalWordList = this.buildGlobalWordList(step);
        this.currentWordList = this.globalWordList.map(w => ({ word: w.word, clean: w.clean }));
        const prog = this.state.globalProgress[`step${step}`] || 0;
        const totalWords = this.currentWordList.length;
        this.currentWordIdx = Math.floor((prog / 100) * totalWords);
        if (this.currentWordIdx >= totalWords) this.currentWordIdx = totalWords - 1;
        this.showFocusMode();
    }

    startDailyChallenge() {
        this.currentMode = 'daily';
        this.currentWordList = [this.state.dailyChallenge];
        this.currentStep = 1;
        this.currentWordIdx = 0;
        this.showFocusMode();
    }

    showFocusMode() {
        this.dom.mainScreen.style.display = 'none';
        this.dom.focusView.style.display = 'flex';
        this.setFocusMode('practice');
        this.loadWord();
    }

    closeSessionAndReturnHub() {
        this.dom.focusView.style.display = 'none';
        this.dom.mainScreen.style.display = 'flex';
        this.renderHub();
    }

    updateWordList() {
        if (this.currentMode === 'letter') {
            const words = DB[this.currentLetter][`step${this.currentStep}`] || [];
            this.currentWordList = words.map(w => ({ word: w, clean: w.replace(/[-']/g, '').toLowerCase() }));
        } else if (this.currentMode === 'category') {
            const words = CATEGORIES[this.currentCategory][`step${this.currentStep}`] || [];
            this.currentWordList = words.map(w => ({ word: w, clean: w.replace(/[-']/g, '').toLowerCase() }));
        }
    }

    buildGlobalWordList(step) {
        const letters = Object.keys(DB);
        const list = [];
        letters.forEach(letter => {
            const words = DB[letter][`step${step}`] || [];
            words.forEach(w => {
                list.push({ letter, word: w, clean: w.replace(/[-']/g, '').toLowerCase() });
            });
        });
        return list;
    }

    loadWord() {
        if (!this.currentWordList || this.currentWordList.length === 0) {
            this.closeSessionAndReturnHub();
            return;
        }
        const wordObj = this.currentWordList[this.currentWordIdx];
        this.dom.stepLabel.textContent = `${this.currentStep}-BOSQICH`;
        const syls = wordObj.word.split('-');
        this.dom.wordBox.innerHTML = syls.map((s, i) => 
            `<span class="${i % 2 === 0 ? 'vocal' : 'consonant'}">${s}</span>`
        ).join('<span class="dash">-</span>');
        this.dom.hiddenInput.value = '';
        this.dom.textMirror.textContent = '';
        this.dom.mirrorField.classList.remove('match');
        this.dom.statusMsg.style.opacity = '0';
        this.dom.nextBtn.classList.remove('active');
        this.dom.cursor.style.display = 'inline-block';
        this.focusInput();
    }

    focusInput() {
        this.dom.hiddenInput.focus();
    }

    handleInputChange(e) {
        const val = e.target.value.toLowerCase();
        this.dom.textMirror.textContent = val;
        this.vibrate(20);
        const cleanTarget = this.currentWordList[this.currentWordIdx]?.clean || '';
        if (val.replace(/[\s'-]/g, '') === cleanTarget) {
            this.onCorrect();
        }
    }

    onCorrect() {
        this.playSuccess();
        this.vibrate(50);
        this.dom.mirrorField.classList.add('match');
        this.dom.cursor.style.display = 'none';
        this.dom.statusMsg.style.opacity = '1';
        this.dom.nextBtn.classList.add('active');
        this.dom.hiddenInput.blur();
        
        let earned = 10;
        if (this.currentMode === 'daily') earned = 50;
        this.state.xp += earned;
        this.updateHeaderStats();
        localStorage.setItem('xoleric_xp', this.state.xp);
        this.updateProgress();
        this.updateAchievements();
    }

    handleNextWord() {
        if (!this.dom.nextBtn.classList.contains('active')) return;
        if (this.currentMode === 'daily') {
            this.closeSessionAndReturnHub();
            return;
        }
        if (this.currentWordIdx + 1 < this.currentWordList.length) {
            this.currentWordIdx++;
        } else {
            if (this.currentStep < 6) {
                this.currentStep++;
                this.updateWordList();
                this.currentWordIdx = 0;
            } else {
                this.closeSessionAndReturnHub();
                return;
            }
        }
        this.saveLastSession();
        this.loadWord();
    }

    updateProgress() {
        if (this.currentMode === 'letter') {
            const totalSteps = 6;
            const wordsPerStep = 6;
            const totalWords = totalSteps * wordsPerStep;
            const completed = (this.currentStep - 1) * wordsPerStep + (this.currentWordIdx + 1);
            const percent = Math.floor((completed / totalWords) * 100);
            this.state.letterProgress[this.currentLetter] = percent;
            localStorage.setItem('xoleric_letterProgress', JSON.stringify(this.state.letterProgress));
        } else if (this.currentMode === 'category') {
            const totalWords = 36;
            const completed = (this.currentStep - 1) * 6 + (this.currentWordIdx + 1);
            const percent = Math.floor((completed / totalWords) * 100);
            this.state.categoryProgress[this.currentCategory] = percent;
            localStorage.setItem('xoleric_categoryProgress', JSON.stringify(this.state.categoryProgress));
        } else if (this.currentMode === 'global') {
            const totalWords = this.currentWordList.length;
            const completed = this.currentWordIdx + 1;
            const percent = Math.floor((completed / totalWords) * 100);
            this.state.globalProgress[`step${this.currentStep}`] = percent;
            localStorage.setItem('xoleric_globalProgress', JSON.stringify(this.state.globalProgress));
        }
    }

    updateAchievements() {
        if (!this.state.achievements.firstWord && this.state.xp > 0) {
            this.state.achievements.firstWord = true;
        }
        let totalWords = 0;
        Object.values(this.state.letterProgress).forEach(p => totalWords += Math.floor(p / 100 * 36));
        this.state.achievements.tenWords = totalWords;
        if (!this.state.achievements.hundredXP && this.state.xp >= 100) {
            this.state.achievements.hundredXP = true;
        }
        if (!this.state.achievements.streak3 && this.state.streak >= 3) {
            this.state.achievements.streak3 = true;
        }
        let allDone = true;
        Object.keys(DB).forEach(l => { if ((this.state.letterProgress[l] || 0) < 100) allDone = false; });
        if (allDone) this.state.achievements.allLetters = true;
        localStorage.setItem('xoleric_achievements', JSON.stringify(this.state.achievements));
        this.renderAchievements();
    }

    renderAchievements() {
        const ach = this.state.achievements;
        this.dom.achievementsGrid.innerHTML = `
            <div class="achievement-card">
                <div class="achievement-icon">🏆</div>
                <div class="achievement-title">Birinchi so'z</div>
                <div class="achievement-desc">Birinchi to'g'ri javob</div>
                <div class="achievement-progress"><div class="achievement-progress-fill" style="width: ${ach.firstWord ? 100 : 0}%"></div></div>
            </div>
            <div class="achievement-card">
                <div class="achievement-icon">🎯</div>
                <div class="achievement-title">10 ta so'z</div>
                <div class="achievement-desc">${ach.tenWords}/10</div>
                <div class="achievement-progress"><div class="achievement-progress-fill" style="width: ${Math.min(ach.tenWords / 10 * 100, 100)}%"></div></div>
            </div>
            <div class="achievement-card">
                <div class="achievement-icon">💯</div>
                <div class="achievement-title">100 XP</div>
                <div class="achievement-desc">100 ball to'plash</div>
                <div class="achievement-progress"><div class="achievement-progress-fill" style="width: ${Math.min(this.state.xp, 100) / 100 * 100}%"></div></div>
            </div>
            <div class="achievement-card">
                <div class="achievement-icon">🔥</div>
                <div class="achievement-title">3 kunlik streak</div>
                <div class="achievement-desc">${this.state.streak}/3</div>
                <div class="achievement-progress"><div class="achievement-progress-fill" style="width: ${Math.min(this.state.streak / 3 * 100, 100)}%"></div></div>
            </div>
            <div class="achievement-card">
                <div class="achievement-icon">🎓</div>
                <div class="achievement-title">Barcha harflar</div>
                <div class="achievement-desc">100% harflar</div>
                <div class="achievement-progress"><div class="achievement-progress-fill" style="width: ${ach.allLetters ? 100 : 0}%"></div></div>
            </div>
        `;
    }

    navigateView(view) {
        this.dom.navItems.forEach(n => n.classList.remove('active'));
        event.target.closest('.nav-item').classList.add('active');
        this.dom.hubView.style.display = view === 'hub' ? 'block' : 'none';
        this.dom.achievementsView.style.display = view === 'achievements' ? 'block' : 'none';
        this.dom.statsView.style.display = view === 'stats' ? 'block' : 'none';
        if (view === 'achievements') this.renderAchievements();
        if (view === 'stats') this.renderStats();
    }

    renderStats() {
        this.dom.statTotalXP.textContent = this.state.xp;
        this.dom.statStreak.textContent = this.state.streak;
        let totalWords = 0;
        Object.values(this.state.letterProgress).forEach(p => totalWords += Math.floor(p / 100 * 36));
        this.dom.statWordsLearned.textContent = totalWords;
        let lettersDone = 0;
        Object.keys(DB).forEach(l => { if ((this.state.letterProgress[l] || 0) >= 100) lettersDone++; });
        this.dom.statLettersDone.textContent = `${lettersDone}/${Object.keys(DB).length}`;
    }

    setFocusMode(mode) {
        this.state.focusMode = mode;
        this.dom.focusModeTabs.forEach(tab => tab.classList.remove('active'));
        this.dom.focusModeTabs.forEach(tab => {
            if (tab.dataset.focusmode === mode) tab.classList.add('active');
        });
        this.dom.practiceMode.style.display = mode === 'practice' ? 'flex' : 'none';
        this.dom.catalogMode.style.display = mode === 'catalog' ? 'flex' : 'none';
        if (mode === 'catalog') this.renderCatalog();
    }

    renderCatalog() {
        const step = this.currentStep;
        let words = [];
        if (this.currentMode === 'global') {
            const letters = Object.keys(DB);
            letters.forEach(letter => {
                const stepWords = DB[letter][`step${step}`] || [];
                stepWords.forEach(w => words.push({ letter, word: w }));
            });
        } else if (this.currentMode === 'letter') {
            const stepWords = DB[this.currentLetter][`step${step}`] || [];
            stepWords.forEach(w => words.push({ letter: this.currentLetter, word: w }));
        } else if (this.currentMode === 'category') {
            const stepWords = CATEGORIES[this.currentCategory][`step${step}`] || [];
            stepWords.forEach(w => words.push({ category: this.currentCategory, word: w }));
        }
        this.dom.catalogStepLabel.textContent = `${step}-bosqich (${words.length} ta so'z)`;
        this.dom.catalogGrid.innerHTML = '';
        words.forEach((item, idx) => {
            const tile = document.createElement('div');
            tile.className = 'word-tile';
            tile.textContent = item.word;
            tile.addEventListener('click', () => {
                const foundIdx = this.currentWordList.findIndex(w => w.word === item.word);
                if (foundIdx !== -1) {
                    this.currentWordIdx = foundIdx;
                    this.setFocusMode('practice');
                    this.loadWord();
                }
            });
            this.dom.catalogGrid.appendChild(tile);
        });
    }

    navigatePrevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateWordList();
            this.renderCatalog();
        }
    }

    navigateNextStep() {
        if (this.currentStep < 6) {
            this.currentStep++;
            this.updateWordList();
            this.renderCatalog();
        }
    }

    saveLastSession() {
        if (this.currentMode === 'letter') {
            localStorage.setItem('xoleric_lastMode', 'letter');
            localStorage.setItem('xoleric_lastLetter', this.currentLetter);
            localStorage.setItem('xoleric_lastStep', this.currentStep);
            localStorage.setItem('xoleric_lastWordIdx', this.currentWordIdx);
        } else if (this.currentMode === 'category') {
            localStorage.setItem('xoleric_lastMode', 'category');
            localStorage.setItem('xoleric_lastCategory', this.currentCategory);
            localStorage.setItem('xoleric_lastCategoryStep', this.currentStep);
            localStorage.setItem('xoleric_lastCategoryIndex', this.currentWordIdx);
        } else if (this.currentMode === 'global') {
            localStorage.setItem('xoleric_lastMode', 'global');
            localStorage.setItem('xoleric_lastGlobalStep', this.currentStep);
            localStorage.setItem('xoleric_lastGlobalIndex', this.currentWordIdx);
        }
    }

    checkStreak() {
        const today = new Date().toDateString();
        if (this.state.lastPlayDate === today) return;
        if (this.state.lastPlayDate === new Date(Date.now() - 86400000).toDateString()) {
            this.state.streak++;
        } else {
            this.state.streak = 1;
        }
        this.state.lastPlayDate = today;
        localStorage.setItem('xoleric_streak', this.state.streak);
        localStorage.setItem('xoleric_lastDate', today);
    }

    generateDailyChallenge() {
        const letters = Object.keys(DB);
        const randomLetter = letters[Math.floor(Math.random() * letters.length)];
        const steps = [1, 2, 3, 4, 5, 6];
        const randomStep = steps[Math.floor(Math.random() * steps.length)];
        const words = DB[randomLetter][`step${randomStep}`];
        const randomWord = words[Math.floor(Math.random() * words.length)];
        this.state.dailyChallenge = { word: randomWord, clean: randomWord.replace(/[-']/g, '').toLowerCase() };
        this.dom.dailyWordPreview.textContent = randomWord;
    }

    updateHeaderStats() {
        this.dom.xpDisplay.textContent = this.state.xp;
        this.dom.streakDisplay.textContent = this.state.streak;
    }

    vibrate(ms) {
        if (navigator.vibrate) navigator.vibrate(ms);
    }

    playSuccess() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            gain.gain.value = 0.1;
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.setValueAtTime(523, audioCtx.currentTime);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.1);
            setTimeout(() => {
                osc.frequency.setValueAtTime(659, audioCtx.currentTime);
            }, 80);
            setTimeout(() => {
                osc.frequency.setValueAtTime(783, audioCtx.currentTime);
            }, 160);
        } catch (e) {}
    }

    speakCurrentWord() {
        if (this.currentWordList[this.currentWordIdx]) {
            const word = this.currentWordList[this.currentWordIdx].word.replace(/-/g, '');
            const utter = new SpeechSynthesisUtterance(word);
            utter.lang = 'uz-UZ';
            speechSynthesis.speak(utter);
        }
    }
}

async function requestFullAccess() {
    try {
        if (!document.fullscreenElement) {
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
            } else if (document.documentElement.webkitRequestFullscreen) {
                await document.documentElement.webkitRequestFullscreen();
            }
        }
        history.pushState(null, null, location.href);
        document.getElementById('guardOverlay').style.display = 'none';
    } catch (e) {}
}

document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && !document.webkitIsFullScreen) {
        document.getElementById('guardOverlay').style.display = 'flex';
    }
});

window.addEventListener('popstate', () => {
    requestFullAccess();
});

const app = new XolericApp();

window.requestFullAccess = requestFullAccess;
window.startDailyChallenge = () => app.startDailyChallenge();
window.startGlobalMode = () => app.startGlobalMode();
window.handleNext = () => app.handleNextWord();
