# Window Focus D-Bus

A GNOME Shell extension that exposes the currently focused window's `wm_class` and `title` over D-Bus. Enables external tools (dashboards, automation scripts, status bars) to react to window focus changes in real time — no polling needed.

## D-Bus Interface

**Bus:** Session  
**Name:** `com.github.WindowFocus`  
**Object path:** `/com/github/WindowFocus`

### Method

```
com.github.WindowFocus.GetFocusedWindow() → (wm_class: s, title: s)
```

Returns the `wm_class` and `title` of the currently focused window.

### Signal

```
com.github.WindowFocus.FocusedWindowChanged(wm_class: s, title: s)
```

Emitted immediately whenever the focused window changes. The Go backend in [Control Deck](https://github.com/Raj-Jai/control-deck) uses this signal via `godbus` for sub-100ms focus change events.

## Install

```sh
git clone https://github.com/Raj-Jai/window-focus-dbus.git
mkdir -p ~/.local/share/gnome-shell/extensions
cp -r window-focus-dbus/window-focus-dbus@jairaj.dev ~/.local/share/gnome-shell/extensions/
```

Restart GNOME Shell (Alt+F2, `r`, Enter) or log out and back in. Then enable via `gnome-extensions-app` or:

```sh
gnome-extensions enable window-focus-dbus@jairaj.dev
```

## Verify

```sh
gdbus monitor --session --dest com.github.WindowFocus --object-path /com/github/WindowFocus
```

Focus different windows — you should see `FocusedWindowChanged` signals with `wm_class` and `title`.

## Query the current window

```sh
gdbus call --session --dest com.github.WindowFocus --object-path /com/github/WindowFocus --method com.github.WindowFocus.GetFocusedWindow
```

## Compatibility

- GNOME Shell 45, 46, 47
- Wayland (primary target) — may also work on X11
