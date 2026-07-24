import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

const BUS_NAME = 'com.github.WindowFocus';
const OBJECT_PATH = '/com/github/WindowFocus';
const IFACE_XML = `
<node>
  <interface name="com.github.WindowFocus">
    <method name="GetFocusedWindow">
      <arg type="s" name="wm_class" direction="out"/>
      <arg type="s" name="title" direction="out"/>
    </method>
    <signal name="FocusedWindowChanged">
      <arg type="s" name="wm_class"/>
      <arg type="s" name="title"/>
    </signal>
  </interface>
</node>`;

export default class WindowFocusExtension extends Extension {
    enable() {
        this._wmClass = '';
        this._title = '';
        this._dbusConnection = null;
        this._dbusId = 0;
        this._focusId = 0;

        this._focusId = global.display.connect('notify::focus-window', () => {
            this._updateFocus();
        });

        const ifaceInfo = Gio.DBusNodeInfo.new_for_xml(IFACE_XML).interfaces[0];

        this._busOwnerId = Gio.bus_own_name(
            Gio.BusType.SESSION,
            BUS_NAME,
            Gio.BusNameOwnerFlags.REPLACE,
            conn => {
                this._dbusConnection = conn;
                this._dbusId = conn.register_object(
                    OBJECT_PATH, ifaceInfo,
                    (conn, sender, path, iface, method, params, invocation) => {
                        if (method === 'GetFocusedWindow') {
                            invocation.return_value(
                                GLib.Variant.new('(ss)', [this._wmClass, this._title])
                            );
                        }
                    },
                    null, null
                );
                this._emitFocus();
            },
            () => log('WindowFocus: name acquired'),
            () => log('WindowFocus: name lost')
        );

        this._updateFocus();
    }

    disable() {
        if (this._focusId) {
            global.display.disconnect(this._focusId);
            this._focusId = 0;
        }
        if (this._dbusId && this._dbusConnection) {
            this._dbusConnection.unregister_object(this._dbusId);
            this._dbusId = 0;
        }
        if (this._busOwnerId) {
            Gio.bus_unown_name(this._busOwnerId);
            this._busOwnerId = 0;
        }
        this._dbusConnection = null;
    }

    _updateFocus() {
        const win = global.display.focus_window;
        if (win) {
            this._wmClass = win.get_wm_class() || '';
            this._title = win.get_title() || '';
        } else {
            this._wmClass = '';
            this._title = '';
        }
        this._emitFocus();
    }

    _emitFocus() {
        if (!this._dbusConnection) return;
        try {
            this._dbusConnection.emit_signal(
                null, OBJECT_PATH, 'com.github.WindowFocus',
                'FocusedWindowChanged',
                GLib.Variant.new('(ss)', [this._wmClass, this._title])
            );
        } catch (e) {
            log(`WindowFocus: emit error: ${e}`);
        }
    }
}
