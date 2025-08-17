// ==================== CONFIGURAÇÃO GEMINI ====================
const GEMINI_API_KEY = "AIzaSyCDC-EhjOGfGCWgJEGzvgfRtQwpusDA-Lg"; // coloque sua chave do Google AI Studio

async function queryGemini(prompt) {
    try {
        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" + GEMINI_API_KEY,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ role: "user", parts: [{ text: prompt }] }]
                }),
            }
        );

        const data = await response.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text || "Não consegui resposta do Gemini.";
    } catch (error) {
        console.error("Erro no Gemini:", error);
        return "Erro ao acessar o Gemini.";
    }
}

// ==================== SÍNTESE DE VOZ ====================
function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    speechSynthesis.speak(utterance);
}

// ==================== COMANDOS DE CONTATOS ====================
let contacts = {
    "joão": "559999999999",
    "maria": "558888888888"
};

function handleCallCommand(name) {
    const number = contacts[name];
    if (number) {
        speak(`Ligando para ${name}`);
        window.open(`tel:${number}`);
    } else {
        speak(`Não encontrei o contato ${name}`);
    }
}

function handleWhatsAppCommand(name) {
    const number = contacts[name];
    if (number) {
        speak(`Abrindo WhatsApp para ${name}`);
        window.open(`https://wa.me/${number}`, "_blank");
    } else {
        speak(`Não encontrei o contato ${name}`);
    }
}

// ==================== COMANDOS DE PESQUISA ====================
function handleSearchCommand(query) {
    const q = query.replace("pesquisar no google", "").replace("buscar no google", "").trim();
    if (q.length > 0) {
        speak(`Pesquisando no Google por ${q}`);
        window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, "_blank");
    } else {
        speak("O que você gostaria de pesquisar?");
    }
}

// ==================== COMANDOS DE YOUTUBE ====================
function handleYouTubeCommand(query) {
    const q = query.replace("youtube", "").replace("tocar", "").trim();
    if (q.length > 0) {
        speak(`Abrindo YouTube para ${q}`);
        window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, "_blank");
    } else {
        window.open("https://www.youtube.com", "_blank");
    }
}

// ==================== COMANDOS DE LANTERNA ====================
let isFlashlightOn = false;
let currentStream = null;
let videoTrack = null;

async function toggleFlashlight(state) {
    try {
        if (!currentStream) {
            currentStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            videoTrack = currentStream.getVideoTracks()[0];
        }
        await videoTrack.applyConstraints({ advanced: [{ torch: state }] });
        isFlashlightOn = state;
        speak(state ? "Lanterna ligada" : "Lanterna desligada");
    } catch (e) {
        speak("Seu dispositivo não suporta controle de lanterna.");
        console.error(e);
    }
}

// ==================== COMANDO PRINCIPAL ====================
function takeCommandWithSmartContactsEnhanced(message) {
    const lowerMessage = message.toLowerCase().trim();
    const content = document.getElementById("content");
    if (content) content.textContent = message;

    // 👋 Saudações
    if (lowerMessage.includes("olá") || lowerMessage.includes("oi") || lowerMessage.includes("hey luzia")) {
        speak("Olá! Como posso ajudar você hoje?");
        return;
    }

    // 🕒 Horas
    if (lowerMessage.includes("que horas") || lowerMessage.includes("hora")) {
        const now = new Date();
        const timeString = now.toLocaleTimeString("pt-BR");
        speak(`Agora são ${timeString}`);
        return;
    }

    // 📅 Data
    if (lowerMessage.includes("que dia") || lowerMessage.includes("data")) {
        const now = new Date();
        const dateString = now.toLocaleDateString("pt-BR");
        speak(`Hoje é ${dateString}`);
        return;
    }

    // 📞 Ligações
    if (lowerMessage.includes("ligar para")) {
        const name = lowerMessage.replace("ligar para", "").trim();
        handleCallCommand(name);
        return;
    }

    // 💬 WhatsApp
    if (lowerMessage.includes("whatsapp") || lowerMessage.includes("mandar mensagem para")) {
        const name = lowerMessage.replace("mandar mensagem para", "").replace("abrir whatsapp para", "").trim();
        handleWhatsAppCommand(name);
        return;
    }

    // 🎵 YouTube
    if (lowerMessage.includes("youtube") || lowerMessage.includes("tocar")) {
        handleYouTubeCommand(lowerMessage);
        return;
    }

    // 🔦 Lanterna
    if (lowerMessage.includes("ligar lanterna") || lowerMessage.includes("acender lanterna")) {
        toggleFlashlight(true);
        return;
    }
    if (lowerMessage.includes("desligar lanterna") || lowerMessage.includes("apagar lanterna")) {
        toggleFlashlight(false);
        return;
    }

    // 🌐 Pesquisa no Google
    if (lowerMessage.includes("pesquisar no google") || lowerMessage.includes("buscar no google")) {
        handleSearchCommand(lowerMessage);
        return;
    }

    // 🤖 Gemini → fallback
    if (GEMINI_API_KEY) {
        queryGemini(message).then(r => {
            if (content) content.textContent = r;
            speak(r);
        });
    } else {
        speak("Desculpe, não entendi o comando.");
    }
}

// ==================== MICROFONE ====================
function initialize() {
    const micBtn = document.getElementById("mic-btn");
    if (!micBtn) return;

    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "pt-BR";
    recognition.interimResults = false;

    micBtn.addEventListener("click", () => {
        recognition.start();
        speak("Estou ouvindo...");
    });

    recognition.addEventListener("result", (event) => {
        const transcript = event.results[0][0].transcript;
        takeCommandWithSmartContactsEnhanced(transcript);
    });
}
