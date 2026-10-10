// Edit visible invitation details in index.html and this event time together.
const eventTime=new Date('2026-10-25T09:30:00+05:30').getTime();
const gujaratiDigits='૦૧૨૩૪૫૬૭૮૯';
const toGujarati=value=>String(value).padStart(2,'0').replace(/[0-9]/g,d=>gujaratiDigits[Number(d)]);
function updateCountdown(){const remaining=Math.max(0,eventTime-Date.now());const total=Math.floor(remaining/1000);const values={days:Math.floor(total/86400),hours:Math.floor(total%86400/3600),minutes:Math.floor(total%3600/60),seconds:total%60};Object.entries(values).forEach(([id,value])=>{document.getElementById(id).textContent=toGujarati(value);});if(remaining===0){document.getElementById('countdown-title').textContent=Date.now()<eventTime+86400000?'આજે શુભ પ્રસંગનો દિવસ છે!':'આ શુભ પ્રસંગની સુંદર યાદો...';}}
updateCountdown();setInterval(updateCountdown,1000);
const scene=document.querySelector('.invitation-scene');const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
function respectMotion(){document.body.classList.toggle('motion-off',reducedMotion.matches);}
respectMotion();reducedMotion.addEventListener('change',respectMotion);
scene.addEventListener('pointermove',event=>{if(reducedMotion.matches||event.pointerType!=='mouse')return;const rect=scene.getBoundingClientRect();scene.style.setProperty('--move-x',((event.clientX-rect.left)/rect.width-.5)*8+'px');scene.style.setProperty('--move-y',((event.clientY-rect.top)/rect.height-.5)*6+'px');});scene.addEventListener('pointerleave',()=>{scene.style.setProperty('--move-x','0px');scene.style.setProperty('--move-y','0px');});
if('IntersectionObserver' in window&&!reducedMotion.matches){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('revealed');observer.unobserve(entry.target);}}),{threshold:.12});document.querySelectorAll('.event-panel,.venue-panel,.countdown-section,.family').forEach(el=>{el.classList.add('reveal');observer.observe(el);});}

// Random background music; no visible music controls.
const musicTracks = [
    './assets/music/track-1.mp3',
    './assets/music/track-2.mp3'
];
const music = document.getElementById('background-music');
const video = document.getElementById('intro-video');
const intro = document.getElementById('intro-screen');
let trackIndex = Math.floor(Math.random()*musicTracks.length);
music.volume = 0.6;
music.muted = false;
music.loop = true;
music.src = musicTracks[trackIndex];
music.load();
let introFinished = false;

// Mobile browsers may require click/touchend rather than pointerdown.
const unlockEvents = ['click', 'touchend', 'keydown'];
let playbackStarted = false;
const audioHint = document.createElement('div');
audioHint.setAttribute('role', 'status');
audioHint.style.cssText = 'position:fixed;bottom:22px;left:50%;transform:translateX(-50%);z-index:50;background:rgba(40,24,14,.9);color:#fff4df;padding:10px 18px;border-radius:20px;font:16px Gujarati,serif;text-align:center;max-width:90vw;pointer-events:none';
audioHint.hidden = true;
document.body.appendChild(audioHint);
function showAudioHint(message) { audioHint.textContent = message; audioHint.hidden = false; }

const failedTracks = new Set();
function reportAudioProblem(error) {
    console.warn('[Invitation music]', error.name || 'MediaError', error.message || error,
        'Audio URL:', music.currentSrc || music.src);
}
function removeUnlockListeners() {
    unlockEvents.forEach(type => document.removeEventListener(type, unlockPlayback, true));
}
function startMusic() {
    // play() is called directly during the user's gesture, before any async work.
    if (!music.paused) return;
    music.muted = false;
    const request = music.play();
    if (request && typeof request.then === 'function') {
        request.then(() => {
            playbackStarted = true;
            audioHint.hidden = true;
            removeUnlockListeners();
        }).catch(error => {
            if (error.name === 'NotAllowedError') {
                // Autoplay blocked: retain the first-tap listeners, with no extra button.
                showAudioHint('સંગીત સાંભળવા સ્ક્રીન પર એક વાર ટૅપ કરો');
            } else if (error.name !== 'AbortError') {
                reportAudioProblem(error);
            }
        });
    }
}
function unlockPlayback(event) {
    if (event.type === 'keydown' && !['Enter', ' ', 'Spacebar'].includes(event.key)) return;
    startMusic();
    if (!introFinished && video.paused) video.play().catch(() => {});
}
function addUnlockListeners() {
    unlockEvents.forEach(type => document.addEventListener(type, unlockPlayback,
        {capture: true, passive: true}));
}
addUnlockListeners();
music.addEventListener('error', () => {
    failedTracks.add(trackIndex);
    reportAudioProblem(music.error || 'Could not load audio file');
    if (failedTracks.size < musicTracks.length) {
        trackIndex = musicTracks.findIndex((_, index) => !failedTracks.has(index));
        music.src = musicTracks[trackIndex];
        music.load();
        addUnlockListeners();
        startMusic();
    } else {
        showAudioHint('સંગીતની ફાઇલ મળી નથી.');
        console.error('[Invitation music] Neither MP3 could be loaded. Check that assets/music/track-1.mp3 and track-2.mp3 exist, use exactly these names, and contain playable MP3 audio.');
    }
});
// Resume after a browser/system interruption when the visitor next taps the page.
music.addEventListener('pause', () => {
    if (playbackStarted && failedTracks.size < musicTracks.length) addUnlockListeners();
});
function finishIntro() {
    if (introFinished) return;
    introFinished = true;
    const hadFocus = intro.contains(document.activeElement);
    document.querySelector('main').inert = false;
    document.body.classList.remove('intro-active');
    intro.classList.add('finished');
    video.pause();
    window.scrollTo({top:0, behavior:'instant'});
    setTimeout(() => {
        intro.hidden = true;
        if (hadFocus) {
            const heading = document.querySelector('h1');
            heading.tabIndex = -1;
            heading.focus({preventScroll:true});
        }
    }, 650);
    // Music stays on the same audio element and is not restarted or paused.
}
document.getElementById('skip-intro').addEventListener('click', () => {
    if (music.paused) startMusic();
    finishIntro();
});
video.addEventListener('ended', finishIntro);
video.addEventListener('error', finishIntro);
video.querySelector('source')?.addEventListener('error', finishIntro);
video.addEventListener('timeupdate', () => {
    if (Number.isFinite(video.duration) && video.duration > 0) {
        document.getElementById('intro-progress-bar').style.width = `${video.currentTime/video.duration*100}%`;
    }
});
video.play().catch(() => {});
startMusic();
