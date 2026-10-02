#!/bin/bash

# chmod +x run.sh
# arg 1: app | web
# arg 2: install | run


#linux register shortcut:
dconf read /org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom1/name
dconf read /org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom1/command
dconf read /org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom1/binding

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

open_terminal() {
    local DIR="$1"
    local COMMAND="$2"

    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        osascript -e "tell application \"Terminal\" to do script \"cd '$DIR' && $COMMAND\""

    elif command -v gnome-terminal >/dev/null 2>&1; then
        # Linux - GNOME
        gnome-terminal --working-directory="$DIR" \
            -- bash -c "$COMMAND; exec bash"

    elif command -v konsole >/dev/null 2>&1; then
        # Linux - KDE
        konsole --workdir "$DIR" \
            -e bash -c "$COMMAND; exec bash"

    elif command -v xfce4-terminal >/dev/null 2>&1; then
        # Linux - XFCE
        xfce4-terminal --working-directory="$DIR" \
            -- bash -c "$COMMAND; exec bash"

    elif command -v x-terminal-emulator >/dev/null 2>&1; then
        # Generic Linux
        x-terminal-emulator -e bash -c \
            "cd '$DIR' && $COMMAND; exec bash"

    else
        echo "ERROR: Could not find a supported terminal emulator."
        exit 1
    fi
}

APP="$1"
ACTION="$2"

case "$APP" in

    web)
        case "$ACTION" in

            install)
                echo "Installing socket dependencies..."
                cd "$ROOT_DIR/socket"
                npm i

                echo "Installing web dependencies..."
                cd "$ROOT_DIR/web"
                npm i
                ;;

            run)
                echo "Starting socket..."
                open_terminal \
                    "$ROOT_DIR/socket" \
                    "npm start"

                echo "Starting web..."
                open_terminal \
                    "$ROOT_DIR/web" \
                    "npm run dev"
                ;;

            *)
                echo "Usage: ./run.sh web {install|run}"
                exit 1
                ;;
        esac
        ;;

    app)
        case "$ACTION" in

            install)
                echo "Installing app dependencies..."
                cd "$ROOT_DIR/app"
                npm i
                ;;

            run)
                echo "Starting app..."
                cd "$ROOT_DIR/app"
                npm start
                ;;

            *)
                echo "Usage: ./run.sh app {install|run}"
                exit 1
                ;;
        esac
        ;;

    *)
        echo "Usage:"
        echo "  ./run.sh web install"
        echo "  ./run.sh web run"
        echo "  ./run.sh app install"
        echo "  ./run.sh app run"
        exit 1
        ;;

esac

echo "Done!"