<template>
    <div>
        <!-- Сетка с тултипом -->
        <div>
            <div class="contribution-graph">
                <div class="months-row">
                    <div class="day-label-spacer"></div>
                    <div v-for="(month, index) in monthLabels" :key="index" class="month-label">
                        {{ month }}
                    </div>
                </div>

                <div class="graph-body">
                    <div class="day-labels">
                        <div v-for="(label, index) in dayLabels" :key="index" class="day-label">
                            {{ label }}
                        </div>
                    </div>

                    <div class="grid" ref="gridRef">
                        <div v-for="(row, rowIndex) in grid" :key="rowIndex" class="grid-row">
                            <div
                                v-for="(cell, colIndex) in row"
                                :key="colIndex"
                                class="square"
                                :class="`level-${getLevel(cell.count)}`"
                                role="button"
                                @mouseenter="showGridTooltip($event, cell)"
                                @mouseleave="hideGridTooltip"
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
            <div
                v-if="hoverGridCell"
                class="cg-tooltip"
                :style="{
                    top: tooltipGridY + 'px',
                    left: tooltipGridX + 'px',
                    transform: 'translateX(-50%) translateY(-100%)',
                }"
            >
                <strong>{{ hoverGridCell.count }}</strong> contributions
                <div class="cg-tooltip-date">{{ formatDate(hoverGridCell.date) }}</div>
                <div class="cg-tooltip-arrow"></div>
            </div>
        </div>

        <!-- Легенда с тултипом -->
        <div>
            <!-- Легенда -->
            <div class="cg-legend" ref="legendRef">
                <span>Меньше</span>
                <div class="cg-legend-colors">
                    <div
                        v-for="(level, i) in legendLevels"
                        :key="i"
                        class="square"
                        :class="level.class"
                        @mouseenter="showLegendTooltip($event, level)"
                        @mouseleave="hideLegendTooltip"
                    />
                </div>
                <span>Больше</span>
            </div>

            <!-- Тултип легенды -->
            <div
                v-if="hoverLegendCell"
                class="cg-tooltip"
                :style="{
                    top: tooltipLegendY + 'px',
                    left: tooltipLegendX + 'px',
                    transform: 'translateX(-50%) translateY(-100%)',
                }"
            >
                {{ hoverLegendCell.text }}
                <div class="cg-tooltip-arrow"></div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue"; // Импортируем реактивные переменные и хук жизненного цикла из Vue
import { addDays, addWeeks, format, subDays, subWeeks, getDay } from "date-fns";
import { ru } from "date-fns/locale";
import { getContributions } from "../api/request";

const contributions = ref({});
const grid = ref([]);
const monthLabels = ref([]);
const dayLabels = ["", "Пн", "", "Ср", "", "Пт", ""];

// Для сетки
const gridRef = ref(null);
const legendRef = ref(null);
const hoverGridCell = ref(null);
const tooltipGridX = ref(0);
const tooltipGridY = ref(0);

// Для легенды
const hoverLegendCell = ref(null);
const tooltipLegendX = ref(0);
const tooltipLegendY = ref(0);

// Данные легенды
const legendLevels = [
    { class: "level-0", text: "No contributions" },
    { class: "level-1", text: "1 – 9 contributions" },
    { class: "level-2", text: "10 – 19 contributions" },
    { class: "level-3", text: "20 – 29 contributions" },
    { class: "level-4", text: "30+ contributions" },
];

// Получение данных после монтирования компонента
onMounted(async () => {
    try {
        contributions.value = await getContributions();
        buildGrid();
    } catch (error) {
        console.error("Ошибка при получении данных:", error);
    }
});

// Функция построение сетки
const buildGrid = () => {
    const today = new Date();
    const dayOfWeek = getDay(today);
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const thisMonday = subDays(today, daysToMonday);
    const startDate = subWeeks(thisMonday, 50);

    grid.value = Array.from({ length: 7 }, () => []);

    for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 51; col++) {
            const weekMonday = addWeeks(startDate, col);
            const date = addDays(weekMonday, row);
            const dateStr = format(date, "yyyy-MM-dd");
            const count = contributions.value[dateStr] || 0;
            grid.value[row][col] = { date, count, dateStr };
        }
    }

    calculateMonthLabels();
};

// Функция для вычисления меток месяцев
const calculateMonthLabels = () => {
    monthLabels.value = Array(51).fill("");
    let prevMonth = "";

    for (let col = 0; col < 51; col++) {
        for (let row = 0; row < 7; row++) {
            const date = grid.value[row][col].date;
            const curMonth = format(date, "MMM", { locale: ru });
            if (curMonth !== prevMonth) {
                monthLabels.value[col] = curMonth;
                prevMonth = curMonth;
                break;
            }
        }
    }
};

// Функция для определения уровня активности на сетке
const getLevel = (count) => {
    if (count === 0) return 0;
    if (count <= 9) return 1;
    if (count <= 19) return 2;
    if (count <= 29) return 3;
    return 4;
};

const formatDate = (date) => {
    return format(date, "EEEE, MMMM dd, yyyy", { locale: ru });
};

// Тултип сетки
const showGridTooltip = (event, cell) => {
    // Сохраняем данные ячейки для отображения в тултипе
    hoverGridCell.value = cell;
    // Получаем координаты и размеры ячейки
    const rect = event.target.getBoundingClientRect();

    // Учитываем прокрутку страницы
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

    // Позиционируем тултип: центр ячейки по X, 8 пикселей над ячейкой по Y
    tooltipGridX.value = rect.left + rect.width / 2 + scrollLeft;
    tooltipGridY.value = rect.top - 8 + scrollTop; // 8px над ячейкой
};

// Функция для скрытия тултипа сетки
const hideGridTooltip = () => (hoverGridCell.value = null);

// Тултип легенды
const showLegendTooltip = (event, level) => {
    hoverLegendCell.value = level;

    const rect = event.target.getBoundingClientRect();

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

    tooltipLegendX.value = rect.left + rect.width / 2 + scrollLeft;
    tooltipLegendY.value = rect.top - 8 + scrollTop; // 8px над ячейкой
};

const hideLegendTooltip = () => (hoverLegendCell.value = null);
</script>

<style scoped>
.contribution-graph {
    position: relative;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.months-row {
    display: flex;
    margin-left: 40px;
    margin-bottom: 2px;
}

.day-label-spacer {
    width: 40px;
}
.month-label {
    width: 13px;
    font-size: 10px;
    color: #586069;
    text-align: left;
}

.graph-body {
    display: flex;
}

.day-labels {
    display: flex;
    flex-direction: column;
    width: 40px;
    margin-right: 2px;
}

.day-label {
    height: 13px;
    line-height: 13px;
    font-size: 10px;
    color: #586069;
    text-align: right;
    padding-right: 4px;
}

.grid {
    display: flex;
    flex-direction: column;
}

.grid-row {
    display: flex;
}

.square {
    width: 10px;
    height: 10px;
    margin: 1.5px;
    border-radius: 2px;
    cursor: pointer;
}

.level-0 {
    background: #ebedf0;
}
.level-1 {
    background: #acd5f2;
}
.level-2 {
    background: #7fa8c9;
}
.level-3 {
    background: #527ba0;
}
.level-4 {
    background: #254e77;
}

.cg-legend {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 10px;
    color: #6e7781;
    margin-top: 12px;
    margin-left: 40px;
    position: relative;
}

.cg-legend-colors {
    display: flex;
    gap: 2px;
}

.cg-tooltip {
    position: absolute;
    background: #000;
    color: #fff;
    font-size: 12px;
    padding: 6px 8px;
    border-radius: 4px;
    pointer-events: none;
    white-space: nowrap;
    z-index: 100;
}

.cg-tooltip-arrow {
    position: absolute;
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 5px solid #000;
}

.cg-tooltip-date {
    margin-top: 2px;
    font-size: 11px;
    color: #ccc;
}
</style>
