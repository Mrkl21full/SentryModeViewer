// Add variable for cooldown.
let bEnabled = true;

// Prepare array for videos.
let videos = {};
let videoIndex = -1;
let videosIndexes = [];

// Save state of current window.
let currentWindow = 'front';
let currentTimeframe = 0;

// All videos data.
let maxDuration = 0;
let currentDuration = 0;

// Get all required objects.
const videoMain = document.querySelector('video[data-main]');
const videoInput = document.querySelector('input[data-video-input]');
const videoPlaybackControl = document.querySelector('i[data-video-toggle]');
const videoExtraInformation = document.querySelector('i[data-currently-not-available-info]');
const videoAdditionalControl = document.querySelector('i[data-currently-not-available]');

// Get time elements.
const videoCurrentTime = document.querySelector('div[data-playback-current]');
const videoDurationTime = document.querySelector('div[data-playback-duration]');

// Get slider elements.
const videoTimeSlider = document.querySelector('div[data-playback-slider]');
const videoTimeSliderTracker = document.querySelector('div[data-playback-slider-tracker]');
const videoTimeSliderTrackerTime = document.querySelector('div[data-playback-slider-tracker-time]');
const videoTimeSliderTrackerEvent = document.querySelector('div[data-playback-slider-tracker-event]');

// Prepare all feedbacks.
const videoPlaybacks = {
    'video_back': document.querySelector('video[data-video-type="rear"]'),
    'video_front': document.querySelector('video[data-video-type="front"]'),
    'video_left_repeater': document.querySelector('video[data-video-type="left_repeater"]'),
    'video_right_repeater': document.querySelector('video[data-video-type="right_repeater"]'),
};

// Add event for tab change to optimize performance.
document.addEventListener("visibilitychange", () => {
    // Remove any classes that might currently be in place.
    videoPlaybackControl.classList.remove('fa-play');
    videoPlaybackControl.classList.remove('fa-pause');

    // Add play class to start all of videos.
    videoPlaybackControl.classList.add('fa-play');

    // Pause all available video tags.
    document.querySelectorAll('video').forEach(v => v.pause());
});

// Add event to video browser.
document.querySelector('i[data-video-browser]').addEventListener('click', openExplorer);

// Add events to all window videos.
videoPlaybacks['video_back'].addEventListener('click', windowChange);
videoPlaybacks['video_front'].addEventListener('click', windowChange);
videoPlaybacks['video_left_repeater'].addEventListener('click', windowChange);
videoPlaybacks['video_right_repeater'].addEventListener('click', windowChange);

// Add client event to calculate where we should move our video files.
videoTimeSlider.addEventListener('click', (e) => playerMove(e));

// Add event to main play / pause toggle.
videoPlaybackControl.addEventListener('click', playerToggle);
videoExtraInformation.addEventListener('click', () => alert('This feature is currently not available!'));
videoAdditionalControl.addEventListener('click', () => alert('This feature is currently not available!'));

// Add event for main video to switch to other files.
videoMain.addEventListener('ended', () => {
    // Check if we have any more files in line.
    if (videos[videosIndexes[videoIndex + 1]] === undefined) {
        return;
    }

    // Add current timeframe to current duration.
    currentDuration += currentTimeframe;

    // Update current timeframe.
    currentTimeframe = 0;

    // Switch video files.
    switchVideoFiles(false);
});

// Add event for main video to switch to other files.
videoMain.addEventListener('pause', () => {
    // Check if currently we are playing this video.
    const isPlaying = videoPlaybackControl.classList.contains('fa-pause');

    // Check if we need to play video.
    if (!isPlaying) {
        return;
    }

    // Update all videos for current timeframe.
    document.querySelectorAll('video').forEach(v => {
        // Update all timeframes.
        v.currentTime = currentTimeframe;

        // Check if we need to play video.
        if (v.paused) {
            // Play current video.
            v.play();
        }
    });
});

// Add event for main video to keep track of current timeframe.
videoMain.addEventListener('timeupdate', () => {
    // Save current time globally.
    currentTimeframe = videoMain.currentTime;

    // Update current time in timeline.
    videoCurrentTime.innerHTML = convertNumToTime(currentDuration + videoMain.currentTime);

    // Calculate percentage for slider.
    const percentage = ((currentDuration + videoMain.currentTime) / maxDuration * 100);

    // Move slider properly with time updated.
    videoTimeSliderTracker.style.right = (100 - percentage) + '%';
    videoTimeSliderTrackerTime.style.left = ((percentage - 1 >= 100) ? 99 : percentage - 1) + '%';
})

// Add event on input change so we can scan all files.
document.addEventListener('change', (event) => {
    // Get all uploaded files.
    const files = event.target.files;

    // Allowed types of files.
    const fileTypes = [
        'video/mp4',
        'image/png',
        'application/json',
    ];

    // Allowed file name types.
    const videoTypes = [
        'back.mp4',
        'front.mp4',
        'left_repeater.mp4',
        'right_repeater.mp4',
    ];

    // Clear array of all videos.
    videos = {};
    maxDuration = 0;
    videosIndexes = [];
    currentDuration = 0;

    // Save Sentry mode event fle for later.
    let sentryModeFile = null;

    // Loop through them...
    for (let i = 0; i < files.length; i++) {
        // Get current file itteration.
        const file = files.item(i);

        // Check if given type is allowed.
        if (!fileTypes.includes(file.type)) {
            // Put a nice alert so user can understand what happened.
            clearVideoInput('One of the uploaded files has inproper file type!');
            
            // Break current loop and even the event.
            return;
        }

        if (file.type === 'image/png' && file.name !== 'thumb.png') {
            // Put a nice alert so user can understand what happened.
            clearVideoInput('Uploaded png file is not a thumb file!');
            
            // Break current loop and even the event.
            return;
        }

        if (file.type === 'application/json' && file.name !== 'event.json') {
            // Put a nice alert so user can understand what happened.
            clearVideoInput('Uploaded json file is not a valid event file!');
            
            // Break current loop and even the event.
            return;
        }

        if (file.type === 'video/mp4') {
            // Split file name.
            const name = file.name.split('-');

            // Check if we have valid name for Tesla sentrymode file.
            if (!videoTypes.includes(name[5])) {
                // Put a nice alert so user can understand what happened.
                clearVideoInput('Uploaded mp4 file is not a valid Tesla video file!');
                
                // Break current loop and even the event.
                return;
            }

            // Remove last element from array.
            const type = name.pop();

            // Get index for new array.
            const index = name.join('-');

            // Split index so we can make it as date object.
            const timeArr = index.split('_');

            // Calculate duration for current video.
            const duration = (file.lastModifiedDate - (new Date(timeArr[0].replaceAll('-', '/') + ' ' + timeArr[1].replaceAll('-', ':')))) / 1000;

            // Check if this index already exits.
            if (videos[index] === undefined) {
                // If not, create new array at that index.
                videos[index] = [];
                videosIndexes.push(index);

                // Add max duration during file scaning.
                maxDuration += duration;
            }

            // Add currrent video to array.
            videos[index].push({
                src: URL.createObjectURL(file),
                name: file.name,
                type: type.replace('.mp4', ''),
                endTime: file.lastModifiedDate,
                duration: duration,
                startTime: new Date(timeArr[0].replaceAll('-', '/') + ' ' + timeArr[1].replaceAll('-', ':')),
            });
        }

        if (file.type === 'application/json' && file.name === 'event.json') {
            // Save file for reader to read later.
            sentryModeFile = file;
        }
    }

    // Current percentage of calculated data video.
    let currentPercentage = 0;

    // Loop through all videos.
    for (const [k, v] of Object.entries(videos)) {
        const maxPercentage = parseFloat((v[0].duration / maxDuration * 100).toFixed(2));

        // Add range of percentages to current video as 4th index.
        videos[k].push({
            'duration': parseFloat(v[0].duration),
            'percentage': maxPercentage,
            'minPercentage': (currentPercentage > 0) ? currentPercentage : 0,
            'maxPercentage': currentPercentage + maxPercentage,
        })

        // Add current percentage to max percentage.
        currentPercentage += maxPercentage;
    }

    // Check if we have SentryMode event file parsed and ready to go.
    if (sentryModeFile !== null) {
        // Create new file reader and read file.
        const reader = new FileReader();
        reader.readAsText(sentryModeFile);

        // Add event to reader.
        reader.onload = function() {
            // Get event data from json file.
            const event = JSON.parse(reader.result);

            // Get date from timestamp index and prepare name of days for html.
            const date = new Date(event.timestamp);
            const nameOfDays = [
                'Sunday',
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
            ];

            // Determinate type of sentry mode event.
            const sentryType = event.reason === 'sentry_aware_object_detection' ? 'SentryMode' : 'Dashcam';
            const sentryData = event.timestamp.replace('T', '_').replace(':', '-').split(':');
            const sentryTime = sentryData[0];

            // Loop through all videos.
            for (const [k, v] of Object.entries(videos)) {
                // Find the one that matches the sentry mode event.
                if (!k.indexOf(sentryTime)) {
                    // @todo add event marker into timeline.
                    const videoTime = k.split('-')[4];
                    const eventTime = sentryData[1];

                    // Calculate difference between event and video.
                    let difference = eventTime - videoTime;

                    if (difference < 0) {
                        // @todo swticth video to previous video, and try to calculate it again.
                        alert('We couldn\'t load event time pointer!');
                        break;
                    }

                    // Calculare number of seconds inside current video clip.
                    difference = v[4].duration - difference;

                    // Add event point dot, where this event should been triggered.
                    videoTimeSliderTrackerEvent.style.left = (v[4].minPercentage + (v[4].percentage / v[4].duration) * difference).toFixed(2) + '%';
                    break;
                }
            }

            // Load event data to html.
            document.querySelector('p[data-video-event-message]').innerHTML = sentryType + ': ' + nameOfDays[date.getDay()] + ', ' + date.toLocaleString('en-US', { 
                weekenday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }) + ', around ' + ((date.getHours() < 10) ? '0' + date.getHours(): date.getHours()) + ':' + ((date.getMinutes() < 10) ? '0' + date.getMinutes(): date.getMinutes());
        };
    }

    // Insert max duration to html element.
    videoDurationTime.innerHTML = '~' + convertNumToTime(maxDuration);

    // Update current index.
    videoIndex = -1;
    
    // Switch video files.
    switchVideoFiles(true);

    // Update all slider settings, just in case.
    videoTimeSliderTracker.style.right = '0%';
    videoTimeSliderTrackerTime.style.left = '0%';

    // Enable slider tracker time.
    videoTimeSliderTrackerTime.style.display = 'block';
    videoTimeSliderTrackerEvent.style.display = 'block';
});

function switchVideoFiles(bPause = false) {
    // Check if we have any more files in line.
    if (videos[videosIndexes[videoIndex + 1]] === undefined) {
        return;
    }

    // Update current index.
    videoIndex++;

    // Load first video data into player.
    const videoList = videos[videosIndexes[videoIndex]];

    // Loop through each camera.
    videoList.forEach((k) => {
        // Check if we have any other object then video type.
        if (typeof k.type === 'undefined') {
            return;
        }

        // Add new src settings to all video players.
        videoPlaybacks['video_' + k.type].src = k.src;

        // Check if we want to pause video.
        if (bPause) {
            // Pause window playback.
            videoPlaybacks['video_' + k.type].pause();
        }

        // Loop for type that user have selected (or default one).
        if (k.type === currentWindow) {
            // Remove any active class from previous actions.
            document.querySelector('div.sentry__body--window.active').classList.remove('active');

            // Add new active class to front video.
            videoPlaybacks['video_' + k.type].parentNode.classList.add('active');

            // Replace main video url with new url.
            videoMain.src = k.src;

            // Check if we want to pause main video.
            if (bPause) {
                // Pause main video.
                videoMain.pause();
            }
        }
    });

    // Check if currently we are playing this video.
    const isPlaying = videoPlaybackControl.classList.contains('fa-pause');

    // Update all videos for current timeframe.
    document.querySelectorAll('video').forEach(v => {
        // Update all timeframes.
        v.currentTime = currentTimeframe;

        // Check if we need to play video.
        if (isPlaying && v.paused) {
            // Play current video.
            v.play();
        }
    });
}

function clearVideoInput(message) {
    // Clear current input.
    videoInput.value = '';

    // Clear array of all videos.
    videos = {};

    // Put a nice alert so user can understand what happened.
    alert(message);
}

function openExplorer() {
    // Get current state of the all players.
    const bPlay = videoPlaybackControl.classList.contains('fa-pause');

    // Check if player is stopped.
    if (bPlay) {
        // Toggle button.
        videoPlaybackControl.classList.add('fa-play');
        videoPlaybackControl.classList.remove('fa-pause');

        // Pause all available video tags.
        document.querySelectorAll('video').forEach(v => v.pause());
    }

    // Clear that input and force click it.
    videoInput.value = '';
    videoInput.click();
}

// Declare function to handle clicking on each window.
function windowChange() {
    // Check if cooldown has passed.
    if (!bEnabled) {
        return;
    }

    // Check if we have already active class for it.
    if (this.parentNode.classList.contains('active')) {
        return;
    }

    // Remove any active class from previous actions.
    document.querySelector('div.sentry__body--window.active').classList.remove('active');

    // Add active class to current video.
    this.parentNode.classList.add('active');

    // Check if currently we are playing this video.
    const isPlaying = videoPlaybackControl.classList.contains('fa-pause');

    // Check if we need to pause current video.
    if (!isPlaying) {
        // Pause current video playback.
        videoMain.pause();
    }

    // Replace main video url with new url and seek to timeFrame.
    videoMain.src = this.src;

    // Update all videos for current timeframe.
    document.querySelectorAll('video').forEach(v => {
        // Update all timeframes.
        v.currentTime = currentTimeframe;

        // Check if we need to play video.
        if (isPlaying && v.paused) {
            // Play current video.
            v.play();
        }
    });

    // Save current window name.
    currentWindow = this.getAttribute('data-video-type');

    // Disable all actions.
    disableActions();
}

function playerMove(e) {
    // Check if cooldown has passed.
    if (!bEnabled) {
        return;
    }

    // Calculate % of user clicking position.
    const rect = videoTimeSlider.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const percentageX = ((offsetX / rect.width) * 100).toFixed(2);

    // Just in case, check if we are not out of bounds.
    if (percentageX < 0) {
        percentageX = 0;
    }
    else if (percentageX > 100) {
        percentageX = 100;
    }

    // Calculate each duration for previous videos.
    let previousVideosDuration = 0;

    // Loop through all videos.
    for (const [k, v] of Object.entries(videos)) {
        // Check if we have match for current percentage.
        if (percentageX >= v[4].minPercentage && percentageX <= v[4].maxPercentage) {
            // Update all slider settings.
            videoTimeSliderTracker.style.right = (100 - percentageX) + '%';
            videoTimeSliderTrackerTime.style.left = (percentageX - 1) + '%';

            // Calculate current duration and timeframe for video.
            currentTimeframe = ((v[4].duration / v[4].percentage) * (percentageX - v[4].minPercentage));
            currentDuration = previousVideosDuration;

            // Update current index.
            videoIndex = videosIndexes.indexOf(k) - 1;
            
            // Switch video files.
            switchVideoFiles(!videoPlaybackControl.classList.contains('fa-pause'));
            break;
        }

        // Add duration from previous videos.
        previousVideosDuration += v[4].duration;
    }

    // Disable all actions.
    disableActions();
}

function playerToggle() {
    // Check if cooldown has passed.
    if (!bEnabled) {
        return;
    }

    // Get current state of the all players.
    const bPlay = this.classList.contains('fa-play');

    // Check if player is stopped.
    if (bPlay) {
        // Toggle button.
        this.classList.add('fa-pause');
        this.classList.remove('fa-play');

        // Play all available video tags.
        document.querySelectorAll('video').forEach(v => v.play());
    }
    else {
        // Toggle button.
        this.classList.add('fa-play');
        this.classList.remove('fa-pause');

        // Pause all available video tags.
        document.querySelectorAll('video').forEach(v => v.pause());
    }

    // Disable all actions.
    disableActions();
}

function disableActions() {
    // Mark it as non-executable.
    bEnabled = false;

    // Add timeout for this button.
    setTimeout(() => bEnabled = true, 250);
}

// Convert number to time.
function convertNumToTime(seconds) {
    return new Date(seconds * 1000).toLocaleTimeString([], {
        minute: "numeric",
        second: "2-digit",
    });
}