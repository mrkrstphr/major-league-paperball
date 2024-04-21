#!/usr/bin/env bash

./node_modules/.bin/tsc
cp -R app/views/*.hbs app/views/partials dist/app/views
