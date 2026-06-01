import { ChatInterface } from "@/components/chat-interface";
import { PageTransition } from "@/components/page-transition";

export default function AgentPage() {
  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-xs font-medium uppercase tracking-widest text-cyan-400/80">
          AI Powered
        </p>
        <h1 className="font-display text-4xl text-metallic">AI Booking Agent</h1>
        <p className="mt-2 text-cream-muted">
          Conversational discovery, slot checks, and instant booking for Bangalore.
        </p>
        <div className="mt-8">
          <ChatInterface />
        </div>
      </div>
    </PageTransition>
  );
}
