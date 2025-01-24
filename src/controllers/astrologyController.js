import axios from 'axios';
import swisseph from 'swisseph';
import path from 'path';
import { fileURLToPath } from 'url';
import { callSambanovaApi } from '../config/sambanovaApi.js'; // Importa la función del bot

const OPENCAGE_API_KEY = '74568d97762440b1bf521089c397be7d';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getCoordinates(location) {
  try {
    const response = await axios.get('https://api.opencagedata.com/geocode/v1/json', {
      params: {
        q: location,
        key: OPENCAGE_API_KEY,
        limit: 1,
        language: 'es',
      },
    });
    if (response.data.results.length === 0) {
      throw new Error('No se encontraron resultados para la ubicación proporcionada.');
    }
    const { lat, lng } = response.data.results[0].geometry;
    return { latitude: lat, longitude: lng };
  } catch (error) {
    throw new Error(`Error al obtener coordenadas: ${error.message}`);
  }
}

function getZodiacSignByLongitude(longitude) {
  if (longitude >= 0 && longitude < 30) return 'Aries';
  if (longitude >= 30 && longitude < 60) return 'Taurus';
  if (longitude >= 60 && longitude < 90) return 'Gemini';
  if (longitude >= 90 && longitude < 120) return 'Cancer';
  if (longitude >= 120 && longitude < 150) return 'Leo';
  if (longitude >= 150 && longitude < 180) return 'Virgo';
  if (longitude >= 180 && longitude < 210) return 'Libra';
  if (longitude >= 210 && longitude < 240) return 'Scorpio';
  if (longitude >= 240 && longitude < 270) return 'Sagittarius';
  if (longitude >= 270 && longitude < 300) return 'Capricorn';
  if (longitude >= 300 && longitude < 330) return 'Aquarius';
  if (longitude >= 330 && longitude < 360) return 'Pisces';
  return 'Desconocido';
}

function getHouse(longitude, houseLongitudes) {
  for (let i = 0; i < houseLongitudes.length; i++) {
    const nextIndex = (i + 1) % houseLongitudes.length;
    const start = houseLongitudes[i];
    const end = houseLongitudes[nextIndex];

    if (start < end) {
      if (longitude >= start && longitude < end) {
        return i + 1;
      }
    } else {
      if (longitude >= start || longitude < end) {
        return i + 1;
      }
    }
  }
  return null;
}

/**
 * Nueva función: Genera el análisis astrológico usando Sambanova
 */
async function generateAstrologyAnalysis(name, ascendant, houses, planets) {
  const sun = planets['Sun'];
  const moon = planets['Moon'];

  const prompt = `
   ¡Hola ${name}! Soy una Maestra en Astrología (✨), y tengo muchísima experiencia analizando cartas astrales.
   Analiza los siguientes datos astrológicos de ${name}:
    - Sol: ${sun.sign}
    - Luna: ${moon.sign}
    - Ascendente: ${ascendant.sign}
    - Casa 1: ${houses[0].sign}
    - Casa 2: ${houses[1].sign}
    
  ejemplo de cómo estructurar la respuesta:
  <h2>Soy AstroSage 🧚</h2>
  <p> ${name} inventate un transfondo como que llevas siglos estudiando las estrellas y cierra con algo asi como veamos que dicen las estrellas </p>

  <h2>☀️ ${sun.sign}</h2>
  <p>El Sol...</p>

  <h2>🌙 ${moon.sign}</h2>
  <p>La Luna...</p>

  <h2>🏆 ${ascendant.sign}</h2>
  <p>Tu Ascendente ${name} muestra que eres...</p>

  <h2>(1️⃣ ${houses[0].sign}</h2>
  <p>En la Casa 1 ...</p>

  <h2> 2️⃣ ${houses[1].sign}</h2>
  <p>La Casa 2 sugiere...</p>

  <p><span style="color: red;">En el amor, tu característica principal es...</span></p>

  <h3>${name}! inventa algo como estoy viendo muuucho más de ti y tus relaciones amorosas en las estrellas  ... y cierra con una pregunta abierta</h3>
  <a href="oferta.html" class="button">¡Oferta Exclusiva! 🎁</a>
  `;

  console.log('Prompt generado:', prompt);

  try {
    const analysis = await callSambanovaApi(prompt);
    return analysis;
  } catch (error) {
    console.error('Error al generar el análisis con Sambanova:', error.message);
    throw new Error('No se pudo generar el análisis astrológico.');
  }
}


export const calculateChart = async (req, res) => {
  const { name, date, location } = req.body;

  if (!name || !date || !location) {
    return res.status(400).json({ error: 'Faltan parámetros: name, date, location' });
  }

  try {
    const { latitude, longitude } = await getCoordinates(location);
    console.log(`Coordenadas obtenidas: ${latitude}, ${longitude}`);

    const utcDatetime = new Date(date);
    console.log('Fecha ajustada a UTC:', utcDatetime.toISOString());

    swisseph.swe_set_ephe_path(path.join(__dirname, '../eph'));

    const julianDay = swisseph.swe_julday(
      utcDatetime.getUTCFullYear(),
      utcDatetime.getUTCMonth() + 1,
      utcDatetime.getUTCDate(),
      utcDatetime.getUTCHours() + utcDatetime.getUTCMinutes() / 60,
      swisseph.SE_GREG_CAL
    );

    const housesData = await new Promise((resolve, reject) => {
      swisseph.swe_houses(julianDay, latitude, longitude, 'P', (houses) => {
        if (houses.error) {
          console.error('Error al calcular las casas:', houses.error);
          return reject(houses.error);
        }
        resolve(houses);
      });
    });

    const houseLongitudes = housesData.house;
    const ascendantLongitude = housesData.ascendant;

    const planets = [
      { id: swisseph.SE_SUN, name: 'Sun' },
      { id: swisseph.SE_MOON, name: 'Moon' },
      { id: swisseph.SE_MERCURY, name: 'Mercury' },
      { id: swisseph.SE_VENUS, name: 'Venus' },
      { id: swisseph.SE_MARS, name: 'Mars' },
      { id: swisseph.SE_JUPITER, name: 'Jupiter' },
      { id: swisseph.SE_SATURN, name: 'Saturn' },
      { id: swisseph.SE_URANUS, name: 'Uranus' },
      { id: swisseph.SE_NEPTUNE, name: 'Neptune' },
      { id: swisseph.SE_PLUTO, name: 'Pluto' },
    ];

    const planetPositions = await Promise.all(
      planets.map((planet) => {
        return new Promise((resolve, reject) => {
          swisseph.swe_calc_ut(julianDay, planet.id, swisseph.SEFLG_SWIEPH, (planetData) => {
            if (planetData.error) {
              console.error(`Error al calcular la posición del planeta ${planet.name}:`, planetData.error);
              return reject(planetData.error);
            }
            const lon = planetData.longitude;
            resolve({
              name: planet.name,
              longitude: lon,
              sign: getZodiacSignByLongitude(lon),
              house: getHouse(lon, houseLongitudes),
            });
          });
        });
      })
    );

    const planetResults = {};
    planetPositions.forEach((planet) => {
      planetResults[planet.name] = {
        longitude: planet.longitude,
        sign: planet.sign,
        house: planet.house,
      };
    });

    const ascendant = {
      longitude: ascendantLongitude,
      sign: getZodiacSignByLongitude(ascendantLongitude),
    };

    const houses = houseLongitudes.map((lon, index) => ({
      house: index + 1,
      longitude: lon,
      sign: getZodiacSignByLongitude(lon),
    }));

    // Llama a la función para generar el análisis astrológico
    const analysis = await generateAstrologyAnalysis(name, ascendant, houses, planetResults);

    res.json({
      ascendant,
      houses,
      planets: planetResults,
      analysis, // Incluye el análisis generado
    });
  } catch (error) {
    console.error('Error general:', error);
    res.status(500).json({ error: error.message });
  }
};


