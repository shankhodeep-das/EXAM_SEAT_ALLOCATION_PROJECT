import { siteConfig } from "@/lib/config";
import { LogoMark } from "./Icons";


const links = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#about", label: "About" },
  { href: "#faq", label: "FAQ" },
];

export default function Navbar() {
  return (
    <header className="nav">
      <div className="nav-inner">
        <a href="#top" className="brand">
          <LogoMark />
          <span>{siteConfig.appName}</span>
        </a>

        <nav className="nav-links" aria-label="Primary">
          {links.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className="nav-actions">
          <a href="/guide" className="nav-link-quiet">
            Guide
          </a>
          <a href="/download" className="btn btn-outline">
            Download app
          </a>
          <a href="/login" className="btn btn-primary">
            Log in
          </a>
        </div>
      </div>
    </header>
  );
}
