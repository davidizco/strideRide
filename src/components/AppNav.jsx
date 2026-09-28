const LINKS = [
  { route: "dashboard", href: "#/", label: "Inicio" },
  { route: "calendar", href: "#/calendario", label: "Calendario" },
  { route: "assistant", href: "#/asistente", label: "Asistente" },
];

export default function AppNav({ current }) {
  return (
    <nav className="app-nav" aria-label="Secciones">
      <span className="wordmark">strideRide</span>
      {LINKS.map(({ route, href, label }) => (
        <a
          key={route}
          href={href}
          className={route === current ? "nav-link active" : "nav-link"}
          aria-current={route === current ? "page" : undefined}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}
