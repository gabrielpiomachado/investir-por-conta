import { AuthButton } from '@/features/auth/components/auth-button';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <h1 className="text-6xl">Home</h1>
        <AuthButton />
      </div>
    </main>
  );
}
