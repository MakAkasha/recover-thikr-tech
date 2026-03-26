import axios from 'axios';
import { config } from '../config';

export async function checkSalahTime(city = 'Riyadh'): Promise<boolean> {
  const today = new Date();
  const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;

  const { data } = await axios.get(`${config.aladhanApiUrl}/timingsByCity/${dateStr}`, {
    params: { city, country: 'SA', method: 4 },
  });

  const timings = data.data.timings as Record<string, string>;
  const prayerNames = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  const now = today.getHours() * 60 + today.getMinutes();
  const buffer = 15;

  for (const prayer of prayerNames) {
    const [h, m] = timings[prayer].split(':').map(Number);
    const prayerMinutes = h * 60 + m;
    if (now >= prayerMinutes - buffer && now <= prayerMinutes + buffer) {
      return true;
    }
  }

  return false;
}
