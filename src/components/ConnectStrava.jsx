export default function ConnectStrava({ failed }) {
  return (
    <section className="card connect">
      <h1>strideRide</h1>
      <p>Conecta tu cuenta de Strava para ver tus actividades.</p>
      {failed && (
        <p className="error">
          No se pudo conectar con Strava. Inténtalo de nuevo.
        </p>
      )}
      <a className="button" href="/auth/strava">
        Conectar con Strava
      </a>
    </section>
  );
}
