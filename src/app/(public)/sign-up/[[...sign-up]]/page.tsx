import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background-subtle">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 text-xl font-bold text-white">
            P
          </div>
          <h1 className="text-2xl font-semibold text-foreground">
            Get Started with Planify
          </h1>
          <p className="mt-2 text-sm text-foreground-muted">
            Create your account to access planning intelligence across Ireland
          </p>
        </div>
        <SignUp
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-none border border-border',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden',
              socialButtonsBlockButton:
                'border border-border bg-background hover:bg-background-subtle',
              formButtonPrimary:
                'bg-brand-500 hover:bg-brand-600 text-white',
              footerActionLink: 'text-brand-500 hover:text-brand-600',
            },
          }}
        />
      </div>
    </div>
  );
}
