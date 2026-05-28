// app/chat/page.tsx
import ChatClient from "@/components/ChatClient";

export default function ChatPage() {
  return (
    <div className="flex flex-col h-full">
      <ChatClient />
    </div>
  );
}
