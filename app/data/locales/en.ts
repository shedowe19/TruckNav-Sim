import type { Locale } from "./de";

export const en: Locale = {
    // Desktop Home
    desktopHome: {
        tagline: "Your Trucking Companion",
        title: "Welcome to TruckNav!",
        subtitle: "Below you'll find instructions to set up the app on your phone.",
        step1: "Make sure ETS2 / ATS is running on your PC.",
        step2a: "If the plugin is missing, click the folder icon and select the game's executable folder:",
        step3: "Ensure your phone is connected to the same network as your PC.",
        step4: "Open the TruckNav app or web browser using the IP address below.",
        step5a: "TruckNav App:",
        step5b: "Browser:",
        statusLabel: "Current Status:",
        connected: "Connected",
        offline: "Offline, try opening again.",
        telemetryRunning: "Telemetry is running.",
        minimizeHint: "Minimize",
        minimizeHint2: "this window",
        minimizeHint3: " to keep the GPS active.",
        telemetryInfo: "Telemetry is running. Minimize this window to keep the GPS active.",
        pluginActive: "Plugin Active",
        pluginMissing: "Plugin Missing",
        remoteGps: "Remote GPS",
        localGps: "Local GPS",
    },

    // Choose Game
    chooseGame: {
        title: "Select Game",
        startNavigation: "Start Navigation",
        startCountdown: "Start Navigation",
    },

    // Mobile Index
    mobileIndex: {
        title: "Pair with Computer",
    },

    // Input Computer IP
    inputIp: {
        label: "IP Address:",
        placeholder: "Type here...",
        connect: "Connect",
        connecting: "Connecting...",
        connected: "Connected",
        disconnected: "Disconnected",
        noValue: "Please input a value.",
        cannotConnect: "Could not connect...",
        noteTitle: "Note",
        noteText: "Enter the IP shown in TruckNav from your computer",
    },

    // Loading Screen
    loading: {
        text: "Loading Route Data...",
    },

    // Top Bar (Navigation)
    topBar: {
        gameOffline: "Game Offline",
    },

    // Sheet Slide (Navigation)
    sheetSlide: {
        estimatedTime: "Estimated Time",
        distance: "Distance",
        stop: "Stop",
        startNavigation: "Start Navigation",
        resume: "Resume",
        hide: "Hide",
    },

    // Settings Panel
    settings: {
        title: "Settings",
        description: "App preferences and customization",
        ownedDlcs: "Owned DLCs",
        active: "active",
        theme: "Theme",
        route: "Route",
        textTheme: "Text Theme",
        light: "Light",
        dark: "Dark",
        units: "Units",
        metric: "Metric",
        imperial: "Imperial",
        guidedNavigation: "Guided Navigation",
        speedWarning: "Speed Warning",
        on: "On",
        off: "Off",
        resetDefaults: "Reset to Defaults",
        reset: "Reset",
        language: "Language",
        voice: "Voice Navigation",
        voiceTest: "Test Voice",
    },

    // Voice Navigation
    voice: {
        inDistance: "In",
        meter: "meters",
        kilometer: "kilometers",
        oneKilometer: "one kilometer",
        turnLeft: "turn left",
        turnRight: "turn right",
        turnSlightLeft: "keep left",
        turnSlightRight: "keep right",
        turnSharpLeft: "turn sharp left",
        turnSharpRight: "turn sharp right",
        keepLeft: "keep left",
        keepRight: "keep right",
        straight: "continue straight",
        roundabout: "take the roundabout",
        exitHighway: "take the exit",
        nowTurnLeft: "Turn left now",
        nowTurnRight: "Turn right now",
        nowSlightLeft: "Keep left now",
        nowSlightRight: "Keep right now",
        nowSharpLeft: "Turn sharp left now",
        nowSharpRight: "Turn sharp right now",
        nowKeepLeft: "Keep left now",
        nowKeepRight: "Keep right now",
        nowRoundabout: "Enter the roundabout now",
        nowExitHighway: "Take the exit now",
        arrived: "You have reached your destination",
        recalculating: "Recalculating route",
        speedWarning: "Speed limit of {limit} exceeded, please check your speed",
    },
} as const;
