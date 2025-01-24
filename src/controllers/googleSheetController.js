import fetch from 'node-fetch'; 
import dotenv from 'dotenv';

dotenv.config();

export const sendToGoogleSheet = async (req, res) => {
  const { name, email, gender, date, time, location } = req.body;

  // Verifica que todos los datos requeridos estén presentes
  if (!name || !email || !gender || !date || !time || !location) {
    return res.status(400).json({ error: 'Faltan parámetros necesarios.' });
  }

  try {

    const data = {
      name,
      email,
      gender,
      date,
      time,
      location,
    };

    // Envía los datos al Google Apps Script
    const response = await fetch('https://script.google.com/macros/s/AKfycbyJ3Riq4wnwxmSIziu57T2JS1nkPM48SNekNPh_U-Q4-1sFcRrAXaWwzBcQXo4wHZzDKA/exec', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Error al enviar datos al Google Sheet: ${response.statusText}`);
    }

    // Devuelve una respuesta al frontend
    return res.status(200).json({ message: 'Datos enviados correctamente al Google Sheet.' });
  } catch (error) {
    console.error('Error en sendToGoogleSheet:', error.message);
    return res.status(500).json({ error: 'Error al enviar los datos.' });
  }
};
