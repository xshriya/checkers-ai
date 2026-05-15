import OtpSignupForm from '../components/signup/OtpSignupForm';

export default function OtpSignupPage() {
  return (
    <main className="flex-grow flex items-[safe-center] justify-center px-2 relative overflow-hidden pt-23 min-h-screen">
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
      <OtpSignupForm />
    </main>
  );
}
