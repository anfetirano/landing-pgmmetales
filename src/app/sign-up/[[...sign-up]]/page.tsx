import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen w-full px-4 pt-28 pb-16 md:pt-36 flex justify-center">
      <div className="w-full max-w-md">
        <SignUp />
      </div>
    </div>
  );
}
