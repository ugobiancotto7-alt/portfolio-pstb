/** Une erreur qui porte un code HTTP (404, 400…) et un message lisible. */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const notFound = (what = "Ressource") => new HttpError(404, `${what} introuvable`);
