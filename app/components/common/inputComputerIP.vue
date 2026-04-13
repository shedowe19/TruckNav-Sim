<script lang="ts" setup>
import { isBridgeRunning } from "~/assets/utils/telemetry/helpers";
const props = defineProps<{ requireGame?: boolean }>();
const { t } = useI18n();

const { selectedGame, commitSelection } = useGameSelection();
const { settings, updateGlobal } = useSettings();

const connectionError = ref("");
const ipInput = ref(settings.value.savedIP || "");
const isConnecting = ref(false);
const isConnected = ref(false);

const emit = defineEmits(["connected"]);

watch(isConnected, (connected) => {
    if (connected) {
        emit("connected");
    }
});

watch(
    () => settings.value.savedIP,
    (newIP) => {
        if (newIP && !ipInput.value) {
            ipInput.value = newIP;
        }
    },
);

const canConnect = computed(() => {
    if (isConnecting.value) return false;
    if (props.requireGame) return !!selectedGame.value;
    return true;
});

const handleConnect = async () => {
    connectionError.value = "Disconnected";

    if (!ipInput.value) {
        connectionError.value = t.value.inputIp.noValue;
        return;
    }

    isConnecting.value = true;

    try {
        if (!(await isBridgeRunning(ipInput.value)))
            throw new Error("Bridge not reachable");

        updateGlobal("savedIP", ipInput.value);
        isConnected.value = true;
        commitSelection();

        emit("connected");

        setTimeout(() => {
            isConnecting.value = false;
        }, 500);
    } catch (error) {
        isConnected.value = false;
        connectionError.value = t.value.inputIp.cannotConnect;
        isConnecting.value = false;
    }
};
</script>

<template>
    <div class="connect-pc-module">
        <div class="input-ip">
            <div class="form-details">
                <form @submit.prevent="handleConnect" action="">
                    <label for="ip">{{ t.inputIp.label }}</label>
                    <input
                        id="ip"
                        v-model="ipInput"
                        type="text"
                        name="ip"
                        :placeholder="t.inputIp.placeholder"
                        :disabled="isConnecting"
                    />
                </form>
                <p class="status">
                    <span :class="isConnected ? 'connected' : 'disconnected'">{{
                        isConnected ? t.inputIp.connected : (connectionError || t.inputIp.disconnected)
                    }}</span>
                </p>
            </div>

            <div class="description">
                <div class="note">
                    <Icon name="i-majesticons:information-circle-line" />
                    <p>{{ t.inputIp.noteTitle }}</p>
                </div>
                <p class="description-text">
                    {{ t.inputIp.noteText }}
                </p>
            </div>
        </div>

        <button class="btn" @click="handleConnect" :disabled="!canConnect">
            <span>{{ isConnecting ? t.inputIp.connecting : t.inputIp.connect }}</span>
            <Icon name="i-fa7-solid:chain" size="20" />
        </button>
    </div>
</template>

<style
    lang="scss"
    scoped
    src="~/assets/scss/scoped/common/inputComputerIP.scss"
></style>
