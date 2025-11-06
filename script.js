// time (display updated every second, includes seconds)
updateClock();
setInterval(updateClock, 1000);

function updateClock(){
    // request full date+time with seconds
    date.textContent = time(true);
}

// player name (will be requested on load and required)
let playerName = "";

// global variables/constants
let score, answer, level;
const levelArr = document.getElementsByName("level");
const scoreArr = [];
// timer elements and state
const roundTimeEl = document.getElementById('roundTime');
const fastestTimeEl = document.getElementById('fastestTime');
// history of round times and avg display
const timeArr = [];
const avgTimeEl = document.getElementById('avgTime');
let roundStartTime = null;
let roundTimerInterval = null;
let fastestTimeMs = null; // best (lowest) elapsed ms

function formatDuration(ms){
    if(ms == null) return '--';
    const s = ms/1000;
    return s.toFixed(2) + 's';
}

// helper: normalize and Title Case a name, preserving hyphens and apostrophes
function normalizeName(raw){
    if(!raw) return "";
    // trim and collapse spaces
    raw = raw.trim().replace(/\s+/g, " ");
    // split words by space
    const words = raw.split(' ');
    const norm = words.map(word => {
        // keep separators '-' and '\'' and capitalize parts
        const parts = word.split(/([-'])/);
        return parts.map(p => {
            if(p === '-' || p === "'") return p;
            return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
        }).join('');
    });
    return norm.join(' ');
}
// On-page name modal elements (DOM available because script is deferred)
const nameModal = document.getElementById('nameModal');
const nameInput = document.getElementById('nameInput');
const nameSubmit = document.getElementById('nameSubmit');
const nameError = document.getElementById('nameError');

function showNameModal(){
    if(nameModal) nameModal.style.display = 'flex';
    if(nameInput){
        nameInput.value = '';
        nameInput.focus();
        nameError.textContent = '';
    }
}

function hideNameModal(){
    if(nameModal) nameModal.style.display = 'none';
}

function submitName(){
    const input = nameInput ? nameInput.value.trim() : '';
    if(!input){
        if(nameError) nameError.textContent = 'Name is required.';
        if(nameInput) nameInput.focus();
        return;
    }
    playerName = normalizeName(input);
    // personalize UI
    msg.className = '';
    msg.textContent = playerName + ", Select a Level";
    wins.textContent = playerName + " — Total wins: " + scoreArr.length;
    avgScore.textContent = playerName + " — Average Score: ";
    hideNameModal();
}

// wire modal events
if(nameSubmit){
    nameSubmit.addEventListener('click', submitName);
}
if(nameInput){
    nameInput.addEventListener('keydown', function(e){
        if(e.key === 'Enter') submitName();
    });
}

// event listeners (set up after acquiring name to ensure personalization is ready)
playBtn.addEventListener("click", play);
guessBtn.addEventListener("click", makeGuess);
giveUpBtn.addEventListener("click", giveUp);

function time(includeTime){
    const d = new Date();
    const monthNames = [
        'January','February','March','April','May','June',
        'July','August','September','October','November','December'
    ];
    const day = d.getDate();
    const suffix = getOrdinalSuffix(day);
    let out = monthNames[d.getMonth()] + ' ' + day + suffix + ', ' + d.getFullYear();
    if(includeTime){
        const hh = String(d.getHours()).padStart(2,'0');
        const mm = String(d.getMinutes()).padStart(2,'0');
        const ss = String(d.getSeconds()).padStart(2,'0');
        out += ' ' + hh + ':' + mm + ':' + ss;
    }
    return out;
}

// return ordinal suffix for a day number (1 -> 'st', 2 -> 'nd', 3 -> 'rd', 4 -> 'th', etc.)
function getOrdinalSuffix(day){
    const j = day % 10,
          k = day % 100;
    if(k >= 11 && k <= 13) return 'th';
    if(j === 1) return 'st';
    if(j === 2) return 'nd';
    if(j === 3) return 'rd';
    return 'th';
}

function play(){
    playBtn.disabled = true;
    guessBtn.disabled = false;
    guess.disabled = false;
    for(let i=0; i<levelArr.length; i++){
        levelArr[i].disabled = true;
        if(levelArr[i].checked){
            level = levelArr[i].value;
        }
    }

    answer = Math.floor(Math.random()*level)+1;
    msg.className = '';
    msg.textContent = playerName + ", Guess a number between 1-" + level;
    guess.placeholder = answer;
    score = 0;
    // enable Give Up while playing
    if(typeof giveUpBtn !== 'undefined') giveUpBtn.disabled = false;
    // start per-round timer
    roundStartTime = Date.now();
    if(roundTimerInterval) clearInterval(roundTimerInterval);
    if(roundTimeEl) roundTimeEl.textContent = playerName + ' — Round time: ' + formatDuration(0);
    roundTimerInterval = setInterval(()=>{
        if(roundStartTime){
            const elapsed = Date.now() - roundStartTime;
            if(roundTimeEl) roundTimeEl.textContent = playerName + ' — Round time: ' + formatDuration(elapsed);
        }
    }, 100);
}

function makeGuess(){
    let userGuess = parseInt(guess.value);
    if(isNaN(userGuess) || userGuess < 1 || userGuess > level){
        msg.className = '';
        msg.textContent = playerName + ", INVALID: guess a number between 1 and " + level + "!";
        return;
    }
    score++;
    // proximity feedback based on absolute difference
    const diff = Math.abs(userGuess - answer);
    const proximity = getProximity(diff, parseInt(level) || 1);

    if (userGuess > answer){
        // colored proximity + emoji
        const k = proximity.toLowerCase().replace(/\s+/g,'-');
        const map = {
            'scorching': ['🔥🔥','Scorching'],
            'boiling': ['🥵','Boiling'],
            'very-hot': ['🌡️','Very hot'],
            'hot': ['🔥','Hot'],
            'warm': ['🌤️','Warm'],
            'cold': ['🧊','Cold'],
            'ice-cold': ['❄️','Ice cold']
        };
        const entry = map[k] || ['',''+proximity];
        msg.className = 'prox-' + k;
        msg.innerHTML = `${playerName}, ${entry[0]} ${entry[1]}. Try again!`;
    }
    else if (userGuess < answer){
        const k = proximity.toLowerCase().replace(/\s+/g,'-');
        const map = {
            'scorching': ['🔥🔥','Scorching'],
            'boiling': ['🥵','Boiling'],
            'very-hot': ['🌡️','Very hot'],
            'hot': ['🔥','Hot'],
            'warm': ['🌤️','Warm'],
            'cold': ['🧊','Cold'],
            'ice-cold': ['❄️','Ice cold']
        };
        const entry = map[k] || ['',''+proximity];
        msg.className = 'prox-' + k;
        msg.innerHTML = `${playerName}, ${entry[0]} ${entry[1]}. Try again!`;
    }
    else{
        msg.className = '';
        msg.textContent = playerName + ", Correct! It took " + score + " tries.";
        // finalize timer and record elapsed
        const elapsed = roundStartTime ? (Date.now() - roundStartTime) : 0;
        timeArr.push(elapsed);
        // update fastest
        if(fastestTimeMs == null || elapsed < fastestTimeMs){
            fastestTimeMs = elapsed;
            if(fastestTimeEl) fastestTimeEl.textContent = 'Fastest: ' + formatDuration(fastestTimeMs);
        }
        reset();
        updateScore();
    }
}

// return a proximity label for a difference and the current level/range
function getProximity(diff, lvl){
    // normalize inputs
    if(diff <= 0) return 'Scorching';
    const level = Math.max(1, parseInt(lvl) || 1);
    const ratio = diff / level; // 0..1+

    // thresholds tuned to give meaningful feedback across ranges
    if(diff <= 1 || ratio <= 0.02) return 'scorching'; // extremely close
    if(diff <= 2 || ratio <= 0.05) return 'boiling';
    if(ratio <= 0.10) return 'very hot';
    if(ratio <= 0.20) return 'hot';
    if(ratio <= 0.40) return 'warm';
    if(ratio <= 0.70) return 'cold';
    return 'ice cold';
}

// Rate a raw score relative to the current level/range
function rateScore(sc, lvl){
    const scoreNum = Math.max(0, parseInt(sc) || 0);
    const levelNum = Math.max(1, parseInt(lvl) || 1);
    const ratio = scoreNum / levelNum; // 0 is best, 1+ is worst

    // Lower score is better. thresholds tuned to be meaningful across ranges.
    if(ratio <= 0.10 || scoreNum <= Math.max(1, Math.ceil(levelNum*0.05))) return 'Excellent';
    if(ratio <= 0.25) return 'Good';
    if(ratio <= 0.50) return 'OK';
    if(ratio <= 0.80) return 'Bad';
    return 'Terrible';
}

function giveUp(){
    // set score to the range (level) and reveal answer
    const range = parseInt(level) || 0;
    score = range;
    msg.className = '';
    msg.textContent = playerName + ", you gave up. The answer was " + answer + ". Your score is " + score + ".";
    // finalize timer and record elapsed (give-up counts as a completed round)
    const elapsed = roundStartTime ? (Date.now() - roundStartTime) : 0;
    timeArr.push(elapsed);
    if(fastestTimeMs == null || elapsed < fastestTimeMs){
        fastestTimeMs = elapsed;
        if(fastestTimeEl) fastestTimeEl.textContent = 'Fastest: ' + formatDuration(fastestTimeMs);
    }
    // finalize round
    reset();
    updateScore();
}

function reset(){
    guessBtn.disabled = true;
    guess.value = "";
    guess.placeholder = "";
    guess.disabled = true;
    playBtn.disabled = false;
    if(typeof giveUpBtn !== 'undefined') giveUpBtn.disabled = true;
    // stop and clear the round timer
    if(roundTimerInterval){
        clearInterval(roundTimerInterval);
        roundTimerInterval = null;
    }
    roundStartTime = null;
    for(let i =0; i<levelArr.length; i++){
        levelArr[i].disabled = false;
    }
}

function updateScore(){
    scoreArr.push(score); //adds current score to array of scores
    wins.textContent = playerName + " — Total wins: " + scoreArr.length;
    let sum = 0;
    scoreArr.sort((a,b) => a-b); //sorts ascending
    //leaderboard?
    const lb = document.getElementsByName("leaderboard");

    for(let i=0; i<scoreArr.length; i++){
        sum+= scoreArr[i];
        if(i < lb.length){
            lb[i].textContent = scoreArr[i];
        }
    }
    let avg = sum/scoreArr.length;
    avgScore.textContent = playerName + " — Average Score: " + avg.toFixed(2);
    // show per-round performance rating (based on last score & current level)
    try{
        if(typeof rating !== 'undefined'){
            const label = rateScore(score, level);
            rating.textContent = playerName + " — Performance: " + label;
        }
    }catch(e){
        // ignore if rating element isn't present
    }
    // average time across all completed rounds
    try{
        if(timeArr.length > 0 && typeof avgTimeEl !== 'undefined' && avgTimeEl !== null){
            let sumTime = 0;
            for(let t of timeArr) sumTime += t;
            const avgMs = sumTime / timeArr.length;
            avgTimeEl.textContent = playerName + " — Average Time: " + formatDuration(avgMs);
        } else if(typeof avgTimeEl !== 'undefined' && avgTimeEl !== null){
            avgTimeEl.textContent = 'Average time: --';
        }
    }catch(e){
        // ignore if avgTime element missing
    }
}

// show on-page name modal on load
showNameModal();
