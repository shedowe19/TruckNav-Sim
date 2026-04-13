<script lang="ts" setup>
const props = defineProps<{
    launchMap: () => void;
    goToDesktopIndex: () => void;
}>();
const { selectedGame, commitSelection } = useGameSelection();
const { isWeb, isElectron } = usePlatform();
const { t } = useI18n();

const COUNTDOWN_SECONDS = 10;
const countdown = ref(COUNTDOWN_SECONDS);
const countdownActive = ref(false);
let countdownTimer: ReturnType<typeof setInterval> | null = null;

const handleStart = () => {
    stopCountdown();
    commitSelection();
    props.launchMap();
};

const startCountdown = () => {
    countdown.value = COUNTDOWN_SECONDS;
    countdownActive.value = true;
    countdownTimer = setInterval(() => {
        countdown.value--;
        if (countdown.value <= 0) {
            stopCountdown();
            commitSelection();
            props.launchMap();
        }
    }, 1000);
};

const stopCountdown = () => {
    if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
    }
    countdownActive.value = false;
    countdown.value = COUNTDOWN_SECONDS;
};

watch(selectedGame, (newVal) => {
    stopCountdown();
    if (newVal) {
        startCountdown();
    }
});

onUnmounted(() => stopCountdown());

const progressPercent = computed(
    () => ((COUNTDOWN_SECONDS - countdown.value) / COUNTDOWN_SECONDS) * 100
);
</script>

<template>
    <div class="choose-game-section">
        <div class="top-tagline">
            <button
                v-show="isElectron"
                @click="goToDesktopIndex"
                class="back-btn"
            >
                <Icon name="material-symbols:arrow-back-rounded" size="22" />
            </button>

            <Icon name="material-symbols:globe" class="icon" size="22" />
            <span>{{ t.chooseGame.title }}</span>
        </div>

        <div class="game-selection" :style="{ width: isWeb ? '80%' : '85%' }">
            <div class="select-btns">
                <GameSelection
                    v-model="selectedGame"
                    :width="isWeb ? 450 : 950"
                />
            </div>
        </div>

        <div class="start-btn-wrapper">
            <button
                :disabled="!selectedGame"
                @click.prevent="handleStart"
                class="btn nav-btn"
                autofocus
            >
                <span>
                    {{ t.chooseGame.startNavigation }}
                    <template v-if="countdownActive">
                        ({{ countdown }})
                    </template>
                </span>
                <Icon name="material-symbols:map-rounded" size="20" />
            </button>

            <div v-if="countdownActive" class="countdown-bar">
                <div
                    class="countdown-bar-fill"
                    :style="{ width: progressPercent + '%' }"
                ></div>
            </div>
        </div>
    </div>
</template>

<style
    lang="scss"
    scoped
    src="~/assets/scss/scoped/layouts/chooseGame.scss"
></style>
