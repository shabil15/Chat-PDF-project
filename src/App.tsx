import { useState, useEffect } from 'react';
import { FileText, Send, Upload, AlertCircle, Key, Bot } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from '@/lib/utils';
import { messageSchema, fileSchema, apiKeySchema } from '@/lib/schema';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AIProvider, AIClientFactory } from '@/lib/ai';
import { uploadToR2 } from '@/lib/storage';
import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type MessageForm = z.infer<typeof messageSchema>;
type FileForm = z.infer<typeof fileSchema>;
type ApiKeyForm = z.infer<typeof apiKeySchema>;

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [pdfContent, setPdfContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('openai');
  const [aiClient, setAIClient] = useState<any>(null);

  const messageForm = useForm<MessageForm>({
    resolver: zodResolver(messageSchema),
  });

  const apiKeyForm = useForm<ApiKeyForm>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      provider: 'openai',
    },
  });

  const handleApiKeySubmit = apiKeyForm.handleSubmit(async (data) => {
    try {
      const client = AIClientFactory.createClient(data.provider, data.apiKey);
      setAIClient(client);
      setIsApiKeySet(true);
      setIsApiKeyDialogOpen(false);
      setSelectedProvider(data.provider);
      localStorage.setItem('ai-provider', data.provider);
      localStorage.setItem(`${data.provider}-api-key`, data.apiKey);
    } catch (err) {
      setError(`Failed to initialize ${data.provider.toUpperCase()} API`);
    }
  });

  useEffect(() => {
    const savedProvider = localStorage.getItem('ai-provider') as AIProvider;
    if (savedProvider) {
      const savedApiKey = localStorage.getItem(`${savedProvider}-api-key`);
      if (savedApiKey) {
        try {
          const client = AIClientFactory.createClient(savedProvider, savedApiKey);
          setAIClient(client);
          setIsApiKeySet(true);
          setIsApiKeyDialogOpen(false);
          setSelectedProvider(savedProvider);
        } catch (err) {
          setError(`Failed to initialize ${savedProvider.toUpperCase()} API with saved key`);
        }
      }
    }
  }, []);

  const handleSend = messageForm.handleSubmit(async (data) => {
    if (!isApiKeySet || !aiClient) {
      setError('Please set up your AI provider API key first');
      setIsApiKeyDialogOpen(true);
      return;
    }

    setMessages(prev => [...prev, { role: 'user', content: data.content }]);
    setIsLoading(true);
    
    try {
      const response = await aiClient.processMessage(data.content, pdfContent || undefined);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (err) {
      setError(`Failed to get response from ${selectedProvider.toUpperCase()}`);
    } finally {
      setIsLoading(false);
    }
    
    messageForm.reset();
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);

    if (file) {
      try {
        await fileSchema.parseAsync({ file });
        setPdfName(file.name);
        setIsLoading(true);
        
        // Upload to R2
        try {
          await uploadToR2(file);
        } catch (err) {
          console.error('Failed to upload to R2:', err);
          // Continue with local processing even if R2 upload fails
        }
        
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          fullText += pageText + ' ';
        }
        
        setPdfContent(fullText);
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `I've processed "${file.name}". You can now ask questions about its content.` 
        }]);
      } catch (err) {
        if (err instanceof z.ZodError) {
          setError(err.errors[0].message);
        } else {
          setError('Failed to process PDF file');
          console.error('PDF processing error:', err);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <>
      <Dialog open={isApiKeyDialogOpen} onOpenChange={setIsApiKeyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose AI Provider & Enter API Key</DialogTitle>
            <DialogDescription>
              Select your preferred AI provider and enter your API key.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleApiKeySubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>AI Provider</Label>
              <Select
                onValueChange={(value: AIProvider) => 
                  apiKeyForm.setValue('provider', value)
                }
                defaultValue={apiKeyForm.getValues('provider')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select AI Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                  <SelectItem value="google">Google AI (Coming Soon)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type="password"
                  placeholder={
                    apiKeyForm.watch('provider') === 'openai'
                      ? 'sk-...'
                      : apiKeyForm.watch('provider') === 'anthropic'
                      ? 'ant-...'
                      : 'ai-...'
                  }
                  {...apiKeyForm.register('apiKey')}
                  className={cn(
                    apiKeyForm.formState.errors.apiKey && "border-destructive"
                  )}
                />
                <Key className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              {apiKeyForm.formState.errors.apiKey && (
                <p className="text-sm text-destructive">
                  {apiKeyForm.formState.errors.apiKey.message}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full">
              Save API Key
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="flex h-screen bg-background p-4 gap-4">
        <div className="flex flex-col flex-1 h-full max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="font-medium">
                Using {selectedProvider.toUpperCase()}
              </span>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsApiKeyDialogOpen(true)}
            >
              Change AI Provider
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <span className="ml-2">{error}</span>
            </Alert>
          )}
          
          <Card className="flex-1 mb-4 p-4 relative bg-gradient-to-b from-background to-muted/20">
            <ScrollArea className="h-[calc(100vh-12rem)]">
              <div className="space-y-4 px-4">
                {messages.map((message, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex w-full items-end gap-2 mb-4",
                      message.role === 'assistant' ? "justify-start" : "justify-end"
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-lg px-4 py-2 max-w-[80%] shadow-sm",
                        message.role === 'assistant' 
                          ? "bg-muted text-muted-foreground rounded-bl-none" 
                          : "bg-primary text-primary-foreground rounded-br-none"
                      )}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>

          <form onSubmit={handleSend} className="flex gap-2">
            <div className="relative flex-1">
              <Input
                {...messageForm.register('content')}
                placeholder="Ask a question about your PDF..."
                className={cn(
                  "pr-20",
                  messageForm.formState.errors.content && "border-destructive focus-visible:ring-destructive"
                )}
                disabled={isLoading}
              />
              {messageForm.formState.errors.content && (
                <span className="text-destructive text-sm absolute -top-6 left-0">
                  {messageForm.formState.errors.content.message}
                </span>
              )}
              <Button 
                type="submit"
                size="icon"
                variant="ghost" 
                className="absolute right-2 top-1/2 -translate-y-1/2"
                disabled={isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <Input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="pdf-upload"
                disabled={isLoading}
              />
              <Button 
                type="button"
                variant="secondary"
                onClick={() => document.getElementById('pdf-upload')?.click()}
                className="shadow-sm hover:shadow-md transition-shadow"
                disabled={isLoading}
              >
                {pdfName ? (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    {pdfName.slice(0, 20)}...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload PDF (Max 50MB)
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default App;