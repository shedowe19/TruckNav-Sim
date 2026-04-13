export const de = {
    // Desktop Home
    desktopHome: {
        tagline: "Dein Trucking-Begleiter",
        title: "Willkommen bei TruckNav!",
        subtitle: "Hier findest du Anweisungen zur Einrichtung der App auf deinem Smartphone.",
        step1: "Stelle sicher, dass ETS2 / ATS auf deinem PC läuft.",
        step2a: "Falls das Plugin fehlt, klicke auf das Ordner-Symbol und wähle den Ordner mit der Spieldatei:",
        step3: "Stelle sicher, dass dein Smartphone mit demselben Netzwerk wie dein PC verbunden ist.",
        step4: "Öffne die TruckNav App oder den Browser mit der unten angezeigten IP-Adresse.",
        step5a: "TruckNav App:",
        step5b: "Browser:",
        statusLabel: "Aktueller Status:",
        connected: "Verbunden",
        offline: "Offline, bitte erneut öffnen.",
        telemetryRunning: "Telemetrie läuft.",
        minimizeHint: "Dieses Fenster",
        minimizeHint2: "minimieren",
        minimizeHint3: ", um GPS aktiv zu halten.",
        telemetryInfo: "Telemetrie läuft. Dieses Fenster minimieren, um das GPS aktiv zu lassen.",
        pluginActive: "Plugin Aktiv",
        pluginMissing: "Plugin Fehlt",
        remoteGps: "Remote GPS",
        localGps: "Lokales GPS",
    },

    // Choose Game
    chooseGame: {
        title: "Spiel auswählen",
        startNavigation: "Navigation starten",
        startCountdown: "Navigation starten",
    },

    // Mobile Index
    mobileIndex: {
        title: "Mit Computer verbinden",
    },

    // Input Computer IP
    inputIp: {
        label: "IP-Adresse:",
        placeholder: "Hier eingeben...",
        connect: "Verbinden",
        connecting: "Verbinde...",
        connected: "Verbunden",
        disconnected: "Getrennt",
        noValue: "Bitte einen Wert eingeben.",
        cannotConnect: "Verbindung fehlgeschlagen...",
        noteTitle: "Hinweis",
        noteText: "Gib die IP ein, die TruckNav auf deinem Computer anzeigt",
    },

    // Loading Screen
    loading: {
        text: "Lade Routendaten...",
    },

    // Top Bar (Navigation)
    topBar: {
        gameOffline: "Spiel Offline",
    },

    // Sheet Slide (Navigation)
    sheetSlide: {
        estimatedTime: "Geschätzte Zeit",
        distance: "Distanz",
        stop: "Stop",
        startNavigation: "Navigation starten",
        resume: "Fortsetzen",
        hide: "Ausblenden",
    },

    // Settings Panel
    settings: {
        title: "Einstellungen",
        description: "App-Einstellungen und Anpassungen",
        ownedDlcs: "Besessene DLCs",
        active: "aktiv",
        theme: "Farb-Theme",
        route: "Route",
        textTheme: "Text-Theme",
        light: "Hell",
        dark: "Dunkel",
        units: "Einheiten",
        metric: "Metrisch",
        imperial: "Imperial",
        guidedNavigation: "Geführte Navigation",
        on: "An",
        off: "Aus",
        resetDefaults: "Auf Standards zurücksetzen",
        reset: "Zurücksetzen",
        language: "Sprache",
    },
} as const;

export type Locale = typeof de;
export type LocaleKey = keyof Locale;
