@echo off
setlocal
set "EXPO_OFFLINE=1"
npx expo start --lan %*
