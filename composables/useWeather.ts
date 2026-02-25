import { ref, watch } from 'vue';
import { useTripStore } from '~/stores/tripStore';

interface WeatherData {
  temp: string
  condition: string
  icon: string
}

export function useWeather() {
  const weather = ref<WeatherData | null>(null);
  const store = useTripStore();

  async function fetchWeather() {
    if (!store.allPlaces.length) {
      weather.value = null;
      return;
    }

    const firstPlace = store.allPlaces[0];
    if (!firstPlace) {
      weather.value = null;
      return;
    }

    const address = firstPlace.address;
    const parts = address.split(',');
    const cityPart = (parts.length > 1 ? parts.at(-1) : parts[0])?.trim();
    if (!cityPart) {
      weather.value = null;
      return;
    }
    const city = cityPart;

    try {
      const response = await fetch(
        `https://wttr.in/${encodeURIComponent(city)}?format=%t+%C`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (!response.ok) throw new Error('fail');
      const text = (await response.text()).trim();

      const match = text.match(/([+-]?\d+)°C\s+(.+)/);
      if (match) {
        const temp = match[1];
        const conditionText = match[2];
        if (!temp || !conditionText) {
          weather.value = null;
          return;
        }
        const cond = conditionText.trim().toLowerCase();
        let icon = '☀️';
        if (cond.includes('rain') || cond.includes('drizzle') || cond.includes('shower')) icon = '🌧️';
        else if (cond.includes('cloud') || cond.includes('overcast')) icon = '☁️';
        else if (cond.includes('snow') || cond.includes('sleet')) icon = '❄️';
        else if (cond.includes('fog') || cond.includes('mist') || cond.includes('haze')) icon = '🌫️';
        else if (cond.includes('thunder') || cond.includes('storm')) icon = '⛈️';
        else if (cond.includes('partly')) icon = '⛅';
        weather.value = { temp: `${temp}°C`, condition: conditionText.trim(), icon };
      }
    } catch {
      weather.value = null;
    }
  }

  watch(() => store.allPlaces.length, fetchWeather, { immediate: true });

  return { weather };
}
