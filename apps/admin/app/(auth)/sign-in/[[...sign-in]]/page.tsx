import AuthForm from "@/components/auth-form";

export default function SignInPage() {
  return (
    <div className="h-screen flex items-center">
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="w-full p-6 flex items-center justify-center">
          <AuthForm />
        </div>
      </div>
    </div>
  );
}
