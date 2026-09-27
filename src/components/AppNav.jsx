const LINKS = [
  { route: "dashboard", href: "#/", label: "Inicio" },
  { route: "calendar", href: "#/calendario", label: "Calendario" },
];

export default function AppNav({ current }) {
  return (
    <nav className="app-nav" aria-label="Secciones">
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
