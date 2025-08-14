const btn = document.querySelector('.talk');
const content = document.querySelector('.content');
const statusText = document.querySelector('.status');
const imageContainer = document.querySelector('.image-container');

// 🔊 Função para falar
function speak(text) {
    const text_speak = new SpeechSynthesisUtterance(text);
    text_speak.rate = 1;
    text_speak.volume = 1;
    text_speak.pitch = 1;
    text_speak.lang = 'pt-BR';
    window.speechSynthesis.speak(text_speak);
}

// ⏰ Saudar conforme horário
function wishMe() {
    const hour = new Date().getHours();
    if (hour < 12) speak("Bom dia! Como posso ajudar?");
    else if (hour < 18) speak("Boa tarde! Em que posso ajudar?");
    else speak("Boa noite! Pronto para trabalhar.");
}

window.addEventListener('load', () => {
    speak("Inicializando JARVIS...");
    wishMe();
});

// 🎙️ Reconhecimento de voz
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'pt-BR';
recognition.continuous = false;
recognition.interimResults = true;

recognition.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
    }

    // Normalizar texto
    transcript = transcript
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    content.textContent = transcript;

    // Pega o último resultado final captado
    const lastResult = event.results[event.results.length - 1];
    if (lastResult.isFinal) {
        statusText.textContent = "Processando...";
        takeCommand(transcript.trim());
    }
};

// ▶️ Quando clicar no botão
btn.addEventListener('click', () => {
    content.textContent = "🎤 Ouvindo...";
    statusText.textContent = "Escutando...";
    btn.classList.add('listening');
    imageContainer.classList.add('listening');
    recognition.start();
});

// ⏹️ Quando parar de ouvir
recognition.onend = () => {
    btn.classList.remove('listening');
    imageContainer.classList.remove('listening');
    if (statusText.textContent === "Escutando...") {
        statusText.textContent = "Processando...";
    }
};

// 📜 Processar comandos
function takeCommand(message) {
    if (message.includes('ola') || message.includes('oi')) {
        speak("Olá! Como posso ajudar?");
    }
    else if (message.includes("google")) {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(message.replace("google", "").trim())}`, "_blank");
        speak("Aqui está o que encontrei no Google.");
    }
    else if (message.includes("youtube")) {
        window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(message.replace("youtube", "").trim())}`, "_blank");
        speak("Aqui está o que encontrei no YouTube.");
    }
    else if (message.includes("whatsapp")) {
        window.open("https://web.whatsapp.com", "_blank");
        speak("Abrindo WhatsApp Web.");
    }
    else if (message.includes('hora')) {
        speak("Agora são " + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    }
    else if (message.includes('data')) {
        speak("Hoje é " + new Date().toLocaleDateString('pt-BR'));
    }
    else if (message.includes('facebook')) {
        window.open("https://facebook.com", "_blank");
        speak("Abrindo Facebook.");
    }
    else if (message.includes('calculadora') || message.includes('calculator')) {
        speak("Abrindo calculadora.");
        window.open('Calculator:///', '_blank');
    }
    else {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(message)}`, "_blank");
        speak("Encontrei estas informações para " + message);
    }
}
