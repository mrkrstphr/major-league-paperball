#!/usr/bin/env bash

./node_modules/.bin/tsc
cp -R assets dist/
cp -R .env.example README.md package*json dist/
