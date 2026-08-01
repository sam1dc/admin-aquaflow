import axios from 'axios';

/**
 * Obtiene la tasa oficial del BCV desde DolarApi VE.
 */
export const getBcvRate = async () => {
  try {
    const response = await axios.get('https://ve.dolarapi.com/v1/dolares/oficial');
    if (response.data && response.data.promedio) {
      return {
        rate: response.data.promedio,
        fechaActualizacion: response.data.fechaActualizacion,
        fuente: 'BCV (Oficial)'
      };
    }
  } catch (error) {
    console.warn("Error al consultar API BCV, usando valor referencial:", error);
  }
  
  // Tasa de respaldo por si falla la API externa
  return {
    rate: 746.63,
    fechaActualizacion: new Date().toISOString(),
    fuente: 'Referencial'
  };
};
