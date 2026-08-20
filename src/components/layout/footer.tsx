export function Footer() {
  return (
    <footer className="border-t border-zinc-200 py-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
      <p>
        © {new Date().getFullYear()} MinhaApp. Todos os direitos reservados.
      </p>
    </footer>
  );
}
