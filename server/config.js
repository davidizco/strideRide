function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}. Revisa el archivo .env (usa .env.example como plantilla).`,
    );
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  appUrl: process.env.APP_URL ?? "http://localhost:5173",
  strava: {
    clientId: required("STRAVA_CLIENT_ID"),
    clientSecret: required("STRAVA_CLIENT_SECRET"),
    scope: "read,profile:read_all,activity:read_all",
  },
};
