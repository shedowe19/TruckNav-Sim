import type { DirectionStep } from "~/assets/utils/routing/directions";

type TurnType = DirectionStep["type"];

// Thresholds in km at which to announce (TomTom-style)
const THRESHOLDS = [1.0, 0.5, 0.0] as const;
type Threshold = (typeof THRESHOLDS)[number];

const VOICE_STORAGE_KEY = "truck-nav-voice";

// ─── Module-level shared state (not per-component) ───────────────────────────
// These must live outside the composable function so they are truly shared
// across all useVoiceNavigation() call sites (map.vue + settingsPanel.vue).
let _firedThresholds: Set<Threshold> = new Set();
let _lastTurnType: TurnType | null = null;
let _cachedVoices: SpeechSynthesisVoice[] = [];
let _voicesLoaded = false;

/**
 * Pre-load the voice list.
 * Chrome/Electron: voices are loaded asynchronously and getVoices() returns []
 * on the very first call. We listen for voiceschanged and cache the list.
 */
function initVoices() {
    if (!import.meta.client || _voicesLoaded) return;

    const synth = window.speechSynthesis;

    const load = () => {
        const v = synth.getVoices();
        if (v.length > 0) {
            _cachedVoices = v;
            _voicesLoaded = true;
        }
    };

    load(); // may already be available (Firefox fills synchronously)
    synth.addEventListener("voiceschanged", load);
}

// ─── Composable ──────────────────────────────────────────────────────────────
export const useVoiceNavigation = () => {
    const { t, locale } = useI18n();

    const voiceEnabled = useState<boolean>("voice-enabled", () => {
        if (import.meta.client) {
            // Init voices while we're setting up
            initVoices();
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

    // ── Phrase builders ────────────────────────────────────────────────────

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

    const buildPrepPhrase = (distKm: number, type: TurnType): string => {
        const v = t.value.voice;
        const action = getTurnAction(type);
        if (!action) return "";

        if (distKm >= 0.9) {
            return `${v.inDistance} ${v.oneKilometer}, ${action}`;
        } else {
            const meters = Math.round((distKm * 1000) / 100) * 100;
            return `${v.inDistance} ${meters} ${v.meter}, ${action}`;
        }
    };

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

    // ── Core speech function ───────────────────────────────────────────────

    const speak = (text: string) => {
        if (!import.meta.client || !text) return;

        const synth = window.speechSynthesis;

        // Chrome/Electron bug: cancel() immediately before speak() swallows the
        // utterance. We cancel first, then wait one microtask before speaking.
        synth.cancel();

        // Reload voices if cache is empty (handles late voiceschanged)
        if (_cachedVoices.length === 0) {
            _cachedVoices = synth.getVoices();
        }

        const langTag = locale.value === "de" ? "de-DE" : "en-GB";

        setTimeout(() => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = langTag;
            utterance.rate = 0.92;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            // Find best matching voice
            const match =
                _cachedVoices.find((v) => v.lang === langTag) ||
                _cachedVoices.find((v) => v.lang.startsWith(locale.value));

            if (match) utterance.voice = match;

            synth.speak(utterance);
        }, 50);
    };

    // ── Announcement logic ─────────────────────────────────────────────────

    /**
     * Call this on every telemetry tick while navigating.
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

        // Reset when we move to a new turn maneuver
        if (turnType !== _lastTurnType) {
            _firedThresholds.clear();
            _lastTurnType = turnType;
        }

        for (const threshold of THRESHOLDS) {
            if (_firedThresholds.has(threshold)) continue;

            const withinBand =
                threshold === 0.0
                    ? distanceKm < 0.08
                    : threshold === 0.5
                      ? distanceKm <= 0.55 && distanceKm > 0.08
                      : distanceKm <= 1.1 && distanceKm > 0.55;

            if (withinBand) {
                _firedThresholds.add(threshold);

                const phrase =
                    threshold === 0.0
                        ? buildNowPhrase(turnType)
                        : buildPrepPhrase(distanceKm, turnType);

                speak(phrase);
                break;
            }
        }
    };

    const announceArrived = () => {
        if (!voiceEnabled.value) return;
        _firedThresholds.clear();
        _lastTurnType = null;
        speak(t.value.voice.arrived);
    };

    const announceRecalculating = () => {
        if (!voiceEnabled.value) return;
        speak(t.value.voice.recalculating);
    };

    const resetVoice = () => {
        if (import.meta.client) window.speechSynthesis?.cancel();
        _firedThresholds.clear();
        _lastTurnType = null;
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
