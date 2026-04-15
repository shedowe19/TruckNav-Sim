<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { ets2Expansions } from "~/data/ets2/ets2Expansions";
import { atsExpansions } from "~/data/ats/atsExpansions";

const { settings, activeSettings, updateProfile, updateGlobal, resetSettings } =
    useSettings();
const { t, locale, setLocale } = useI18n();
const { voiceEnabled, setVoiceEnabled, testVoice, getVoicesForLocale, clearVoiceCache, getElevenLabsVoices } = useVoiceNavigation();

const props = defineProps<{ closePanel: () => void }>();

const availableVoices = ref<{ label: string; voiceURI: string; index: number }[]>([]);

const selectedVoiceName = computed({
    get: () => settings.value.selectedVoiceName ?? "",
    set: (val: string) => {
        updateGlobal("selectedVoiceName", val);
        clearVoiceCache();
    },
});

// ── ElevenLabs ────────────────────────────────────────────────────────────────
const elevenLabsApiKey = computed({
    get: () => settings.value.elevenLabsApiKey ?? "",
    set: (val: string) => updateGlobal("elevenLabsApiKey", val),
});
const elevenLabsVoiceId = computed({
    get: () => settings.value.elevenLabsVoiceId ?? "",
    set: (val: string) => updateGlobal("elevenLabsVoiceId", val),
});
const elevenLabsVoices = ref<{ voice_id: string; name: string }[]>([]);
const isLoadingElVoices = ref(false);

const loadElevenLabsVoices = async () => {
    if (!elevenLabsApiKey.value) return;
    isLoadingElVoices.value = true;
    elevenLabsVoices.value = await getElevenLabsVoices(elevenLabsApiKey.value);
    isLoadingElVoices.value = false;
};

const elevenLabsActive = computed(
    () => !!elevenLabsApiKey.value && !!elevenLabsVoiceId.value,
);

onMounted(async () => {
    availableVoices.value = await getVoicesForLocale();
    if (elevenLabsApiKey.value) {
        elevenLabsVoices.value = await getElevenLabsVoices(elevenLabsApiKey.value);
    }
});

const isDlcPanelOpened = ref(false);
const isMetric = computed(() => activeSettings.value.units === "metric");
const isTextThemeLight = computed(
    () => activeSettings.value.textColor === "light",
);
const hasGuidedNavigation = computed(
    () => activeSettings.value.hasTurnNavigation === true,
);
const hasSpeedWarning = computed(
    () => activeSettings.value.hasSpeedWarning === true,
);

const selectedExpansion = computed(() => {
    return settings.value.selectedGame === "ets2"
        ? ets2Expansions
        : atsExpansions;
});

const toggleDlcPanel = () => {
    isDlcPanelOpened.value = !isDlcPanelOpened.value;
};

function toggleTextColor() {
    updateProfile("textColor", isTextThemeLight.value ? "dark" : "light");
}

function toggleUnits() {
    updateProfile("units", isMetric.value ? "imperial" : "metric");
}

function toggleGuidedNavigation() {
    updateProfile(
        "hasTurnNavigation",
        hasGuidedNavigation.value ? false : true,
    );
}

function toggleSpeedWarning() {
    updateProfile("hasSpeedWarning", !hasSpeedWarning.value);
}
</script>

<template>
    <div class="settings-panel">
        <div class="settings-title setting">
            <div class="icon-btn" v-on:click="closePanel">
                <Icon name="material-symbols:arrow-back-rounded" size="26" />
            </div>

            <div class="title-icon">
                <Icon name="lucide:settings" size="38" />

                <div>
                    <p class="panel-title">{{ t.settings.title }}</p>
                    <p class="panel-description">
                        {{ t.settings.description }}
                    </p>
                </div>
            </div>
        </div>

        <div class="separator"></div>

        <div class="option setting">
            <div class="option-title">
                <Icon name="lucide:map-plus" size="24" />
                <p>{{ t.settings.ownedDlcs }}</p>
            </div>
            <div class="owned-dlcs">
                <button
                    @click.prevent="toggleDlcPanel"
                    class="nav-btn settings-btn"
                >
                    {{ activeSettings.ownedDlcs.length }} /
                    {{ Object.keys(selectedExpansion).length }} {{ t.settings.active }}
                </button>
            </div>
        </div>

        <ColorOption
            option-title="Theme"
            icon-name="lucide:palette"
            color-element="themeColor"
        />

        <ColorOption
            option-title="Route"
            icon-name="lucide:route"
            color-element="routeColor"
        />

        <div class="option setting">
            <div class="option-title">
                <Icon name="lucide:type-outline" size="24" />
                <p>{{ t.settings.textTheme }}</p>
            </div>

            <div class="segmented-control" @click="toggleTextColor">
                <button
                    class="segment-btn"
                    :class="{ active: isTextThemeLight }"
                >
                    <span class="label">{{ t.settings.light }}</span>
                </button>

                <button
                    class="segment-btn"
                    :class="{ active: !isTextThemeLight }"
                >
                    <span class="label">{{ t.settings.dark }}</span>
                </button>
            </div>
        </div>

        <div class="option setting">
            <div class="option-title">
                <Icon name="lucide:volume-2" size="24" />
                <p>{{ t.settings.voice }}</p>
            </div>

            <div class="segmented-control">
                <button
                    class="segment-btn"
                    :class="{ active: voiceEnabled }"
                    @click="setVoiceEnabled(true)"
                >
                    <span class="label">{{ t.settings.on }}</span>
                </button>

                <button
                    class="segment-btn"
                    :class="{ activeOff: !voiceEnabled }"
                    @click="setVoiceEnabled(false)"
                >
                    <span class="label">{{ t.settings.off }}</span>
                </button>
            </div>

            <button
                @click.prevent="testVoice"
                class="nav-btn settings-btn"
                style="margin-top: 0.6rem; width: 100%;"
            >
                <Icon name="lucide:play" size="16" />
                {{ t.settings.voiceTest }}
            </button>
        </div>

        <div v-if="availableVoices.length > 0" class="option setting" style="flex-direction: column; align-items: flex-start; gap: 1rem;">
            <div class="option-title">
                <Icon name="lucide:mic" size="24" />
                <p>{{ t.settings.navigationVoice }}</p>
            </div>
            <select v-model="selectedVoiceName" class="nav-btn settings-btn voice-select">
                <option value="">{{ t.settings.voiceAuto }}</option>
                <option v-for="voice in availableVoices" :key="voice.index" :value="voice.voiceURI">
                    {{ voice.label }}
                </option>
            </select>
        </div>

        <!-- ElevenLabs TTS -->
        <div class="option setting" style="flex-direction: column; align-items: flex-start; gap: 1rem;">
            <div class="option-title">
                <Icon name="lucide:sparkles" size="24" />
                <p>
                    {{ t.settings.elevenLabs }}
                    <span v-if="elevenLabsActive" class="el-active-badge">{{ t.settings.elevenLabsActive }}</span>
                </p>
            </div>

            <div style="width: 100%; display: flex; gap: 0.6rem;">
                <input
                    v-model="elevenLabsApiKey"
                    type="password"
                    :placeholder="t.settings.elevenLabsApiKeyPlaceholder"
                    class="nav-btn settings-btn el-input"
                    style="flex: 1;"
                />
                <button
                    class="nav-btn settings-btn"
                    :disabled="!elevenLabsApiKey || isLoadingElVoices"
                    @click.prevent="loadElevenLabsVoices"
                >
                    {{ isLoadingElVoices ? t.settings.elevenLabsLoading : t.settings.elevenLabsLoad }}
                </button>
            </div>

            <select
                v-if="elevenLabsVoices.length > 0"
                v-model="elevenLabsVoiceId"
                class="nav-btn settings-btn voice-select"
            >
                <option value="">— {{ t.settings.elevenLabsVoice }} —</option>
                <option v-for="v in elevenLabsVoices" :key="v.voice_id" :value="v.voice_id">
                    {{ v.name }}
                </option>
            </select>
            <p v-else-if="!elevenLabsApiKey" class="el-hint">{{ t.settings.elevenLabsNoKey }}</p>
        </div>

        <div class="option setting">
            <div class="option-title">
                <Icon name="lucide:ruler" size="24" />
                <p>{{ t.settings.units }}</p>
            </div>

            <div class="segmented-control" @click="toggleUnits">
                <button class="segment-btn" :class="{ active: isMetric }">
                    <span class="label">{{ t.settings.metric }}</span>
                </button>

                <button class="segment-btn" :class="{ active: !isMetric }">
                    <span class="label">{{ t.settings.imperial }}</span>
                </button>
            </div>
        </div>

        <div class="option setting">
            <div class="option-title">
                <Icon name="lucide:gauge" size="24" />
                <p>{{ t.settings.speedWarning }}</p>
            </div>

            <div class="segmented-control" @click="toggleSpeedWarning">
                <button
                    class="segment-btn"
                    :class="{ active: hasSpeedWarning }"
                >
                    <span class="label">{{ t.settings.on }}</span>
                </button>

                <button
                    class="segment-btn"
                    :class="{ activeOff: !hasSpeedWarning }"
                >
                    <span class="label">{{ t.settings.off }}</span>
                </button>
            </div>
        </div>

        <div class="option setting">
            <div class="option-title">
                <Icon name="lucide:navigation-2" size="24" />
                <p>{{ t.settings.guidedNavigation }}</p>
            </div>

            <div class="segmented-control" @click="toggleGuidedNavigation">
                <button
                    class="segment-btn"
                    :class="{ active: hasGuidedNavigation }"
                >
                    <span class="label">{{ t.settings.on }}</span>
                </button>

                <button
                    class="segment-btn"
                    :class="{ activeOff: !hasGuidedNavigation }"
                >
                    <span class="label">{{ t.settings.off }}</span>
                </button>
            </div>
        </div>

        <div class="option setting">
            <div class="option-title">
                <Icon name="lucide:rotate-ccw" size="24" />
                <p>{{ t.settings.resetDefaults }}</p>
            </div>

            <button
                @click.prevent="resetSettings"
                class="nav-btn settings-btn default-color"
            >
                {{ t.settings.reset }}
            </button>
        </div>

        <div class="option setting">
            <div class="option-title">
                <Icon name="lucide:languages" size="24" />
                <p>{{ t.settings.language }}</p>
            </div>

            <div class="segmented-control">
                <button
                    class="segment-btn"
                    :class="{ active: locale === 'de' }"
                    @click="setLocale('de')"
                >
                    <span class="label">DE</span>
                </button>

                <button
                    class="segment-btn"
                    :class="{ active: locale === 'en' }"
                    @click="setLocale('en')"
                >
                    <span class="label">EN</span>
                </button>
            </div>
        </div>

        <Transition name="panel-pop">
            <ManageDlcsWindow
                v-if="isDlcPanelOpened"
                :close-panel="toggleDlcPanel"
            />
        </Transition>
    </div>
</template>

<style
    lang="scss"
    src="~/assets/scss/scoped/settings/settingsPanel.scss"
></style>
