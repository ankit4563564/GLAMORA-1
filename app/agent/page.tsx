import { ChatInterface } from "@/components/chat-interface";
import { PageTransition } from "@/components/page-transition";

export default function AgentPage() {
  return (
    <PageTransition>
      <div className="mx-auto flex max-w-6xl flex-col px-4 py-6 sm:py-10">
        <header className="shrink-0">
          <p className="text-xs font-medium uppercase tracking-widest text-cyan-400/80">
            AI Powered
          </p>
          <h1 className="font-display text-3xl text-metallic sm:text-4xl">
            AI Booking Agent
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-cream-muted sm:text-base">
            Conversational discovery, slot checks, and instant booking for Bangalore.
          </p>
        </header>
        <div className="mt-6 min-h-0 w-full flex-1">
          <ChatInterface />
        </div>
      </div>
    </PageTransition>
  );
}
