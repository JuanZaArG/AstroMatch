const axios = require('axios');
const swisseph = require('swisseph');
const path = require('path');


const OPENCAGE_API_KEY = '74568d97762440b1bf521089c397be7d';


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

exports.calculateChart = async (req, res) => {
  const { date, location } = req.body;

  if (!date || !location) {
    return res.status(400).json({ error: 'Faltan parámetros: date, location' });
  }

  try {

    const { latitude, longitude } = await getCoordinates(location);
    console.log(`Coordenadas obtenidas: ${latitude}, ${longitude}`);

    const utcDate = new Date(date);

   
    swisseph.swe_set_ephe_path(path.join(__dirname, '../eph'));

    
    const julianDay = swisseph.swe_julday(
      utcDate.getUTCFullYear(),
      utcDate.getUTCMonth() + 1, 
      utcDate.getUTCDate(),
      utcDate.getUTCHours() + utcDate.getUTCMinutes() / 60,
      swisseph.SE_GREG_CAL
    );

    
    const housesData = await new Promise((resolve, reject) => {
      swisseph.swe_houses(julianDay, latitude, longitude, 'R', (houses) => {
        if (houses.error) {
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

    res.json({
      ascendant: {
        longitude: ascendantLongitude,
        sign: getZodiacSignByLongitude(ascendantLongitude),
      },
      houses: houseLongitudes.map((lon, index) => ({
        house: index + 1,
        longitude: lon,
        sign: getZodiacSignByLongitude(lon),
      })),
      planets: planetResults,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
