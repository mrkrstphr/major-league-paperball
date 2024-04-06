## Setup

TL;DR: Setup your PI, install NodeJS, Python3, and chromium-browser. Clone the repo, copy `.env.example` to `.env`, adjust the values within, and then keep the app running with pm2.

### Setup Your Raspberry Pi

This is just like setting up any other Raspberry Pi. I recommend using Raspberry Pi OS, but any other OS that works on Pi should work here, but the individual commands that follow might not.

1. Setup Raspberry Pi OS on a micro sdcard. You can use a desktop or server image, depending on what else you want to do with this Pi and how you plan to set it up (SSH or keyboard and monitor directly on the Pi).
2. Run `sudo raspi-config nonint do_spi 0`
3. Reboot

### Setup NodeJS

Install nvm and use it to install Node. You can checkout [nvm's website](https://github.com/nvm-sh/nvm) for the latest release and installation instructions:

```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install v20.12.1
node -v
npm -v
```

Make sure both `node` and `npm` report a version to ensure they installed.

### Setup Python

Ensure python3 is installed:

```
python3 --version
```

If it's not:

```
sudo apt install python3
```

### Setup Misc Dependencies

Since this app relies on taking screenshots of a web app running on the Pi, you'll need to install the Chromium browser so Puppeteer has something to fire up the app in and take the screenshot. You can configure Puppeteer to use another browser in the `.env` file you will create later.

You'll also want `git` so that you can clone this repository. Alternately, you can download the source code from GitHub and unpack it on your Pi.

```
sudo apt install -y git chromium-browser
```

### Running the App

Clone the repository, setup a python virtual environment, and install node and python dependencies:

```
git clone https://github.com/mrkrstphr/major-league-paperball.git
cd major-league-paperball
npm install
python3 -m venv --system-site-packages .venv
.venv/bin/pip3 install -r requirements.txt
```

Copy the example environment file. Edit the file and follow the directions in it for setting a handful of variables:

```
cp .env.example .env
```

Now you should be all set to run the app. Since the app is a NodeJS app (that calls a python script to update the screen), you can use any method of running a NodeJS app. I suggest using PM2, which is a process manager that will keep the app running across crashes (sorry) and reboots.

```
npm install -g pm2
pm2 startup
pm2 start "npm start" --name "paperball"
pm2 save
```

The app should now be running and hopefully after a few seconds, your screen will be updated.

If it doesn't appear to be working, you can run `pm2 status` to verify that its running and `pm2 logs` to see any log information that might help understand what went wrong.
