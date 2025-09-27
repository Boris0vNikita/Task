import axios from "axios";

const API_URL = "https://dpg.gg/test/calendar.json";

export async function getContributions() {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error("Ошибка при получении данных:", error);
        throw error;
    }
}
