#!/usr/bin/env bash

./node_modules/.bin/tsc
cp -R app/views/*.hbs app/views/partials app/views/layouts dist/app/views
cp .env.example README.md requirements.txt display.py package*json dist/
