import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 pb-20 gap-8 sm:p-20">
      <main className="flex flex-col gap-8 items-center text-center max-w-2xl">
        <h1 className="text-4xl font-bold">Welcome to the Quiz Portal</h1>
        <p className="text-lg text-muted-foreground">
          Test your knowledge with our interactive quiz. Answer questions and see how well you score!
        </p>
        <Link
          href="/quiz"
          className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-lg h-12 px-8"
        >
          Start Quiz
        </Link>
      </main>
    </div>
  );
}
