<script lang="ts" setup>
import { ets2Expansions } from "~/data/ets2/ets2Expansions";
import { atsExpansions } from "~/data/ats/atsExpansions";

const { settings, activeSettings, updateProfile, resetSettings } =
    useSettings();
const { t, locale, setLocale } = useI18n();

const props = defineProps<{ closePanel: () => void }>();

const isDlcPanelOpened = ref(false);
const isMetric = computed(() => activeSettings.value.units === "metric");
const isTextThemeLight = computed(
    () => activeSettings.value.textColor === "light",
);
const hasGuidedNavigation = computed(
    () => activeSettings.value.hasTurnNavigation === true,
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
