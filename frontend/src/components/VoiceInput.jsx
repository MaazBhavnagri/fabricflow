import { Mic, MicOff } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function VoiceInput({ value, onChange, placeholder, className, required, type = "text", multiline = false, rows = 3 }) {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      // Keep continuous if multiline so user can talk freely
      recognitionRef.current.continuous = multiline; 
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-IN';
      
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
           const separator = (value && value.trim().length > 0) ? ' ' : '';
           onChange(value + separator + finalTranscript.trim());
        }
      };
      
      recognitionRef.current.onend = () => {
        // If it stops naturally
        setIsRecording(false);
      };
    }
  }, [value, onChange, multiline]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (e) {
        console.error("Speech recognition error:", e);
      }
    }
  };

  const Component = multiline ? 'textarea' : 'input';

  return (
    <div className="relative flex items-center w-full">
      <Component 
        type={multiline ? undefined : type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${className} pr-14 ${multiline ? 'resize-none' : ''}`}
        required={required}
        rows={multiline ? rows : undefined}
      />
      <button
        type="button"
        onClick={toggleRecording}
        title="Voice Input"
        className={`absolute right-3 ${multiline ? 'top-3' : 'top-1/2 -translate-y-1/2'} p-2 rounded-xl transition-all shadow-sm flex items-center justify-center ${
          isRecording 
          ? 'bg-red-500 text-white animate-pulse' 
          : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
        }`}
      >
        {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
      </button>
    </div>
  );
}
