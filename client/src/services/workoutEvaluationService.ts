import axios from 'axios';

export async function inviaRisultatiWorkout(risultatiEsercizi: number[]): Promise<number> {
  if (!Array.isArray(risultatiEsercizi) || risultatiEsercizi.length === 0) {
    throw new Error('Array risultatiEsercizi vuoto o non valido');
  }
  try {
    const response = await axios.post('/api/valuta_workout/', {
      risultati_esercizi: risultatiEsercizi
    });
    if (
      response.data &&
      typeof response.data.percentuale_correttezza === 'number'
    ) {
      return response.data.percentuale_correttezza;
    } else {
      throw new Error('Risposta API non valida');
    }
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.detail || 'Errore durante la richiesta al server'
    );
  }
}
