"use client"

import { cn } from "@/lib/utils"
import { useChat } from "ai/react"
import { ArrowUpIcon, Github, PaperclipIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AutoResizeTextarea } from "@/components/autoresize-textarea"
import { useEffect, useRef, useState } from "react"

const LoadingDots = () => (
  <div className="flex items-center gap-1">
    <div className="h-1.5 w-1.5 rounded-full bg-gray-500 animate-[bounce_1s_infinite]" />
    <div className="h-1.5 w-1.5 rounded-full bg-gray-500 animate-[bounce_1s_infinite_200ms]" />
    <div className="h-1.5 w-1.5 rounded-full bg-gray-500 animate-[bounce_1s_infinite_400ms]" />
  </div>
)

export function ChatForm({ className, ...props }: React.ComponentProps<"form">) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileContent, setFileContent] = useState<string>("")

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
      setSelectedFile(null)
      setFileContent("")
    },
    onError: (error) => {
      console.error("Chat error:", error)
      setSelectedFile(null)
      setFileContent("")
    }
  })

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      setSelectedFile(file)
      setFileContent(text)
    } catch (error) {
      console.error("Error reading file:", error)
      setSelectedFile(null)
      setFileContent("")
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if ((!input.trim() && !fileContent) || isLoading) return

    if (fileContent) {
      // Send a hidden system message with the file content
      void append({
        content: `<file>${fileContent}</file>`,
        role: "system"
      })
      // Send the visible user message
      void append({
        content: `📎 I'm sharing a document: ${selectedFile?.name}. Please analyze it.`,
        role: "user"
      })
      setSelectedFile(null)
      setFileContent("")
    } else if (input.trim()) {
      void append({ content: input, role: "user" })
    }
    
    setInput("")
  }

  const clearFile = () => {
    setSelectedFile(null)
    setFileContent("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)
    }
  }

  const messageList = (
    <div className="flex flex-col gap-4 pb-4">
      {messages.map((message, index) => {
        // Skip system messages (they contain file content)
        if (message.role === "system") return null

        return (
          <div
            key={index}
            data-role={message.role}
            className={cn(
              "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm transition-all duration-200",
              message.role === "assistant" 
                ? "self-start animate-slide-from-left bg-gray-100 text-black" 
                : "self-end animate-slide-from-right bg-blue-500 text-white"
            )}
          >
            {message.content}
          </div>
        )
      })}
      {isLoading && (
        <div className="flex items-center gap-2 self-start animate-fade-in rounded-2xl bg-gray-100 px-4 py-2.5 text-sm text-black">
          <div className="flex items-center gap-1.5">
            <span>DeepSeek is thinking</span>
            <LoadingDots />
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  )

  return (
    <main
      className={cn(
        "flex h-[100dvh] w-full flex-col items-stretch bg-gradient-to-b from-white to-gray-50",
        className,
      )}
      {...props}
    >
      {/* Header with branding */}
      <header className="border-b bg-white/80 backdrop-blur-sm px-4 py-3 sticky top-0 z-10">
        <div className="mx-auto flex max-w-[40rem] items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">DeepSeek R1 Chat</h1>
            <p className="text-xs text-gray-500">by Syed Bilal Alam</p>
          </div>
          <a
            href="https://github.com/syedbilalalam1/ChatWithDeepSeek-R1-671-b"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Github size={20} />
          </a>
        </div>
      </header>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 scroll-smooth">
        <div className="mx-auto max-w-[40rem]">
          {messageList}
        </div>
      </div>

      {/* Input form */}
      <div className="border-t bg-white/80 backdrop-blur-sm px-4 py-4 sticky bottom-0">
        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-[40rem] space-y-4"
        >
          {/* Attached file indicator */}
          {selectedFile && (
            <div className="flex items-center gap-2 rounded-lg border bg-blue-50/50 px-3 py-2 text-sm animate-fade-in">
              <PaperclipIcon size={14} className="text-blue-500" />
              <span className="text-blue-700 font-medium">{selectedFile.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-auto size-6 rounded-full p-0 hover:bg-blue-100/50"
                onClick={clearFile}
              >
                <X size={14} className="text-blue-500" />
              </Button>
            </div>
          )}

          <div className="border-input bg-background focus-within:ring-ring/10 flex items-center rounded-2xl border px-3 py-1.5 pr-2 text-sm focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-0 shadow-sm hover:shadow-md transition-shadow duration-200">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept=".txt,.md,.json,.csv"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="size-8 rounded-xl transition-all duration-200 hover:bg-gray-100"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <PaperclipIcon size={16} className={cn(
                    "text-gray-400 transition-colors",
                    selectedFile && "text-blue-500"
                  )} />
                </Button>
              </TooltipTrigger>
              <TooltipContent sideOffset={12}>
                {selectedFile ? selectedFile.name : "Attach document"}
              </TooltipContent>
            </Tooltip>

            <AutoResizeTextarea
              onKeyDown={handleKeyDown}
              onChange={setInput}
              value={input}
              placeholder={isLoading ? "DeepSeek is thinking..." : "Message DeepSeek R1..."}
              disabled={isLoading}
              className="placeholder:text-muted-foreground flex-1 bg-transparent focus:outline-none disabled:opacity-50 min-h-[44px] py-2 px-2"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  type="submit" 
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                    "size-8 rounded-xl transition-all duration-200",
                    (!input.trim() && !fileContent) || isLoading ? "opacity-50" : "hover:bg-blue-50 text-blue-600"
                  )}
                  disabled={(!input.trim() && !fileContent) || isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-1">
                      <LoadingDots />
                    </div>
                  ) : (
                    <ArrowUpIcon size={16} />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent sideOffset={12}>
                {isLoading ? "DeepSeek is thinking..." : "Send message"}
              </TooltipContent>
            </Tooltip>
          </div>
        </form>
      </div>
    </main>
  )
}

