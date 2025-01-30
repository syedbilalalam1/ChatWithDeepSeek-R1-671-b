"use client"

import { cn } from "@/lib/utils"
import { useChat } from "ai/react"
import { ArrowUpIcon, Github, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AutoResizeTextarea } from "@/components/autoresize-textarea"

export function ChatForm({ className, ...props }: React.ComponentProps<"form">) {
  const { messages, input, setInput, append, isLoading } = useChat({
    api: "/api/chat",
    initialMessages: [
      {
        id: "1",
        role: "assistant",
        content: "Hi! I'm DeepSeek R1. How can I help you today?"
      }
    ],
    onResponse: (response) => {
      console.log("API Response:", response)
    },
    onFinish: (message) => {
      console.log("Chat finished:", message)
    },
    onError: (error) => {
      console.error("Chat error:", error)
    }
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    console.log("Sending message:", input)
    void append({ content: input, role: "user" })
    setInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)
    }
  }

  const messageList = (
    <div className="flex flex-col gap-4 pb-4">
      {messages.map((message, index) => (
        <div
          key={index}
          data-role={message.role}
          className="max-w-[80%] rounded-xl px-4 py-2.5 text-sm data-[role=assistant]:self-start data-[role=user]:self-end data-[role=assistant]:bg-gray-100 data-[role=user]:bg-blue-500 data-[role=assistant]:text-black data-[role=user]:text-white"
        >
          {message.content}
        </div>
      ))}
      {isLoading && (
        <div className="flex items-center gap-2 self-start rounded-xl bg-gray-100 px-4 py-2.5 text-sm text-black">
          <Loader2 size={14} className="animate-spin" />
          <span>DeepSeek is thinking...</span>
        </div>
      )}
    </div>
  )

  return (
    <main
      className={cn(
        "flex h-[100dvh] w-full flex-col items-stretch bg-white",
        className,
      )}
      {...props}
    >
      {/* Header with branding */}
      <header className="border-b bg-white px-4 py-3">
        <div className="mx-auto flex max-w-[35rem] items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">DeepSeek R1 Chat</h1>
            <p className="text-xs text-gray-500">by Syed Bilal Alam</p>
          </div>
          <a
            href="https://github.com/syedbilalalam1/ChatWithDeepSeek-R1-671-b"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-gray-900"
          >
            <Github size={20} />
          </a>
        </div>
      </header>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 pt-4">
        <div className="mx-auto max-w-[35rem]">
          {messageList}
        </div>
      </div>

      {/* Input form */}
      <div className="border-t bg-white px-4 py-4">
        <form
          onSubmit={handleSubmit}
          className="border-input bg-background focus-within:ring-ring/10 mx-auto flex max-w-[35rem] items-center rounded-xl border px-3 py-1.5 pr-8 text-sm focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-0"
        >
          <AutoResizeTextarea
            onKeyDown={handleKeyDown}
            onChange={setInput}
            value={input}
            placeholder={isLoading ? "DeepSeek is thinking..." : "Message DeepSeek R1..."}
            disabled={isLoading}
            className="placeholder:text-muted-foreground flex-1 bg-transparent focus:outline-none disabled:opacity-50"
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                type="submit" 
                variant="ghost" 
                size="sm" 
                className="absolute right-2 size-6 rounded-full"
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ArrowUpIcon size={16} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent sideOffset={12}>
              {isLoading ? "DeepSeek is thinking..." : "Send message"}
            </TooltipContent>
          </Tooltip>
        </form>
      </div>
    </main>
  )
}

