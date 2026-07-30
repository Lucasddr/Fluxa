import NavLink from "./NavLink";
import { Settings } from "lucide-react";
import { navItems } from "./NavItems";

type SideNavProps = {
    className?: string;
}

export default function SideNav ( { className} : SideNavProps) {
    return (
        <aside className={`w-60 bg-(--color-primary) text-white p-5 flex flex-col justify-between ${className ?? ""}`}>
            <h2 className="mb-5">Fluxa</h2>

            <nav className="flex flex-col gap-2.5 align-middle">
                {navItems.map(({ href, slug, icon, label }) => (
                <NavLink
                    key={slug}
                    href={href}
                    slug={slug}
                    icon={icon}
                    label={label}
                />
                ))}
            </nav>

            <div>
                <NavLink
                href="/home/configurations"
                icon={Settings}
                slug="configurations"
                label="Configurações"
                ></NavLink>
            </div>
        </aside>
    );
}
