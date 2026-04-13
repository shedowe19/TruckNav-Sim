import type { DirectionStep } from "~/assets/utils/routing/directions";

type TurnType = DirectionStep["type"];

// Thresholds in km at which to announce (TomTom-style)
const THRESHOLDS = [1.0, 0.5, 0.0] as const;
type Threshold = (typeof THRESHOLDS)[number];

const VOICE_STORAGE_KEY = "truck-nav-voice";

export const useVoiceNavigation = () => {
    const { t, locale } = useI18n();

    const voiceEnabled = useState<boolean>("voice-enabled", () => {
        if (import.meta.client) {
            const saved = localStorage.getItem(VOICE_STORAGE_KEY);
            return saved !== "false"; // default ON
        }
        return true;
    });

    const setVoiceEnabled = (val: boolean) => {
        voiceEnabled.value = val;
        if (import.meta.client) {
            localStorage.setItem(VOICE_STORAGE_KEY, String(val));
        }
    };

    // Track which threshold already fired for the current turn
    const firedThresholds = ref<Set<Threshold>>(new Set());
    const lastTurnType = ref<TurnType | null>(null);

    /**
     * Build the "prep" phrase for a given distance band.
     * e.g. "In einem Kilometer links abbiegen" or "In 500 Metern rechts abbiegen"
     */
    const buildPrepPhrase = (distKm: number, type: TurnType): string => {
        const v = t.value.voice;

        const action = getTurnAction(type);
        if (!action) return "";

        if (distKm >= 0.9) {
            // ~1 km band
            return `${v.inDistance} ${v.oneKilometer}, ${action}`;
        } else {
            // ~500 m band
            const meters = Math.round(distKm * 1000 / 100) * 100; // round to nearest 100m
            return `${v.inDistance} ${meters} ${v.meter}, ${action}`;
        }
    };

    /**
     * Build the "now" phrase spoken right at the turn.
     */
    const buildNowPhrase = (type: TurnType): string => {
        const v = t.value.voice;
        const map: Partial<Record<TurnType, string>> = {
            left: v.nowTurnLeft,
            right: v.nowTurnRight,
            "slight-left": v.nowSlightLeft,
            "slight-right": v.nowSlightRight,
            "sharp-left": v.nowSharpLeft,
            "sharp-right": v.nowSharpRight,
            roundabout: v.nowRoundabout,
            "exit-highway": v.nowExitHighway,
            destination: v.arrived,
        };
        return map[type] ?? "";
    };

    /**
     * Get the action part of a prep phrase ("links abbiegen" / "turn left" etc.)
     */
    const getTurnAction = (type: TurnType): string => {
        const v = t.value.voice;
        const map: Partial<Record<TurnType, string>> = {
            left: v.turnLeft,
            right: v.turnRight,
            "slight-left": v.turnSlightLeft,
            "slight-right": v.turnSlightRight,
            "sharp-left": v.turnSharpLeft,
            "sharp-right": v.turnSharpRight,
            roundabout: v.roundabout,
            "exit-highway": v.exitHighway,
            straight: v.straight,
        };
        return map[type] ?? "";
    };

    /**
     * Speak a phrase using the Web Speech API.
     * Uses the current locale's BCP-47 tag.
     */
    const speak = (text: string) => {
        if (!import.meta.client) return;
        if (!text) return;

        const synth = window.speechSynthesis;
        synth.cancel(); // interrupt any ongoing speech

        const utterance = new SpeechSynthesisUtterance(text);

        // Pick a voice that matches the locale
        const langTag = locale.value === "de" ? "de-DE" : "en-GB";
        utterance.lang = langTag;

        // TomTom-style: slightly slower, clear pronunciation
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Try to find a matching voice (especially on desktop)
        const voices = synth.getVoices();
        const match =
            voices.find((v) => v.lang.startsWith(langTag)) ||
            voices.find((v) => v.lang.startsWith(locale.value));

        if (match) utterance.voice = match;

        synth.speak(utterance);
    };

    /**
     * Main function — call this on every telemetry tick while navigating.
     * @param distanceKm  Distance to next turn in km (nextTurnDistance)
     * @param turnType    Type of next turn (fullRouteDirections[1]?.type)
     */
    const checkAnnouncement = (
        distanceKm: number,
        turnType: TurnType | undefined,
    ) => {
        if (!voiceEnabled.value || !turnType) return;
        if (
            turnType === "depart" ||
            turnType === "straight" ||
            turnType === "ferry"
        )
            return;

        // Reset fired set whenever the turn type changes
        if (turnType !== lastTurnType.value) {
            firedThresholds.value.clear();
            lastTurnType.value = turnType;
        }

        // Check thresholds from largest to smallest
        for (const threshold of THRESHOLDS) {
            if (firedThresholds.value.has(threshold)) continue;

            const withinBand =
                threshold === 0.0
                    ? distanceKm < 0.08 // within ~80m = "now"
                    : threshold === 0.5
                      ? distanceKm <= 0.55 && distanceKm > 0.12
                      : distanceKm <= 1.1 && distanceKm > 0.55;

            if (withinBand) {
                firedThresholds.value.add(threshold);

                const phrase =
                    threshold === 0.0
                        ? buildNowPhrase(turnType)
                        : buildPrepPhrase(distanceKm, turnType);

                speak(phrase);
                break; // only one announcement per tick
            }
        }
    };

    /**
     * Announce destination arrived.
     */
    const announceArrived = () => {
        if (!voiceEnabled.value) return;
        speak(t.value.voice.arrived);
        firedThresholds.value.clear();
        lastTurnType.value = null;
    };

    /**
     * Announce route recalculation.
     */
    const announceRecalculating = () => {
        if (!voiceEnabled.value) return;
        speak(t.value.voice.recalculating);
    };

    /**
     * Reset state (call when route is cleared).
     */
    const resetVoice = () => {
        if (import.meta.client) window.speechSynthesis?.cancel();
        firedThresholds.value.clear();
        lastTurnType.value = null;
    };

    return {
        voiceEnabled,
        setVoiceEnabled,
        checkAnnouncement,
        announceArrived,
        announceRecalculating,
        resetVoice,
    };
};
