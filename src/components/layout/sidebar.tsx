import Link from 'next/link';

export function Sidebar() {
  return (
    <aside>
      <nav>
        <ul>
          <li>
            <Link href="/">Dashboard</Link>
          </li>
          <li>
            <Link href="/categories">Categorias</Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
