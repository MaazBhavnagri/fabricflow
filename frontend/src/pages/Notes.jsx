import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../App';
import { Mic, Search, Plus, Pin, Play, Square, Edit, Trash2, X, FileText } from 'lucide-react';
import { getNotes, addNote, updateNote, deleteNote } from '../store/notesService';

// Initialize Speech Recognition if supported
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function Notes() {
  const { t, lang } = useApp();
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Add/Edit state
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [noteContent, setNoteContent] = useState('');

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  // Audio Playback state
  const [playingId, setPlayingId] = useState(null);

  useEffect(() => {
    loadNotes();
    
    // Setup Speech Recognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onstart = () => {
        setIsRecording(true);
      };
      
      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          }
        }
        
        if (finalTranscript) {
          setNoteContent((prev) => (prev + ' ' + finalTranscript).trim());
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };
      
      recognitionRef.current = recognition;
    }
    
    return () => {
      // Cleanup
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  // Update recognition language based on app language
  useEffect(() => {
    if (recognitionRef.current) {
      if (lang === 'hn') recognitionRef.current.lang = 'hi-IN';
      else if (lang === 'gu') recognitionRef.current.lang = 'gu-IN';
      else recognitionRef.current.lang = 'en-US';
    }
  }, [lang]);

  const loadNotes = async () => {
    setIsLoading(true);
    try {
      const data = await getNotes();
      setNotes(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!noteContent.trim()) return;

    try {
      if (editingId) {
        await updateNote(editingId, { content: noteContent.trim() });
      } else {
        await addNote(noteContent.trim());
      }
      setNoteContent('');
      setEditingId(null);
      setIsAdding(false);
      await loadNotes();
    } catch (e) {
      console.error(e);
      alert('Error saving note');
    }
  };

  const handleDeleteNote = async (id) => {
    if (!window.confirm(t('del_note_conf'))) return;
    try {
      await deleteNote(id);
      await loadNotes();
    } catch (e) {
      console.error(e);
      alert('Error deleting note');
    }
  };

  const handleTogglePin = async (id, currentPinStatus) => {
    try {
      const newNotes = notes.map(n => n.id === id ? { ...n, is_pinned: !currentPinStatus } : n);
      // Sort instantly in UI
      const sorted = [...newNotes].sort((a, b) => {
        if (a.is_pinned === b.is_pinned) {
          return new Date(b.created_at) - new Date(a.created_at);
        }
        return a.is_pinned ? -1 : 1;
      });
      setNotes(sorted);
      
      await updateNote(id, { is_pinned: !currentPinStatus });
      // Background reload to sync properly
      loadNotes();
    } catch (e) {
      console.error(e);
      alert('Error updating note');
      loadNotes();
    }
  };

  const handleEditClick = (note) => {
    setEditingId(note.id);
    setNoteContent(note.content);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const playAudio = (id, text) => {
    if (playingId === id) {
      window.speechSynthesis.cancel();
      setPlayingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (lang === 'hn') utterance.lang = 'hi-IN';
    else if (lang === 'gu') utterance.lang = 'gu-IN';
    else utterance.lang = 'en-US';

    utterance.onend = () => setPlayingId(null);
    utterance.onerror = () => setPlayingId(null);

    setPlayingId(id);
    window.speechSynthesis.speak(utterance);
  };

  // Filter notes
  const filteredNotes = notes.filter(note => 
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Search Bar */}
      <div className="sticky top-[56px] z-10 bg-gray-50/95 dark:bg-[#121212]/95 backdrop-blur-md pb-2 pt-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:top-0">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={t('search_notes')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#1e1e1e] border-none rounded-2xl shadow-sm text-sm focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>
      </div>

      {/* Add Note Button / Input Area */}
      {!isAdding ? (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-500 hover:bg-white dark:hover:bg-[#1e1e1e] transition-all hover:border-indigo-400 hover:text-indigo-500"
        >
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-full text-indigo-500">
            <Plus size={24} />
          </div>
          <span className="font-bold">{t('add_note_btn')}</span>
        </button>
      ) : (
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 animate-slide-up">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-800 dark:text-gray-100">
              {editingId ? t('edit_note') : t('add_note_btn')}
            </h3>
            <button 
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
                setNoteContent('');
                if (isRecording && recognitionRef.current) recognitionRef.current.stop();
              }}
              className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="relative mb-4">
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder={t('add_note')}
              className={`w-full min-h-[120px] p-3 rounded-xl bg-gray-50 dark:bg-[#121212] border ${isRecording ? 'border-red-400 shadow-[0_0_0_4px_rgba(248,113,113,0.1)]' : 'border-gray-200 dark:border-gray-800'} text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none font-medium transition-all`}
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={toggleRecording}
              className={`flex items-center justify-center w-12 h-12 rounded-full transition-all ${
                isRecording 
                  ? 'bg-red-50 dark:bg-red-900/30 text-red-500 animate-pulse border border-red-200 dark:border-red-800' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {isRecording ? <Square size={20} /> : <Mic size={20} />}
            </button>
            
            <button
              onClick={handleSaveNote}
              disabled={!noteContent.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50 shadow-sm shadow-indigo-200 dark:shadow-none"
            >
              {editingId ? t('save_note') : t('add_note_btn')}
            </button>
          </div>
          
          {isRecording && (
            <div className="mt-3 text-xs text-red-500 font-semibold flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Listening...
            </div>
          )}
        </div>
      )}

      {/* Notes List */}
      {isLoading ? (
        <div className="py-10 text-center text-gray-500 font-medium">Loading...</div>
      ) : filteredNotes.length === 0 ? (
        <div className="py-10 text-center flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400">
            <FileText size={28} />
          </div>
          <p className="text-gray-500 font-medium">No notes found.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredNotes.map((note) => (
            <div 
              key={note.id} 
              className={`bg-white dark:bg-[#1e1e1e] rounded-2xl p-4 shadow-sm border ${note.is_pinned ? 'border-yellow-400/50 dark:border-yellow-600/30' : 'border-gray-100 dark:border-gray-800'}`}
            >
              <div className="flex justify-between items-start gap-3">
                <p className="flex-1 text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap leading-relaxed font-medium">
                  {note.content}
                </p>
                <button
                  onClick={() => handleTogglePin(note.id, note.is_pinned)}
                  className={`shrink-0 p-1.5 rounded-lg transition-colors ${note.is_pinned ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  title={note.is_pinned ? t('unpin_note') : t('pin_note')}
                >
                  <Pin size={18} className={note.is_pinned ? 'fill-current' : ''} />
                </button>
              </div>
              
              <div className="mt-4 pt-3 flex items-center justify-between border-t border-gray-50 dark:border-gray-800/50">
                <div className="text-[10px] sm:text-xs text-gray-400 font-bold">
                  {new Date(note.created_at).toLocaleString()}
                </div>
                
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={() => playAudio(note.id, note.content)}
                    className={`p-2 rounded-xl flex items-center gap-1.5 transition-colors ${playingId === note.id ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    title={playingId === note.id ? t('stop_note') : t('play_note')}
                  >
                    {playingId === note.id ? <Square size={16} /> : <Play size={16} />}
                  </button>
                  
                  <button
                    onClick={() => handleEditClick(note)}
                    className="p-2 rounded-xl text-gray-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-2 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
