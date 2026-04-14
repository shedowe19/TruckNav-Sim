import { Capacitor } from "@capacitor/core";
import type { DirectionStep } from "~/assets/utils/routing/directions";

type TurnType = DirectionStep["type"];

// Thresholds in km at which to announce (TomTom-style).
// Each threshold fires when distance first drops BELOW its trigger distance.
const THRESHOLDS = [
    { key: 1.0, triggerBelow: 1.1 },
    { key: 0.5, triggerBelow: 0.55 },
    { key: 0.2, triggerBelow: 0.25 },
    { key: 0.0, triggerBelow: 0.08 },
] as const;
type ThresholdKey = (typeof THRESHOLDS)[number]["key"];

const VOICE_STORAGE_KEY = "truck-nav-voice";

// ─── Module-level shared state ────────────────────────────────────────────────
let _firedThresholds: Set<ThresholdKey> = new Set();
let _lastTurnType: TurnType | null = null;
let _cachedVoices: SpeechSynthesisVoice[] = [];
let _voicesLoaded = false;

// ─── Native voice resolver ────────────────────────────────────────────────────
// Cache key: "<langTag>:<preferredName>" so each combination is resolved once.
// Priority: user preference → Google voice (local) → Google voice (network) → first matching → plugin default.
const _nativeVoiceCache = new Map<string, number>(); // cacheKey → voice index (-1 = use default)

// Google TTS voices follow the pattern: "xx-xx-x-xxx-local" or "xx-xx-x-xxx-network"
const GOOGLE_VOICE_RE = /^[a-z]{2}-[a-z]{2}-x-[a-z]+-(?:local|network)$/i;
const isGoogleVoice = (voiceURI: string) => GOOGLE_VOICE_RE.test(voiceURI);

async function resolveNativeVoice(
    langTag: string,
    localePrefix: string,
    preferredName: string,
): Promise<number | undefined> {
    const cacheKey = `${langTag}:${preferredName}`;
    if (_nativeVoiceCache.has(cacheKey)) {
        const idx = _nativeVoiceCache.get(cacheKey)!;
        return idx >= 0 ? idx : undefined;
    }
    try {
        const { TextToSpeech } = await import("@capacitor-community/text-to-speech");
        const { voices } = await TextToSpeech.getSupportedVoices();

        const matching = voices
            .map((v, i) => ({ v, i }))
            .filter(({ v }) => v.lang.toLowerCase().startsWith(localePrefix.toLowerCase()));

        let pick = preferredName
            ? matching.find(({ v }) => v.voiceURI === preferredName)
            : undefined;
        if (!pick) pick = matching.find(({ v }) => isGoogleVoice(v.voiceURI) && v.localService);
        if (!pick) pick = matching.find(({ v }) => isGoogleVoice(v.voiceURI));
        if (!pick) pick = matching[0];

        const idx = pick ? pick.i : -1;
        _nativeVoiceCache.set(cacheKey, idx);
        return idx >= 0 ? idx : undefined;
    } catch {
        _nativeVoiceCache.set(cacheKey, -1);
        return undefined;
    }
}

// Speed warning state
const SPEED_WARN_TOLERANCE_KMH = 3;  // only warn when this many km/h over the limit
const SPEED_WARN_COOLDOWN_MS   = 30_000; // min 30 s between repeat warnings
let _speedWarnActive    = false;
let _speedWarnLastTime  = 0;

/** Returns true if we are running inside a Capacitor native shell (Android/iOS). */
function isNative(): boolean {
    return Capacitor.isNativePlatform();
}

/** Safe getter — returns null if speechSynthesis is not supported. */
function getSynth(): SpeechSynthesis | null {
    if (typeof window === "undefined") return null;
    return window.speechSynthesis ?? null;
}

/** Returns true if the platform supports speech synthesis. */
function isSpeechSupported(): boolean {
    return isNative() || getSynth() !== null;
}

/**
 * Pre-load the voice list.
 * Chrome/Electron: voices are loaded async; getVoices() returns [] on first call.
 * Android WebView: speechSynthesis may be undefined — we silently skip.
 * On native platforms this is a no-op (Capacitor TTS handles its own init).
 */
function initVoices() {
    if (!import.meta.client || _voicesLoaded || isNative()) return;

    const synth = getSynth();
    if (!synth) return; // speechSynthesis not supported (some Android WebViews)

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
            initVoices(); // safe — guarded inside
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

    const { settings } = useSettings();

    const speak = (text: string) => {
        if (!import.meta.client || !text) return;

        const langTag = locale.value === "de" ? "de-DE" : "en-GB";

        // ── Native Android / iOS: use Capacitor TTS ──────────────────────
        if (isNative()) {
            import("@capacitor-community/text-to-speech").then(async ({ TextToSpeech }) => {
                const voiceIndex = await resolveNativeVoice(langTag, locale.value, settings.value.selectedVoiceName ?? "");
                TextToSpeech.speak({
                    text,
                    lang: langTag,
                    rate: 0.92,
                    pitch: 1.0,
                    volume: 1.0,
                    category: "ambient",
                    ...(voiceIndex !== undefined ? { voice: voiceIndex } : {}),
                });
            }).catch(() => {
                // Fail silently — navigation continues without voice
            });
            return;
        }

        // ── Web / Electron: use Web Speech API ───────────────────────────
        const synth = getSynth();
        if (!synth) return; // speechSynthesis not available — fail silently

        // Chrome/Electron bug: cancel() immediately before speak() swallows the
        // utterance. We cancel first, then wait 50ms before speaking.
        synth.cancel();

        // Reload voices if cache is empty (handles late voiceschanged)
        if (_cachedVoices.length === 0) {
            const v = synth.getVoices();
            if (v.length > 0) _cachedVoices = v;
        }

        setTimeout(() => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = langTag;
            utterance.rate = 0.92;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            // Use saved voice preference, or fall back to best locale match
            const preferred = settings.value.selectedVoiceName;
            const match = preferred
                ? _cachedVoices.find((v) => v.name === preferred)
                : _cachedVoices.find((v) => v.lang === langTag) ||
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

        // Check from largest to smallest: fire the first threshold we've dropped below.
        // Using "dropped below" instead of "within band" ensures announcements are
        // never skipped when GPS fluctuations cause the distance to jump over a band.
        for (const { key, triggerBelow } of THRESHOLDS) {
            if (_firedThresholds.has(key)) continue;
            if (distanceKm < triggerBelow) {
                _firedThresholds.add(key);
                const phrase =
                    key === 0.0
                        ? buildNowPhrase(turnType)
                        : buildPrepPhrase(distanceKm, turnType);
                speak(phrase);
                break; // one announcement per tick — next tick handles the rest
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

    /** Speak a test sample — called from the settings test button. */
    const testVoice = () => {
        const v = t.value.voice;
        speak(`${v.inDistance} ${v.oneKilometer}, ${v.turnLeft}`);
    };

    const checkSpeedWarning = (truckSpeedKmH: number, limitKmH: number) => {
        if (!voiceEnabled.value) return;
        const { activeSettings } = useSettings();
        if (!activeSettings.value.hasSpeedWarning) return;
        if (limitKmH <= 0) return; // no limit data (ferry, no zone, etc.)

        const isOver = truckSpeedKmH > limitKmH + SPEED_WARN_TOLERANCE_KMH;

        if (!isOver) {
            _speedWarnActive = false;
            return;
        }

        const now = Date.now();
        if (_speedWarnActive && now - _speedWarnLastTime < SPEED_WARN_COOLDOWN_MS) return;

        _speedWarnActive  = true;
        _speedWarnLastTime = now;

        const displayLimit =
            activeSettings.value.units === "imperial"
                ? Math.round(limitKmH * 0.621371)
                : Math.round(limitKmH);

        speak(t.value.voice.speedWarning.replace("{limit}", String(displayLimit)));
    };

    const getVoicesForLocale = async (): Promise<{ label: string; voiceURI: string; index: number }[]> => {
        if (isNative()) {
            try {
                const { TextToSpeech } = await import("@capacitor-community/text-to-speech");
                const { voices } = await TextToSpeech.getSupportedVoices();
                return voices
                    .map((v, i) => ({
                        voiceURI: v.voiceURI,
                        label: (isGoogleVoice(v.voiceURI) ? "Google - " : "") + v.voiceURI + (v.localService ? " (offline)" : " (online)"),
                        index: i,
                        lang: v.lang,
                    }))
                    .filter(({ lang }) => lang.toLowerCase().startsWith(locale.value.toLowerCase()));
            } catch {
                return [];
            }
        }

        // Web / Electron: use cached Web Speech API voices
        const synth = getSynth();
        if (!synth) return [];

        // Electron quirk: getVoices() returns [] until the TTS service initialises,
        // which only happens after the first speak() call. Fire a silent utterance
        // to wake the service, then poll until voices appear.
        if (synth.getVoices().length === 0) {
            const dummy = new SpeechSynthesisUtterance(" ");
            dummy.volume = 0;
            dummy.rate = 10;
            synth.speak(dummy);
            synth.cancel();
        }

        // Poll every 100 ms for up to 2 s
        let voices: SpeechSynthesisVoice[] = [];
        for (let i = 0; i < 20; i++) {
            voices = synth.getVoices();
            if (voices.length > 0) break;
            await new Promise((r) => setTimeout(r, 100));
        }

        if (voices.length > 0) _cachedVoices = voices;

        const langTag = locale.value === "de" ? "de-DE" : "en-GB";
        const filtered = voices
            .map((v, i) => ({ voiceURI: v.name, label: v.name, index: i, lang: v.lang }))
            .filter(({ lang }) => lang === langTag || lang.startsWith(locale.value));

        // Fallback: if strict filter yields nothing, return all voices so picker is always usable
        return filtered.length > 0 ? filtered : voices.map((v, i) => ({ voiceURI: v.name, label: v.name, index: i, lang: v.lang }));
    };

    const clearVoiceCache = () => _nativeVoiceCache.clear();

    const resetVoice = () => {
        if (isNative()) {
            import("@capacitor-community/text-to-speech").then(({ TextToSpeech }) =>
                TextToSpeech.stop()
            ).catch(() => {});
        } else {
            const synth = getSynth();
            if (synth) synth.cancel();
        }
        _firedThresholds.clear();
        _lastTurnType = null;
    };

    return {
        voiceEnabled,
        setVoiceEnabled,
        testVoice,
        checkAnnouncement,
        checkSpeedWarning,
        announceArrived,
        announceRecalculating,
        resetVoice,
        isSpeechSupported,
        getVoicesForLocale,
        clearVoiceCache,
    };
};
