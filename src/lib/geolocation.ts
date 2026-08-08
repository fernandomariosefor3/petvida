export interface Coordinates {
  lat: number;
  lon: number;
}

export type GeolocationErrorReason = 'unsupported' | 'denied' | 'timeout' | 'unavailable';

export class GeolocationError extends Error {
  reason: GeolocationErrorReason;

  constructor(reason: GeolocationErrorReason, message: string) {
    super(message);
    this.reason = reason;
  }
}

export function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new GeolocationError('unsupported', 'Geolocalização não é suportada neste navegador.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new GeolocationError('denied', 'Permissão de localização negada.'));
        } else if (err.code === err.TIMEOUT) {
          reject(new GeolocationError('timeout', 'Tempo esgotado ao obter sua localização.'));
        } else {
          reject(new GeolocationError('unavailable', 'Não foi possível obter sua localização.'));
        }
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  });
}
