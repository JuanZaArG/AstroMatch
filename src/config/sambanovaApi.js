import axios from "axios";


const API_KEY = "05e9c039-9096-4fd9-9c4a-196528d334bc"; 
const API_URL = "https://api.sambanova.ai/v1/chat/completions";

/**
 * Envía una solicitud al modelo Sambanova Llama
 * @param {string} prompt - El mensaje del usuario.
 * @returns {Promise<string>} - Respuesta generada por el modelo.
 */
export const callSambanovaApi = async (prompt) => {
  try {
    // Configuración del cuerpo de la solicitud
    const data = {
      stream: false, // Cambia a true si necesitas transmisión de datos
      model: "Meta-Llama-3.3-70B-Instruct",
      messages: [
        { role: "system", content: "You are a helpful assistant" },
        { role: "user", content: prompt },
      ],
    };

    // Configuración de encabezados
    const headers = {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    };

    // Realiza la solicitud
    const response = await axios.post(API_URL, data, { headers });

    // Devuelve la respuesta procesada
    return response.data.choices[0].message.content.trim(); // Devuelve el texto del asistente
  } catch (error) {
    console.error("Error al llamar a Sambanova API:", error.message);
    throw new Error("No se pudo completar la solicitud.");
  }
};
