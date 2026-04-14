<script lang="ts" setup>
import type { DirectionStep } from "~/assets/utils/routing/directions";

const { activeSettings } = useSettings();

const props = defineProps<{
    upcomingTurns: DirectionStep[];
    distanceToNextTurn: number;
    nextInstruction: string;
    active?: boolean;
    exit?: number | undefined;
}>();

const displayTurns = computed(() => {
    return props.upcomingTurns.slice(1, 3);
});

const { activeSettings } = useSettings();

// Format distance for navigation display:
//   metric  — below 1 km: "350 m", above: "1.2 km"
//   imperial — below 1 mi: "600 yd", above: "1.2 mi"
const formattedDistance = computed(() => {
    const km = props.distanceToNextTurn;
    if (activeSettings.value.units !== "metric") {
        const mi = km * 0.621371;
        if (mi < 1) return `${Math.round(km * 1760)} yd`;
        return `${mi.toFixed(1)} mi`;
    }
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
});
</script>

<template>
    <div class="card">
        <div class="turn-directions">
            <DirectionIcon
                v-for="(turn, index) in displayTurns"
                :key="turn.id"
                :type="turn.type"
                :exit-count="
                    turn.type === 'roundabout' ? turn.exitCount : undefined
                "
                :active="index === 0"
                :active-color="activeSettings.routeColor"
            />
        </div>
        <div class="turn-info">
            <p>{{ formattedDistance }}</p>
            <p>{{ nextInstruction }}</p>
        </div>
    </div>
</template>

<style scoped src="~/assets/scss/scoped/navigation/maneuverCard.scss"></style>
