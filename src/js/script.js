/**
 * Tesla Sentry Mode Viewer
 * @author Mrkl21full (Krystian)
 * @version 2.0
 * @license GPL-3.0
 * @repository https://github.com/Mrkl21full/SentryModeViewer
 * @description JavaScript application for viewing Tesla Sentry Mode and Dashcam recordings
 */

const DEBUG = false;

/**
 * Log message to console if DEBUG mode is enabled
 * @param {string} message - Message to log
 * @param {*} data - Optional data to log
 */
function debugLog(message, data = null) {
    if (DEBUG) {
        if (data !== null) {
            console.log(`[DEBUG] ${message}`, data);
        } else {
            console.log(`[DEBUG] ${message}`);
        }
    }
}

/**
 * Show user-facing message in alert
 * @param {string} message - Message to show
 */
function showMessage(message) {
    alert(message);
    console.log(`[INFO] ${message}`);
}

/**
 * Change favicon dynamically
 * @param {string} state - State of the viewer: 'default', 'loading', 'paused'
 */
function changeFavicon(state = 'default') {
    const faviconMap = {
        'default': 'src/image/icons/SentryMode.png',
        'loading': 'src/image/icons/SentryMode_Refresh.png',
        'paused': 'src/image/icons/SentryMode_Pause.png'
    };

    const iconPath = faviconMap[state] || faviconMap['default'];
    const timestamp = new Date().getTime();

    const link = document.querySelector('link[rel="icon"]');
    const appleLink = document.querySelector('link[rel="apple-touch-icon"]');

    if (link) {
        link.href = `${iconPath}?v=${timestamp}`;
    }

    if (appleLink) {
        appleLink.href = `${iconPath}?v=${timestamp}`;
    }

    debugLog(`Favicon changed to: ${state}`);
}

class SentryModeViewer {
    constructor() {
        this.state = {
            videos: {},
            videoIndexes: [],
            currentIndex: -1,
            currentWindow: 'grid',
            currentTimeframe: 0,
            currentDuration: 0,
            maxDuration: 0,
            isPlaying: false,
            cooldown: false,
            eventData: null,
            isLoading: false
        };

        this.elements = {
            gridVideos: {
                front: document.querySelector('[data-grid-video-type="front"]'),
                back: document.querySelector('[data-grid-video-type="back"]'),
                left_repeater: document.querySelector('[data-grid-video-type="left_repeater"]'),
                right_repeater: document.querySelector('[data-grid-video-type="right_repeater"]'),
                left_pillar: document.querySelector('[data-grid-video-type="left_pillar"]'),
                right_pillar: document.querySelector('[data-grid-video-type="right_pillar"]')
            },
            thumbVideos: {
                front: document.querySelector('[data-video-type="front"]'),
                back: document.querySelector('[data-video-type="back"]'),
                left_repeater: document.querySelector('[data-video-type="left_repeater"]'),
                right_repeater: document.querySelector('[data-video-type="right_repeater"]'),
                left_pillar: document.querySelector('[data-video-type="left_pillar"]'),
                right_pillar: document.querySelector('[data-video-type="right_pillar"]')
            },
            thumbGridVideos: {
                front: document.querySelector('[data-thumb-grid-type="front"]'),
                back: document.querySelector('[data-thumb-grid-type="back"]'),
                left_repeater: document.querySelector('[data-thumb-grid-type="left_repeater"]'),
                right_repeater: document.querySelector('[data-thumb-grid-type="right_repeater"]')
            },
            thumbnails: document.querySelectorAll('.sentry-viewer__thumb'),
            playButton: document.querySelector('[data-video-toggle]'),
            rewind15: document.querySelector('[data-rewind-15]'),
            forward15: document.querySelector('[data-forward-15]'),
            jumpToEvent: document.querySelector('[data-jump-to-event]'),
            menuButton: document.querySelector('[data-menu-toggle]'),
            progressBar: document.querySelector('[data-playback-slider-tracker]'),
            progressFill: document.querySelector('.sentry-viewer__progress-fill'),
            eventMarker: document.querySelector('[data-playback-slider-tracker-event]'),
            datetime: document.querySelector('[data-video-datetime]')
        };

        this.config = {
            cooldownTime: 250,
            allowedFileTypes: [
                'video/mp4',
                'application/json'
            ],
            videoFileTypes: [
                'back.mp4',
                'front.mp4',
                'left_repeater.mp4',
                'right_repeater.mp4',
                'left_pillar.mp4',
                'right_pillar.mp4'
            ]
        };

        this.init();
    }

    /**
     * Initialize viewer and bind events
     */
    init() {
        this.bindEvents();
        this.disablePlaybackControls();
        changeFavicon('paused');
        debugLog('Tesla Sentry Mode Viewer initialized');
    }

    /**
     * Bind all event listeners
     */
    bindEvents() {
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());

        this.elements.menuButton?.addEventListener('click', () => this.openFolderPicker());
        this.elements.playButton?.addEventListener('click', () => this.togglePlayback());
        this.elements.rewind15?.addEventListener('click', () => this.seek(-15));
        this.elements.forward15?.addEventListener('click', () => this.seek(15));
        this.elements.jumpToEvent?.addEventListener('click', () => this.jumpToEvent());

        const progressContainer = document.querySelector('.sentry-viewer__progress-container');
        progressContainer?.addEventListener('click', (e) => this.handleProgressClick(e));

        this.elements.thumbnails.forEach(thumb => {
            thumb.addEventListener('click', () => this.handleThumbnailClick(thumb));
        });

        Object.values(this.elements.gridVideos).forEach(video => {
            if (video) {
                video.addEventListener('ended', () => this.handleVideoEnded());
                video.addEventListener('timeupdate', () => this.handleTimeUpdate(video));
                video.addEventListener('pause', () => this.handleVideoPause());
            }
        });

        Object.values(this.elements.thumbVideos).forEach(video => {
            if (video) {
                video.addEventListener('pause', () => this.handleVideoPause());
            }
        });

        Object.values(this.elements.thumbGridVideos).forEach(video => {
            if (video) {
                video.addEventListener('pause', () => this.handleVideoPause());
            }
        });
    }

    /**
     * Handle browser tab visibility change
     */
    handleVisibilityChange() {
        if (document.hidden) {
            this.pauseAll();
        }
    }

    /**
     * Open folder picker for selecting recordings
     */
    async openFolderPicker() {
        if (this.state.isLoading) {
            debugLog('Already loading files, please wait...');
            return;
        }

        if (this.state.isPlaying) {
            this.pauseAll();
            this.state.isPlaying = false;
            this.elements.playButton?.querySelector('i')?.classList.remove('fa-pause');
            this.elements.playButton?.querySelector('i')?.classList.add('fa-play');
        }

        changeFavicon('loading');

        try {
            if ('showDirectoryPicker' in window) {
                const dirHandle = await window.showDirectoryPicker();
                await this.loadFilesFromDirectory(dirHandle);
            } else {
                this.createFilePicker();
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error opening folder:', error);
                showMessage('Error opening folder. Please try again.');
            }
            this.state.isLoading = false;

            if (this.state.videoIndexes.length > 0) {
                changeFavicon('paused');
            } else {
                changeFavicon('paused');
            }
        }
    }

    /**
     * Create fallback file picker input element
     */
    createFilePicker() {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.webkitdirectory = true;
        input.directory = true;

        input.addEventListener('change', async (e) => {
            await this.loadFilesFromInput(e.target.files);
        });

        input.click();
    }

    /**
     * Load files from directory handle (File System Access API)
     * @param {FileSystemDirectoryHandle} dirHandle - Directory handle
     */
    async loadFilesFromDirectory(dirHandle) {
        const files = [];

        for await (const entry of dirHandle.values()) {
            if (entry.kind === 'file') {
                const file = await entry.getFile();
                files.push(file);
            }
        }

        await this.processFiles(files);
    }

    /**
     * Load files from input file list
     * @param {FileList} fileList - File list from input
     */
    async loadFilesFromInput(fileList) {
        const files = Array.from(fileList);
        await this.processFiles(files);
    }

    /**
     * Process selected files and load videos
     * @param {Array<File>} files - Array of files to process
     */
    async processFiles(files) {
        this.state.isLoading = true;

        this.resetPlaybackState();
        this.resetState();
        this.updateGlobalPillarCamerasVisibility(false);

        let eventFile = null;
        let hasPillarCameras = false;

        for (const file of files) {
            if (!this.isValidFile(file)) {
                continue;
            }

            if (file.type === 'video/mp4') {
                this.processVideoFile(file);

                if (file.name.includes('left_pillar') || file.name.includes('right_pillar')) {
                    hasPillarCameras = true;
                    debugLog('Found pillar camera:', file.name);
                }
            } else if (file.type === 'application/json' && file.name === 'event.json') {
                eventFile = file;
            }
        }

        this.calculateVideoRanges();

        if (eventFile) {
            await this.processEventFile(eventFile);
        }

        if (this.state.videoIndexes.length === 0) {
            showMessage('No valid Tesla Sentry Mode videos found in the selected folder.');
            this.state.isLoading = false;
            changeFavicon('default');
            return;
        }

        this.updateGlobalPillarCamerasVisibility(hasPillarCameras);
        this.updateDatetime(this.state.videoIndexes[0]);

        const progressContainer = document.querySelector('.sentry-viewer__progress-container');
        progressContainer?.classList.add('visible');

        this.loadVideoSet(0);
        this.enablePlaybackControls();

        if (this.state.eventData) {
            this.elements.jumpToEvent?.classList.add('visible');
        }

        debugLog('Loaded videos:', this.state.videoIndexes.length);
        debugLog('Pillar cameras available:', hasPillarCameras);

        this.state.isLoading = false;
        changeFavicon('paused');
    }

    /**
     * Reset playback state and UI
     */
    resetPlaybackState() {
        this.state.isPlaying = false;
        this.pauseAll();

        if (this.elements.playButton) {
            this.elements.playButton.querySelector('i')?.classList.remove('fa-pause');
            this.elements.playButton.querySelector('i')?.classList.add('fa-play');
        }
    }

    /**
     * Reset application state
     */
    resetState() {
        this.state.videos = {};
        this.state.videoIndexes = [];
        this.state.currentIndex = -1;
        this.state.maxDuration = 0;
        this.state.currentDuration = 0;
        this.state.currentTimeframe = 0;
        this.state.eventData = null;
    }

    /**
     * Disable playback controls before videos are loaded
     */
    disablePlaybackControls() {
        this.elements.playButton?.classList.add('disabled');
        this.elements.rewind15?.classList.add('disabled');
        this.elements.forward15?.classList.add('disabled');

        this.elements.playButton?.setAttribute('disabled', 'true');
        this.elements.rewind15?.setAttribute('disabled', 'true');
        this.elements.forward15?.setAttribute('disabled', 'true');
    }

    /**
     * Enable playback controls after videos are loaded
     */
    enablePlaybackControls() {
        this.elements.playButton?.classList.remove('disabled');
        this.elements.rewind15?.classList.remove('disabled');
        this.elements.forward15?.classList.remove('disabled');

        this.elements.playButton?.removeAttribute('disabled');
        this.elements.rewind15?.removeAttribute('disabled');
        this.elements.forward15?.removeAttribute('disabled');
    }

    /**
     * Check if file is valid Tesla video or event file
     * @param {File} file - File to validate
     * @returns {boolean} True if valid
     */
    isValidFile(file) {
        if (file.type === 'video/mp4') {
            const nameParts = file.name.split('-');
            if (nameParts.length < 6) return false;
            const videoType = nameParts[5];
            return this.config.videoFileTypes.includes(videoType);
        }

        if (file.type === 'application/json') {
            return file.name === 'event.json';
        }

        return false;
    }

    /**
     * Process single video file and add to collection
     * @param {File} file - Video file to process
     */
    processVideoFile(file) {
        const nameParts = file.name.split('-');
        const videoType = nameParts[5].replace('.mp4', '');

        nameParts.pop();
        const index = nameParts.join('-');

        const timeArr = index.split('_');
        const startTime = new Date(timeArr[0].replaceAll('-', '/') + ' ' + timeArr[1].replaceAll('-', ':'));
        const duration = 60;

        if (!this.state.videos[index]) {
            this.state.videos[index] = [];
            this.state.videoIndexes.push(index);
            this.state.maxDuration += duration;
        }

        this.state.videos[index].push({
            src: URL.createObjectURL(file),
            name: file.name,
            type: videoType,
            startTime: startTime,
            duration: duration,
            file: file
        });
    }

    /**
     * Calculate percentage ranges for video timeline
     */
    calculateVideoRanges() {
        let currentPercentage = 0;

        for (const index of this.state.videoIndexes) {
            const videoSet = this.state.videos[index];
            const duration = videoSet[0].duration;
            const percentage = (duration / this.state.maxDuration) * 100;

            videoSet.range = {
                duration: duration,
                percentage: percentage,
                minPercentage: currentPercentage,
                maxPercentage: currentPercentage + percentage
            };

            currentPercentage += percentage;
        }
    }

    /**
     * Process event.json file and mark event position
     * @param {File} file - Event JSON file
     */
    async processEventFile(file) {
        try {
            const text = await file.text();
            this.state.eventData = JSON.parse(text);

            const eventTime = new Date(this.state.eventData.timestamp);

            for (const index of this.state.videoIndexes) {
                const videoSet = this.state.videos[index];
                const startTime = videoSet[0].startTime;
                const endTime = new Date(startTime.getTime() + videoSet[0].duration * 1000);

                if (eventTime >= startTime && eventTime <= endTime) {
                    const offsetSeconds = (eventTime - startTime) / 1000;
                    const offsetPercentage = (offsetSeconds / videoSet[0].duration) * videoSet.range.percentage;
                    const eventPercentage = videoSet.range.minPercentage + offsetPercentage;

                    this.elements.eventMarker.style.left = eventPercentage + '%';
                    this.elements.eventMarker.classList.add('visible');

                    break;
                }
            }
        } catch (error) {
            console.error('Error processing event file:', error);
        }
    }

    /**
     * Load specific video set by index
     * @param {number} index - Index of video set to load
     */
    loadVideoSet(index) {
        if (index < 0 || index >= this.state.videoIndexes.length) {
            return;
        }

        this.state.currentIndex = index;
        const videoKey = this.state.videoIndexes[index];
        const videoSet = this.state.videos[videoKey];

        videoSet.forEach(video => {
            const gridVideo = this.elements.gridVideos[video.type];
            const thumbVideo = this.elements.thumbVideos[video.type];
            const thumbGridVideo = this.elements.thumbGridVideos[video.type];

            if (gridVideo) {
                gridVideo.src = video.src;
                gridVideo.currentTime = this.state.currentTimeframe;
                gridVideo.load();
            }

            if (thumbVideo) {
                thumbVideo.src = video.src;
                thumbVideo.currentTime = this.state.currentTimeframe;
                thumbVideo.load();
            }

            if (thumbGridVideo) {
                thumbGridVideo.src = video.src;
                thumbGridVideo.currentTime = this.state.currentTimeframe;
                thumbGridVideo.load();
            }
        });
    }

    /**
     * Update pillar camera thumbnails visibility
     * @param {boolean} hasPillarCameras - Whether pillar cameras exist in folder
     */
    updateGlobalPillarCamerasVisibility(hasPillarCameras) {
        const leftPillarThumb = document.querySelector('[data-camera-position="left-pillar"]');
        const rightPillarThumb = document.querySelector('[data-camera-position="right-pillar"]');

        if (hasPillarCameras) {
            leftPillarThumb?.classList.add('visible');
            rightPillarThumb?.classList.add('visible');
            debugLog('Pillar camera thumbnails shown');
        } else {
            leftPillarThumb?.classList.remove('visible');
            rightPillarThumb?.classList.remove('visible');
            debugLog('Pillar camera thumbnails hidden');
        }
    }

    /**
     * Handle thumbnail click and switch camera view
     * @param {HTMLElement} thumb - Clicked thumbnail element
     */
    handleThumbnailClick(thumb) {
        if (this.state.cooldown) return;

        const position = thumb.getAttribute('data-camera-position');

        this.elements.thumbnails.forEach(t => t.classList.remove('sentry-viewer__thumb--active'));
        thumb.classList.add('sentry-viewer__thumb--active');

        this.state.currentWindow = position;

        if (position === 'grid') {
            this.showGridView();
        } else {
            this.showSingleCameraView(position);
        }

        this.applyCooldown();
    }

    /**
     * Show grid view with 4 main cameras (2x2)
     */
    showGridView() {
        const gridCells = document.querySelectorAll('.sentry-viewer__video-grid-cell');
        const mainCameras = [
            'front',
            'back',
            'left_repeater',
            'right_repeater'
        ];

        gridCells.forEach(cell => {
            const video = cell.querySelector('[data-grid-video-type]');
            const videoType = video?.getAttribute('data-grid-video-type');

            if (mainCameras.includes(videoType)) {
                cell.classList.remove('hidden', 'fullscreen');
            } else {
                cell.classList.add('hidden');
                cell.classList.remove('fullscreen');
            }
        });
    }

    /**
     * Show single camera in fullscreen
     * @param {string} cameraPosition - Camera position identifier
     */
    showSingleCameraView(cameraPosition) {
        const cameraMap = {
            'front': 'front',
            'rear': 'back',
            'left-repeater': 'left_repeater',
            'right-repeater': 'right_repeater',
            'left-pillar': 'left_pillar',
            'right-pillar': 'right_pillar'
        };

        const videoType = cameraMap[cameraPosition];
        if (!videoType) return;

        const gridCells = document.querySelectorAll('.sentry-viewer__video-grid-cell');

        gridCells.forEach(cell => {
            const video = cell.querySelector('[data-grid-video-type]');
            const cellVideoType = video?.getAttribute('data-grid-video-type');

            if (cellVideoType === videoType) {
                cell.classList.remove('hidden');
                cell.classList.add('fullscreen');
            } else {
                cell.classList.add('hidden');
                cell.classList.remove('fullscreen');
            }
        });
    }

    /**
     * Toggle video playback (play/pause)
     */
    togglePlayback() {
        if (this.state.cooldown) return;

        if (this.state.videoIndexes.length === 0) {
            debugLog('No videos loaded, cannot toggle playback');
            return;
        }

        this.state.isPlaying = !this.state.isPlaying;

        if (this.state.isPlaying) {
            this.playAll();
            this.elements.playButton.querySelector('i').classList.remove('fa-play');
            this.elements.playButton.querySelector('i').classList.add('fa-pause');
            changeFavicon('default');
        } else {
            this.pauseAll();
            this.elements.playButton.querySelector('i').classList.remove('fa-pause');
            this.elements.playButton.querySelector('i').classList.add('fa-play');
            changeFavicon('paused');
        }

        this.applyCooldown();
    }

    /**
     * Play all videos (grid, thumbnails, and thumbnail grid)
     */
    playAll() {
        Object.values(this.elements.gridVideos).forEach(video => {
            if (video && video.paused) {
                video.play().catch(e => console.warn('Could not play video:', e));
            }
        });

        Object.values(this.elements.thumbVideos).forEach(video => {
            if (video && video.paused) {
                video.play().catch(e => console.warn('Could not play thumbnail video:', e));
            }
        });

        Object.values(this.elements.thumbGridVideos).forEach(video => {
            if (video && video.paused) {
                video.play().catch(e => console.warn('Could not play thumb grid video:', e));
            }
        });
    }

    /**
     * Pause all videos (grid, thumbnails, and thumbnail grid)
     */
    pauseAll() {
        Object.values(this.elements.gridVideos).forEach(video => {
            if (video && !video.paused) {
                video.pause();
            }
        });

        Object.values(this.elements.thumbVideos).forEach(video => {
            if (video && !video.paused) {
                video.pause();
            }
        });

        Object.values(this.elements.thumbGridVideos).forEach(video => {
            if (video && !video.paused) {
                video.pause();
            }
        });
    }

    /**
     * Seek forward or backward by specified seconds
     * @param {number} seconds - Seconds to seek (negative for backward)
     */
    seek(seconds) {
        if (this.state.cooldown) return;

        if (this.state.videoIndexes.length === 0) {
            debugLog('No videos loaded, cannot seek');
            return;
        }

        const newTime = this.state.currentTimeframe + seconds;
        const wasPlaying = this.state.isPlaying;

        if (newTime < 0) {
            if (this.state.currentIndex > 0) {
                this.state.currentDuration -= this.state.videos[this.state.videoIndexes[this.state.currentIndex]].range.duration;
                this.state.currentIndex--;
                this.loadVideoSet(this.state.currentIndex);
                this.state.currentTimeframe = this.state.videos[this.state.videoIndexes[this.state.currentIndex]].range.duration + newTime;
            } else {
                this.state.currentTimeframe = 0;
            }
        } else if (newTime > this.getCurrentVideoDuration()) {
            if (this.state.currentIndex < this.state.videoIndexes.length - 1) {
                this.state.currentDuration += this.state.videos[this.state.videoIndexes[this.state.currentIndex]].range.duration;
                this.state.currentIndex++;
                this.loadVideoSet(this.state.currentIndex);
                this.state.currentTimeframe = newTime - this.getCurrentVideoDuration();
            } else {
                this.state.currentTimeframe = this.getCurrentVideoDuration();
            }
        } else {
            this.state.currentTimeframe = newTime;
        }

        this.syncAllVideos();

        if (wasPlaying) {
            this.playAll();
        }

        this.applyCooldown();
    }

    /**
     * Get duration of current video set
     * @returns {number} Duration in seconds
     */
    getCurrentVideoDuration() {
        if (this.state.currentIndex < 0) return 0;
        const videoKey = this.state.videoIndexes[this.state.currentIndex];
        return this.state.videos[videoKey]?.range?.duration || 0;
    }

    /**
     * Synchronize currentTime across all videos
     */
    syncAllVideos() {
        Object.values(this.elements.gridVideos).forEach(video => {
            if (video) {
                video.currentTime = this.state.currentTimeframe;
            }
        });

        Object.values(this.elements.thumbVideos).forEach(video => {
            if (video) {
                video.currentTime = this.state.currentTimeframe;
            }
        });

        Object.values(this.elements.thumbGridVideos).forEach(video => {
            if (video) {
                video.currentTime = this.state.currentTimeframe;
            }
        });
    }

    /**
     * Handle video ended event and move to next video set
     */
    handleVideoEnded() {
        if (this.state.currentIndex < this.state.videoIndexes.length - 1) {
            this.state.currentDuration += this.getCurrentVideoDuration();
            this.state.currentTimeframe = 0;
            this.state.currentIndex++;
            this.loadVideoSet(this.state.currentIndex);

            if (this.state.isPlaying) {
                this.playAll();
            }
        } else {
            this.pauseAll();
            this.state.isPlaying = false;
            this.elements.playButton.querySelector('i').classList.remove('fa-pause');
            this.elements.playButton.querySelector('i').classList.add('fa-play');
            changeFavicon('paused');
        }
    }

    /**
     * Handle video time update and update UI
     * @param {HTMLVideoElement} video - Video element that fired the event
     */
    handleTimeUpdate(video) {
        if (video !== Object.values(this.elements.gridVideos)[0]) return;

        this.state.currentTimeframe = video.currentTime;

        const totalTime = this.state.currentDuration + this.state.currentTimeframe;
        const percentage = (totalTime / this.state.maxDuration) * 100;

        this.elements.progressFill.style.width = percentage + '%';
        this.updateDatetimeWithOffset();
    }

    /**
     * Handle video pause event and resume if needed
     */
    handleVideoPause() {
        if (this.state.isPlaying) {
            this.syncAllVideos();
            this.playAll();
        }
    }

    /**
     * Handle progress bar click and seek to position
     * @param {MouseEvent} e - Click event
     */
    handleProgressClick(e) {
        if (this.state.cooldown) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = (clickX / rect.width) * 100;

        this.seekToPercentage(percentage);
        this.applyCooldown();
    }

    /**
     * Seek to specific percentage in timeline
     * @param {number} percentage - Percentage (0-100) to seek to
     */
    seekToPercentage(percentage) {
        let accumulatedDuration = 0;

        for (let i = 0; i < this.state.videoIndexes.length; i++) {
            const videoKey = this.state.videoIndexes[i];
            const videoSet = this.state.videos[videoKey];
            const range = videoSet.range;

            if (percentage >= range.minPercentage && percentage <= range.maxPercentage) {
                this.state.currentIndex = i - 1;
                this.state.currentDuration = accumulatedDuration;

                const offsetPercentage = percentage - range.minPercentage;
                this.state.currentTimeframe = (offsetPercentage / range.percentage) * range.duration;

                this.loadVideoSet(i);
                this.syncAllVideos();

                if (this.state.isPlaying) {
                    this.playAll();
                }

                break;
            }

            accumulatedDuration += range.duration;
        }
    }

    /**
     * Jump to event marker position
     */
    jumpToEvent() {
        if (!this.state.eventData || this.state.cooldown) return;

        const eventPercentage = parseFloat(this.elements.eventMarker.style.left);
        this.seekToPercentage(eventPercentage);
        this.applyCooldown();
    }

    /**
     * Update datetime display with video start time
     * @param {string} videoIndex - Video index string (timestamp)
     */
    updateDatetime(videoIndex) {
        if (!videoIndex) return;

        const timeArr = videoIndex.split('_');
        const date = new Date(timeArr[0].replaceAll('-', '/') + ' ' + timeArr[1].replaceAll('-', ':'));

        const dayNames = [
            'Sun',
            'Mon',
            'Tue',
            'Wed',
            'Thu',
            'Fri',
            'Sat'
        ];
        const monthNames = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec'
        ];

        this.elements.datetime.textContent = `${dayNames[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
    }

    /**
     * Update datetime with current playback offset
     */
    updateDatetimeWithOffset() {
        if (this.state.currentIndex < 0 || this.state.videoIndexes.length === 0) return;

        const videoKey = this.state.videoIndexes[this.state.currentIndex];
        const videoSet = this.state.videos[videoKey];

        if (!videoSet || !videoSet[0]) return;

        const startTime = videoSet[0].startTime;
        const currentTime = new Date(startTime.getTime() + (this.state.currentTimeframe * 1000));

        const dayNames = [
            'Sun',
            'Mon',
            'Tue',
            'Wed',
            'Thu',
            'Fri',
            'Sat'
        ];
        const monthNames = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec'
        ];

        this.elements.datetime.textContent = `${dayNames[currentTime.getDay()]}, ${monthNames[currentTime.getMonth()]} ${currentTime.getDate()}, ${currentTime.getFullYear()} ${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}:${String(currentTime.getSeconds()).padStart(2, '0')}`;
    }

    /**
     * Apply cooldown to prevent rapid actions
     */
    applyCooldown() {
        this.state.cooldown = true;
        setTimeout(() => {
            this.state.cooldown = false;
        }, this.config.cooldownTime);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.sentryViewer = new SentryModeViewer();
    });
} else {
    window.sentryViewer = new SentryModeViewer();
}
