import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <SignUp
        appearance={{
          variables: {
            colorBackground: "#1A1C29",
            colorText: "#F5F0E8",
            colorPrimary: "#F59E0B",
            colorInputBackground: "#12131C",
            borderRadius: "0.75rem",
          },
        }}
      />
    </div>
  );
}
