<script lang="ts" setup>
const { selectedGame } = useGameSelection();
const { t } = useI18n();

const emit = defineEmits(["connected"]);
</script>

<template>
    <section class="section-mobile-menu">
        <div class="title">
            <Icon
                class="icon"
                name="i-material-symbols:connected-tv-outline"
                size="20"
            />
            <span>{{ t.mobileIndex.title }}</span>
        </div>

        <div class="content">
            <GameSelection v-model="selectedGame" :width="150" />

            <InputComputerIP
                @connected="emit('connected')"
                :style="{ width: '100%' }"
                :require-game="true"
            />
        </div>
    </section>
</template>

<style
    scoped
    lang="scss"
    src="~/assets/scss/scoped/layouts/mobileIndex.scss"
></style>
