// --- DOM Elements ---
const allDOM = {
    loadingScreen: document.getElementById('loading-screen'), menuScreen: document.getElementById('menu-screen'), gameScreen: document.getElementById('game-screen'), resultsScreen: document.getElementById('results-screen'),
    startBtn: document.getElementById('start-btn'), retryBtn: document.getElementById('retry-btn'), muteBtn: document.getElementById('mute-btn'), 
    infoBtn: document.getElementById('info-btn'), infoModal: document.getElementById('info-modal'), closeInfoBtn: document.getElementById('close-info-btn'), gameModeBtns: document.getElementById('game-mode-btns'),
    scoreGoalSetting: document.getElementById('score-goal-setting'), scoreGoalInput: document.getElementById('score-goal-input'), difficultyBtns: document.getElementById('difficulty-btns'), colorPicker: document.getElementById('color-picker'),
    customColorInput: document.getElementById('custom-color-input'), movementBtns: document.getElementById('movement-btns'), targetTextInput: document.getElementById('target-text-input'),
    targetTextColorInput: document.getElementById('target-text-color-input'), bgColorInput: document.getElementById('bg-color-input'), bgImageInput: document.getElementById('bg-image-input'), removeBgImageBtn: document.getElementById('remove-bg-image-btn'),
    pointsModeBtns: document.getElementById('points-mode-btns'), pointsFixedContainer: document.getElementById('points-fixed-container'), pointsRangeContainer: document.getElementById('points-range-container'),
    pointsFixedInput: document.getElementById('points-fixed-input'), pointsRangeMinInput: document.getElementById('points-range-min-input'), pointsRangeMaxInput: document.getElementById('points-range-max-input'),
    sizeSlider: document.getElementById('target-size-slider'), sizeValue: document.getElementById('target-size-value'), countSlider: document.getElementById('target-count-slider'), countValue: document.getElementById('target-count-value'),
    spawnSlider: document.getElementById('spawn-rate-slider'), spawnValue: document.getElementById('spawn-rate-value'), lifespanSlider: document.getElementById('lifespan-slider'), lifespanValue: document.getElementById('lifespan-value'),
    timeLabel: document.getElementById('time-label'), timeDisplay: document.getElementById('time-display'), scoreDisplay: document.getElementById('score-display'), accuracyDisplay: document.getElementById('accuracy-display'),
    streakDisplay: document.getElementById('streak-display'), finalScore: document.getElementById('final-score'), highScoreSub: document.getElementById('high-score-sub'),
    finalEffectiveness: document.getElementById('final-effectiveness'), finalEffectivenessSub: document.getElementById('final-effectiveness-sub'),
    finalAccuracy: document.getElementById('final-accuracy'), finalAccuracySub: document.getElementById('final-accuracy-sub')
};

let settings = {}; let gameState = {}; let intervals = {}; let targets = new Map(); let isMuted = false;

const hitSound = new Audio("data:audio/wav;base64,UklGRkIAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABgAZGF0YSoAAACY/7D/uv+9/7v/tP+w/6T/mP+M/4f/hf+G/4b/h/+H/4j/kP+X/5//p/+t/7T/uv++/8L/wv/D/8T/xP/E/8P/wv/B/7//t/+p/6D/l/+P/4r/iP+H/4X/hP98/2j/Y/9P/0c/Pz83LSUfDQ==");
const missSound = new Audio("data:audio/wav;base64,UklGRkQBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABgAZGF0YewAAAAAgP5Q/3D/iv6Y/7D/EP9Y/17/iP80/13/Tf9h/yD/Uf9Y/3H/Ef9H/17/SP8g/3H/OP9N/2H/mv6Q/5j+EP+w/4r+cP9Q/w==");
hitSound.volume = 0.5; missSound.volume = 0.3;

const presets = {
    easy: { size: 80, count: 2, spawn: 1200, lifespan: 5000, movement: 'static' },
    medium: { size: 50, count: 3, spawn: 1000, lifespan: 3000, movement: 'static' },
    hard: { size: 30, count: 5, spawn: 700, lifespan: 2000, movement: 'slow' }
};

function setupEventListeners() {
    allDOM.startBtn.addEventListener('click', startGame);
    allDOM.retryBtn.addEventListener('click', () => { allDOM.resultsScreen.classList.add('hidden'); allDOM.menuScreen.classList.remove('hidden'); });
    allDOM.muteBtn.addEventListener('click', () => { isMuted = !isMuted; allDOM.muteBtn.classList.toggle('muted', isMuted); });
    allDOM.infoBtn.addEventListener('click', () => allDOM.infoModal.classList.remove('hidden'));
    allDOM.closeInfoBtn.addEventListener('click', () => allDOM.infoModal.classList.add('hidden'));
    allDOM.infoModal.addEventListener('click', (e) => { if (e.target === allDOM.infoModal) allDOM.infoModal.classList.add('hidden'); });

    const handleButtonClick = (group, callback) => {
        group.addEventListener('click', e => {
            if (e.target.tagName === 'BUTTON') {
                [...group.children].forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                if (callback) callback(e.target);
            }
        });
    };

    handleButtonClick(allDOM.gameModeBtns, target => allDOM.scoreGoalSetting.classList.toggle('hidden-setting', target.dataset.mode !== 'score_rush'));
    handleButtonClick(allDOM.difficultyBtns, target => applyDifficulty(target.dataset.difficulty));
    handleButtonClick(allDOM.movementBtns);
    handleButtonClick(allDOM.pointsModeBtns, target => {
        const mode = target.dataset.mode;
        allDOM.pointsFixedContainer.classList.toggle('hidden-setting', mode !== 'fixed');
        allDOM.pointsRangeContainer.classList.toggle('hidden-setting', mode !== 'range');
    });
    allDOM.colorPicker.addEventListener('click', e => {
        const target = e.target.closest('.color-option');
        if (!target) return;
        if (allDOM.colorPicker.querySelectorAll('.active').length === 1 && target.classList.contains('active')) return; 
        target.classList.toggle('active');
    });
    allDOM.bgColorInput.addEventListener('input', e => { document.body.style.backgroundColor = e.target.value; });
    allDOM.removeBgImageBtn.addEventListener('click', () => { document.body.style.backgroundImage = 'none'; allDOM.bgImageInput.value = ''; });
    allDOM.bgImageInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => { document.body.style.backgroundImage = `url('${event.target.result}')`; };
            reader.readAsDataURL(file);
        }
    });
    allDOM.gameScreen.addEventListener('mousedown', e => { if (!e.target.closest('.target')) handleMiss(e); });
    allDOM.sizeSlider.addEventListener('input', () => allDOM.sizeValue.textContent = `${allDOM.sizeSlider.value}px`);
    allDOM.countSlider.addEventListener('input', () => allDOM.countValue.textContent = allDOM.countSlider.value);
    allDOM.spawnSlider.addEventListener('input', () => allDOM.spawnValue.textContent = `${allDOM.spawnSlider.value}ms`);
    allDOM.lifespanSlider.addEventListener('input', () => allDOM.lifespanValue.textContent = `${allDOM.lifespanSlider.value}ms`);
}

// --- GAME LOGIC ---
function applyDifficulty(level) {
    const p = presets[level];
    allDOM.sizeSlider.value = p.size; allDOM.countSlider.value = p.count; allDOM.spawnSlider.value = p.spawn; allDOM.lifespanSlider.value = p.lifespan;
    allDOM.sizeValue.textContent = `${p.size}px`; allDOM.countValue.textContent = p.count;
    allDOM.spawnValue.textContent = `${p.spawn}ms`; allDOM.lifespanValue.textContent = `${p.lifespan}ms`;
    [...allDOM.movementBtns.children].forEach(btn => { btn.classList.remove('active'); if(btn.dataset.movement === p.movement) btn.classList.add('active'); });
}

function updateSettings() {
    const activeColorElements = allDOM.colorPicker.querySelectorAll('.active');
    const targetColors = [...activeColorElements].map(el => el.id === 'custom-color-picker-wrapper' ? allDOM.customColorInput.value : el.dataset.color);
    settings = {
        mode: allDOM.gameModeBtns.querySelector('.active').dataset.mode, scoreGoal: parseInt(allDOM.scoreGoalInput.value) || 5000,
        targetColors: targetColors.length > 0 ? targetColors : ['#ff0055'], targetSize: parseInt(allDOM.sizeSlider.value), maxTargets: parseInt(allDOM.countSlider.value),
        spawnRate: parseInt(allDOM.spawnSlider.value), lifespan: parseInt(allDOM.lifespanSlider.value), movement: allDOM.movementBtns.querySelector('.active').dataset.movement, targetText: allDOM.targetTextInput.value,
        targetTextColor: allDOM.targetTextColorInput.value, pointsMode: allDOM.pointsModeBtns.querySelector('.active').dataset.mode, pointsFixed: parseInt(allDOM.pointsFixedInput.value) || 1,
        pointsRangeMin: parseInt(allDOM.pointsRangeMinInput.value) || 50, pointsRangeMax: parseInt(allDOM.pointsRangeMaxInput.value) || 150
    };
}

function startGame() {
    updateSettings(); resetGameState();
    allDOM.menuScreen.classList.add('hidden'); allDOM.gameScreen.classList.remove('hidden');
    intervals.spawn = setInterval(spawnTarget, settings.spawnRate);
    if (settings.movement !== 'static') intervals.move = requestAnimationFrame(moveTargets);
    if(settings.mode === 'timed' || settings.mode === 'classic') intervals.timer = setInterval(gameLoop, 1000);
    gameLoop();
}

function endGame() {
    clearInterval(intervals.spawn); clearInterval(intervals.timer);
    if (intervals.move) cancelAnimationFrame(intervals.move);
    intervals = {};
    targets.forEach(t => t.element.remove()); targets.clear();
    saveProgress(gameState.score);
    allDOM.gameScreen.classList.add('hidden'); 
    allDOM.resultsScreen.classList.remove('hidden');
    showResults();
}

function resetGameState() {
    gameState = {
        score: 0, time: settings.mode === 'timed' || settings.mode === 'classic' ? 60 : 0, hits: 0,
        misses: 0, clicks: 0, targetsSpawned: 0, targetsToHit: settings.mode === 'accuracy' ? 30 : Infinity,
        streak: 0, isOver: false,
    };
    updateHUD();
}

function gameLoop() {
    if (gameState.isOver) return;
    if (settings.mode === 'timed' || settings.mode === 'classic') {
        gameState.time--;
        if (gameState.time <= 0) { gameState.isOver = true; endGame(); }
    }
    updateHUD();
}

function updateHUD() {
    allDOM.scoreDisplay.textContent = gameState.score;
    const timeLabel = allDOM.timeLabel;
    if (settings.mode === 'timed' || settings.mode === 'classic') {
        timeLabel.textContent = 'Время';
        allDOM.timeDisplay.textContent = gameState.time;
    } else if (settings.mode === 'accuracy') { 
        timeLabel.textContent = 'Цели';
        allDOM.timeDisplay.textContent = `${gameState.hits}/${gameState.targetsToHit}`;
    } else if (settings.mode === 'score_rush') { 
        timeLabel.textContent = 'Цель';
        allDOM.timeDisplay.textContent = `${gameState.score} / ${settings.scoreGoal}`;
    } else {
        timeLabel.textContent = 'Время';
        allDOM.timeDisplay.textContent = '∞';
    }
    const accuracy = gameState.clicks === 0 ? 100 : (gameState.hits / gameState.clicks) * 100;
    allDOM.accuracyDisplay.textContent = `${Math.round(accuracy)}%`;
    allDOM.streakDisplay.classList.toggle('visible', gameState.streak > 1);
    if (gameState.streak > 1) allDOM.streakDisplay.textContent = `СЕРИЯ: ${gameState.streak}x`;
}

function showResults() {
    const accuracy = gameState.clicks === 0 ? 100 : (gameState.hits / gameState.clicks) * 100;
    const effectiveness = gameState.targetsSpawned === 0 ? 0 : (gameState.hits / gameState.targetsSpawned) * 100;
    allDOM.finalScore.textContent = gameState.score;
    allDOM.finalEffectiveness.textContent = `${Math.round(effectiveness)}%`;
    allDOM.finalEffectivenessSub.textContent = `${gameState.hits} из ${gameState.targetsSpawned} мишеней`;
    allDOM.finalAccuracy.textContent = `${Math.round(accuracy)}%`;
    allDOM.finalAccuracySub.textContent = `${gameState.hits} из ${gameState.clicks} кликов`;
    const highScore = getHighScore(settings.mode);
    if (highScore > 0) {
         allDOM.highScoreSub.textContent = `Рекорд: ${highScore}`;
    } else {
         allDOM.highScoreSub.textContent = '';
    }
}

function getHighScore(mode) {
    try {
        const highScores = JSON.parse(localStorage.getItem('aimTrainerHighScores')) || {};
        return highScores[mode] || 0;
    } catch (e) { return 0; }
}

function setHighScore(mode, score) {
    try {
        const highScores = JSON.parse(localStorage.getItem('aimTrainerHighScores')) || {};
        highScores[mode] = score;
        localStorage.setItem('aimTrainerHighScores', JSON.stringify(highScores));
    } catch (e) { console.error("Failed to save high score to localStorage", e); }
}

function saveProgress(score) {
    const currentHighScore = getHighScore(settings.mode);
    if (score > currentHighScore) {
        setHighScore(settings.mode, score);
    }
}

document.addEventListener('DOMContentLoaded', () => { 
    allDOM.loadingScreen.classList.add('hidden');
    allDOM.menuScreen.classList.remove('hidden');
    setupEventListeners();
    applyDifficulty('medium');
});

function spawnTarget(){if(targets.size>=settings.maxTargets||gameState.isOver)return;gameState.targetsSpawned++;const e=Date.now()+Math.random(),t=document.createElement("div"),a=settings.targetColors[Math.floor(Math.random()*settings.targetColors.length)];t.className="target",Object.assign(t.style,{width:`${settings.targetSize}px`,height:`${settings.targetSize}px`,backgroundColor:a,boxShadow:`0 0 15px ${a}`,borderColor:a});if(settings.targetText){const e=document.createElement("span");e.textContent=settings.targetText,Object.assign(e.style,{color:settings.targetTextColor,fontWeight:"900",fontSize:`${Math.max(10,.4*settings.targetSize)}px`,pointerEvents:"none"}),t.appendChild(e)}const{width:n,height:o}=allDOM.gameScreen.getBoundingClientRect(),r=Math.random()*(n-settings.targetSize),s=Math.random()*(o-settings.targetSize);t.style.left=`${r}px`,t.style.top=`${s}px`,t.addEventListener("mousedown",t=>handleHit(t,e));let i=0,l=0;if("static"!==settings.movement){const e={slow:2,medium:4,fast:7}[settings.movement],t=2*Math.random()*Math.PI;i=Math.cos(t)*e,l=Math.sin(t)*e}const c=setTimeout(()=>{targets.has(e)&&targets.get(e).element.classList.add("shrinking")},settings.lifespan-500),d=setTimeout(()=>removeTarget(e,"missed"),settings.lifespan);targets.set(e,{element:t,x:r,y:s,dx:i,dy:l,lifeTimer:d,shrinkTimer:c}),allDOM.gameScreen.appendChild(t)}
function moveTargets(){if(gameState.isOver)return;const{width:e,height:t}=allDOM.gameScreen.getBoundingClientRect();targets.forEach(a=>{if(0===a.dx&&0===a.dy)return;a.x+=a.dx,a.y+=a.dy,(a.x<=0||a.x>=e-settings.targetSize)&&(a.dx*=-1),(a.y<=0||a.y>=t-settings.targetSize)&&(a.dy*=-1),a.element.style.left=`${a.x}px`,a.element.style.top=`${a.y}px`}),intervals.move=requestAnimationFrame(moveTargets)}
function removeTarget(e,t){const a=targets.get(e);a&&(clearTimeout(a.lifeTimer),clearTimeout(a.shrinkTimer),"hit"===t?a.element.classList.add("hit"):"missed"===(gameState.misses++,gameState.streak=0,updateHUD()),setTimeout(()=>{a.element.remove()},200),targets.delete(e))}
function calculateBasePoints(){switch(settings.pointsMode){case"range":const e=Math.min(settings.pointsRangeMin,settings.pointsRangeMax),t=Math.max(settings.pointsRangeMin,settings.pointsRangeMax);return Math.floor(Math.random()*(t-e+1))+e;case"random":return Math.floor(91*Math.random())+10;case"fixed":default:return settings.pointsFixed}}
function handleHit(e,t){e.stopPropagation();if(!targets.has(t)||gameState.isOver)return;isMuted||(hitSound.currentTime=0,hitSound.play());gameState.hits++,gameState.clicks++,gameState.streak++;const o=calculateBasePoints();gameState.score+=o,showFloatingText(`+${o}`,e.clientX,e.clientY,"#00ff55"),removeTarget(t,"hit"),updateHUD(),("accuracy"===settings.mode&&gameState.hits>=gameState.targetsToHit||"score_rush"===settings.mode&&gameState.score>=settings.scoreGoal)&&(gameState.isOver=!0,endGame())}
function handleMiss(e){if(gameState.isOver)return;isMuted||(missSound.currentTime=0,missSound.play());gameState.clicks++;gameState.streak=0;const t=calculateBasePoints();gameState.score=Math.max(0,gameState.score-t);showFloatingText(`-${t}`,e.clientX,e.clientY,"#ff4444");updateHUD()}
function showFloatingText(e,t,a,n){const o=document.createElement("div");o.className="floating-text",o.textContent=e,Object.assign(o.style,{left:`${t}px`,top:`${a}px`,color:n}),document.body.appendChild(o),setTimeout(()=>o.remove(),1e3)}