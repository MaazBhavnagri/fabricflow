export const speak = (text, lang = "en-US") => {
  if (!window.speechSynthesis) return;
  // cancel ongoing
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  window.speechSynthesis.speak(utterance);
};
