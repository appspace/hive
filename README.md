# Hive

Hive is a Pebble app for controlling an [ecobee](https://www.ecobee.com)
thermostat from a Pebble smartwatch.

Hive lets you:

- Control thermostat temperature settings.
- See thermostat and sensor values.
- Change thermostat modes.
- Set Home, Away, and Sleep holds.
- Resume the thermostat program.

## Supported Watches

- Emery, Pebble Time 2
- Flint, Pebble 2 HR
- Gabbro, Pebble Time 2 Round

## How To Use

1. Install Hive on your Pebble from the [Pebble App Market](https://apps.repebble.com/hive-for-ecobee_56c3897cf3dab7ddce00001c).
2. On first run, Hive displays a short PIN to link your Pebble to your ecobee account.
3. Go to [ecobee.com](https://www.ecobee.com), log into your ecobee account, and open the **My Apps** section in the menu.
4. Choose **Add Application**, enter the PIN, click "Validate" and then "Add App".
5. Return to your Pebble and press the middle/select button.
6. The main screen shows your thermostat state.
7. Press **Up** to increase the set temperature.
8. Press **Down** to lower the set temperature.
9. Press **Select** to open the menu.

## Building And Running

Install dependencies with `npm install`

Create a local `.env` file with your ecobee app client ID:

```text
ECOBEE_CLIENT_ID=your_ecobee_client_id_here
```

`npm run build` generates `src/pkjs/generated-config.js` from that value. Both
`.env` and the generated config file are ignored by Git.

`npm start` builds and installs `build/hive.pbw` into the Emery emulator with logs enabled.

To install on a paired phone:

```sh
pebble install --phone <ip> build/hive.pbw
```

Use `npm run build`, not plain `pebble build`, so the local ecobee client ID is
generated before PebbleKit JS is bundled.

## Project Layout

```text
resources/images/app_logo.png App menu icon
scripts/generate-config.js    Generates local PKJS config from .env
src/c/dashboard.c             Native dashboard drawing
src/c/pin.c                   Native pin screen drawing
src/c/hive.h                  Shared C types, state, and function declarations
src/c/main.c                  Native app lifecycle and button handlers
src/c/menu.c                  Native MenuLayer setup and callbacks
src/c/messages.c              Native AppMessage send/receive handling
src/c/state.c                 Shared C app state
src/c/util.c                  Native drawing colors, tuple helpers, key helpers
src/pkjs/constants.js         Shared PKJS constants
src/pkjs/controller.js        Phone-side command controller
src/pkjs/ecobee-api.js        ecobee thermostat API calls
src/pkjs/generated-config.js  Generated from .env, ignored by Git
src/pkjs/http.js              Promise wrapper around XMLHttpRequest
src/pkjs/index.js             PebbleKit JS entry point
src/pkjs/oauth.js             ecobee PIN OAuth and token refresh
src/pkjs/settings.js          PKJS localStorage persistence
src/pkjs/thermostat.js        Thermostat formatting and request builders
src/pkjs/watch-state.js       AppMessage helpers for watch state updates
.env.example                  Example local ecobee client ID config
wscript                       Pebble native build rules
```

## Notes

- Build artifacts are written to `build/`; the PBW is `build/hive.pbw`.
- Watch code handles display/input only; API calls and OAuth run in PKJS.

## Documentation

Full SDK docs and tutorials: <https://developer.repebble.com>
