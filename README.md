# SentryMode Viewer

In some simple words "SentryMode Viewer" is just basic (belive me it's really basic, based purly on JS only) video "playback". It allows us Tesla owners to just copy all directories from drive where SentryMode saves all the events. 

[Tesla SentryMode Viewer](https://tesla.evergames.pl/ "Tesla SentryMode Viewer")


## Installation

Download the archive from Github using:
* the .zip file from GitHub (green download button)
* or `git clone`
* or released version

## Known issues

* Sometimes when you are viewing your footage, you might experience "freeze" effect or simply one of the playbacks "freezes" but others continue living their best life. In this case the simplest solution is to click to other camera a few times like 1-3 (heh.. "a few" isn't it? :D) and it fixes itself.
* The player control is custom made (because I wanted to have some fun lol, it was 24h challenge with 18h of break, yeah.. I should do more with my lazy a**)
* Info icon as well as camera icon doesn't work, the info icon was supposed to give info on how does it works so people can use live version rather then downloading all of this stuff and then viewing the footage, and the camera icon was supposed to take the screenshot of currently active camera, maybe in my free time I'll make it working.
* All timing calculation might be a little bit off, so bear that in mind when you see video slider moving away from desired place :D

## How does it work?

Well... the main goal was to mimic Tesla onboard SentryMode Video Playback, but I ended up thinking to not recreate everything from scratch so, the "portable" version of it was created. 

Any video that you select are not uploaded anywhere, it uses "Blob" data to lookup all video files from directory, rather then uploading it to the remote server (it simpler, faster and better in this case).

Let's begin with "How to operate this?", simply click on the list icon on the left in the header, select directory with all mp4 files as well as thumb.png and event.json and... you are done, click Play icon in the footer on the left side and do what you have to (by looking what the car wanted to show us).

## Screenshots? Yeah... why not

![Main site with video on it](src/image/TeslaSentryMode.png?raw=true "Main dashboard")

![The "upload" section when you choose directory](src/image/TeslaSentryMode_Directory.png?raw=true "Video uploader")
