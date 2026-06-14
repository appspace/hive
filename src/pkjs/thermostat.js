var settings = require("./settings").settings;

var HOLD_TYPE_BY_ACTION = {
  nextPeriod: "nextTransition",
  useEndTime4hour: "holdHours",
  useEndTime2hour: "holdHours",
};

var HOLD_HOURS_BY_ACTION = {
  useEndTime4hour: 4,
  useEndTime2hour: 2,
};

function selectedThermostat(list) {
  var selectedId = settings().selectedThermostatId;
  return (
    list.find(function (thermostat) {
      return thermostat.identifier === selectedId;
    }) || list[0]
  );
}

function dashboardFromThermostat(thermostat, thermostatCount, status) {
  var useCelsius = thermostat.settings.useCelsius;
  var hvacMode = thermostat.settings.hvacMode;
  var runningEvents = thermostat.events || [];
  var heatDisabled = runningEvents.some(function (event) {
    return event.running && event.isHeatOff;
  });
  var coolDisabled = runningEvents.some(function (event) {
    return event.running && event.isCoolOff;
  });
  var dashboard = {
    name: truncate(thermostat.name || "Thermostat", 18),
    mode: "OFF",
    modeColor: "off",
    temperature: formatTemp(thermostat.runtime.actualTemperature, useCelsius),
    desiredTemperature: "Off",
    humidity: String(thermostat.runtime.actualHumidity || 0),
    hold: hasHold(thermostat),
    thermostatCount: thermostatCount,
    hasHold: hasHold(thermostat),
    hasSensors: !!(thermostat.remoteSensors && thermostat.remoteSensors.length),
    status: status,
  };

  if ((hvacMode === "heat" || hvacMode === "auxHeatOnly") && !heatDisabled) {
    dashboard.mode = hvacMode === "auxHeatOnly" ? "AUX" : "HEAT";
    dashboard.modeColor = "heat";
    dashboard.heatHold = formatTemp(thermostat.runtime.desiredHeat, useCelsius);
    dashboard.desiredTemperature = dashboard.heatHold;
  } else if (hvacMode === "cool" && !coolDisabled) {
    dashboard.mode = "COOL";
    dashboard.modeColor = "cool";
    dashboard.coolHold = formatTemp(thermostat.runtime.desiredCool, useCelsius);
    dashboard.desiredTemperature = dashboard.coolHold;
  } else if (hvacMode === "auto") {
    dashboard.mode = "AUTO";
    dashboard.modeColor = "auto";
    dashboard.coolHold = coolDisabled
      ? "Off"
      : formatTemp(thermostat.runtime.desiredCool, useCelsius);
    dashboard.heatHold = heatDisabled
      ? "Off"
      : formatTemp(thermostat.runtime.desiredHeat, useCelsius);
    dashboard.desiredTemperature =
      dashboard.coolHold + "-" + dashboard.heatHold;
  }

  return dashboard;
}

function sensorItems(thermostat) {
  return (thermostat.remoteSensors || [])
    .map(function (sensor) {
      var capabilities = sensor.capability || [];
      var temperature = capabilities.find(function (cap) {
        return cap.type === "temperature";
      });
      var occupancy = capabilities.find(function (cap) {
        return cap.type === "occupancy";
      });
      var sensorTemp = temperature ? Number(temperature.value) : NaN;
      var offline = !isFinite(sensorTemp);
      var temp = offline
        ? ""
        : formatTemp(sensorTemp, thermostat.settings.useCelsius);
      var occupied = offline
        ? "Offline"
        : occupancy
          ? occupancy.value === "true"
            ? "Occupied"
            : "Unoccupied"
          : "";

      return {
        title: truncate(sensor.name + (temp ? " " + temp : ""), 18),
        subtitle: occupied || sensor.type || "",
      };
    })
    .sort(function (a, b) {
      return a.title.toUpperCase() > b.title.toUpperCase() ? 1 : -1;
    });
}

function createTemperatureHoldEvent(thermostat, newHeat, newCool) {
  var holdAction = thermostat.settings.holdAction;
  return {
    selection: {
      selectionType: "thermostats",
      selectionMatch: thermostat.identifier,
    },
    functions: [
      {
        type: "setHold",
        params: {
          holdType: HOLD_TYPE_BY_ACTION[holdAction] || "indefinite",
          holdHours: HOLD_HOURS_BY_ACTION[holdAction] || null,
          coolHoldTemp: newCool,
          heatHoldTemp: newHeat,
        },
      },
    ],
  };
}

function createClimateHoldEvent(thermostat, climate) {
  return {
    selection: {
      selectionType: "thermostats",
      selectionMatch: thermostat.identifier,
    },
    functions: [
      {
        type: "setHold",
        params: {
          holdType: "indefinite",
          holdClimateRef: climate,
        },
      },
    ],
  };
}

function createResumeProgramEvent(thermostat) {
  return {
    selection: {
      selectionType: "thermostats",
      selectionMatch: thermostat.identifier,
    },
    functions: [
      {
        type: "resumeProgram",
        params: {
          resumeAll: true,
        },
      },
    ],
  };
}

function createChangeModeRequest(thermostat, newMode) {
  return {
    selection: {
      selectionType: "thermostats",
      selectionMatch: thermostat.identifier,
    },
    thermostat: {
      settings: {
        hvacMode: newMode,
      },
    },
  };
}

function availableModes(thermostat) {
  var canHeat =
    thermostat.settings.heatStages > 0 || thermostat.settings.hasHeatPump;
  var canCool =
    thermostat.settings.coolStages > 0 || thermostat.settings.hasHeatPump;
  var canAuxHeat =
    thermostat.settings.hasHeatPump &&
    (thermostat.settings.hasElectric ||
      thermostat.settings.hasBoiler ||
      thermostat.settings.hasForcedAir);

  return [
    canHeat && "heat",
    canCool && "cool",
    thermostat.settings.autoHeatCoolFeatureEnabled &&
      canCool &&
      canHeat &&
      "auto",
    canAuxHeat && "auxHeatOnly",
    "off",
  ].filter(Boolean);
}

function modeTitle(mode) {
  if (mode === "heat") return "Heat";
  if (mode === "cool") return "Cool";
  if (mode === "auto") return "Auto";
  if (mode === "auxHeatOnly") return "Aux";
  return "Off";
}

function hasHold(thermostat) {
  var holdTypes = ["hold", "autoAway", "autoHome"];
  return (thermostat.events || []).some(function (event) {
    return event.running && holdTypes.indexOf(event.type) !== -1;
  });
}

function formatTemp(canonical, useCelsius) {
  if (canonical === undefined || canonical === null) return "--";
  if (useCelsius)
    return String(Math.round((2 * (canonical / 10 - 32) * 5) / 9) / 2);
  return String(Math.round(canonical / 10));
}

function truncate(value, max) {
  value = value || "";
  return value.length > max ? value.substring(0, max - 1) + "." : value;
}

module.exports = {
  selectedThermostat: selectedThermostat,
  dashboardFromThermostat: dashboardFromThermostat,
  sensorItems: sensorItems,
  createTemperatureHoldEvent: createTemperatureHoldEvent,
  createClimateHoldEvent: createClimateHoldEvent,
  createResumeProgramEvent: createResumeProgramEvent,
  createChangeModeRequest: createChangeModeRequest,
  availableModes: availableModes,
  modeTitle: modeTitle,
};
