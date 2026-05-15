import SignupForm from '../components/signup/SignupForm';

export default function SignupPage() {
  return (
    <main className="flex-grow flex items-[safe-center] justify-center px-2 relative overflow-hidden pt-23 min-h-screen">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      <SignupForm />
      <div className="absolute bottom-12 right-12 opacity-20 hidden lg:block">
        <div className="grid grid-cols-4 gap-2">
          <div className="w-8 h-8 rounded bg-tertiary"></div>
          <div className="w-8 h-8 rounded border border-outline-variant"></div>
          <div className="w-8 h-8 rounded bg-tertiary"></div>
          <div className="w-8 h-8 rounded border border-outline-variant"></div>
          <div className="w-8 h-8 rounded border border-outline-variant"></div>
          <div className="w-8 h-8 rounded bg-tertiary"></div>
          <div className="w-8 h-8 rounded border border-outline-variant"></div>
          <div className="w-8 h-8 rounded bg-tertiary"></div>
        </div>
      </div>
      <div className="absolute top-12 left-12 opacity-20 hidden lg:block">
        <div className="w-24 h-24 rounded-full border-4 border-dashed border-primary"></div>
      </div>
    </main>
  );
}