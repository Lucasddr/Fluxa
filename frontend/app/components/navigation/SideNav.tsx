import NavLink from "./NavLink";
import { Settings } from "lucide-react";
import { navItems } from "./NavItems";
import ThemeToggle from "../ui/ThemeToggle";

type SideNavProps = {
  className?: string;
};

export default function SideNav({ className }: SideNavProps) {
  return (
    <aside
      style={{ viewTransitionName: "sidenav" }}
      className={`w-60 shrink-0 border-r border-line bg-paper px-5 py-6 flex flex-col justify-between ${className ?? ""}`}
    >
      <div>
        <p className="text-lg font-medium tracking-tight text-ink px-2 mb-8">
          Opsire
        </p>

        <nav aria-label="Principal" className="flex flex-col gap-1">
          {navItems.map(({ href, slug, icon, label }) => (
            <NavLink key={slug} href={href} slug={slug} icon={icon} label={label} />
          ))}
        </nav>
      </div>

      <div className="flex items-center justify-between gap-2">
        <NavLink
          href="/home/configurations"
          icon={Settings}
          slug="configurations"
          label="Ajustes"
        />

        <ThemeToggle />
      </div>
    </aside>
  );
}
