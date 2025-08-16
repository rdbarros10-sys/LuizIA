function normalizeBRPhone(p) {
    let digits = String(p).replace(/\D/g, '');
    if (digits.startsWith('55')) digits = digits.slice(2);
    return '55' + digits;
}

// ==================== VARIÁVEIS GLOBAIS ====================
let btn = null;
let content = null;
let statusText = null;
let imageContainer = null;
let errorDiv = null;
let debugDiv = null;
let recognition = null;
let isListening = false;
let speechSynthesis = window.speechSynthesis;
let isInitialized = false;

// ==================== GEMINI AI CONFIG ====================
const GEMINI_API_KEY = "AIzaSyCDC-EhjOGfGCWgJEGzvgfRtQwpusDA-Lg"; // 🔑 coloque sua chave da API Gemini aqui
async function queryGemini(prompt) {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ role: "user", parts: [{ text: prompt }]}]
                }),
            }
        );
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Não encontrei resposta.";
        return text;
    } catch (err) {
        debug("Erro Gemini: " + err.message);
        return "Erro ao consultar Gemini.";
    }
}

// ==================== FUNÇÕES DE DEBUG ====================
function debug(message) {
    console.log('[JARVIS]', message);
    if (debugDiv) {
        debugDiv.textContent = new Date().toLocaleTimeString() + ': ' + message;
    }
}

function toggleDebug() {
    if (debugDiv) {
        debugDiv.style.display = debugDiv.style.display === 'none' ? 'block' : 'none';
    }
}

// ==================== FUNÇÕES DE FALA ====================
function speak(text) {
    debug('Tentando falar: ' + text);
    
    if (!speechSynthesis) {
        showError('Síntese de voz não disponível');
        return;
    }

    speechSynthesis.cancel();

    setTimeout(() => {
        try {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.volume = 1;
            utterance.pitch = 1;
            utterance.lang = 'pt-BR';
            
            utterance.onstart = () => debug('Fala iniciada');
            utterance.onend = () => debug('Fala finalizada');
            utterance.onerror = (e) => debug('Erro na fala: ' + e.error);

            speechSynthesis.speak(utterance);
        } catch (error) {
            debug('Erro ao tentar falar: ' + error.message);
            showError('Erro na síntese de voz: ' + error.message);
        }
    }, 100);
}

function wishMe() {
    const hour = new Date().getHours();
    if (hour < 12) {
        speak("Bom dia! Como posso ajudar?");
    } else if (hour < 18) {
        speak("Boa tarde! Em que posso ajudar?");
    } else {
        speak("Boa noite! Pronto para trabalhar.");
    }
}

// ==================== FUNÇÕES DE ERRO ====================
function showError(message) {
    debug('Erro: ' + message);
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
}

// ==================== VERIFICAÇÃO DE SUPORTE ====================
function checkSupport() {
    debug('Verificando suporte...');
    if (!isSecureContext) {
        showError('Este recurso exige HTTPS ou localhost');
        return false;
    }

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition ||
        window.mozSpeechRecognition ||
        window.msSpeechRecognition;

    if (!SpeechRecognition) {
        showError('Reconhecimento de voz não suportado neste navegador');
        return false;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showError('Acesso ao microfone não suportado');
        return false;
    }

    debug('Suporte verificado com sucesso');
    return true;
}

// ==================== PERMISSÕES ====================
async function requestPermissions() {
    try {
        debug('Solicitando permissão do microfone...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });
        
        stream.getTracks().forEach(track => track.stop());
        debug('Permissão concedida');
        return true;
    } catch (error) {
        debug('Erro ao solicitar permissão: ' + error.message);
        showError('Permissão do microfone necessária. Permita o acesso.');
        return false;
    }
}

// ==================== INICIALIZAÇÃO DO RECONHECIMENTO DE VOZ ====================
function initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        showError("Reconhecimento de voz não suportado neste navegador");
        return false;
    }

    recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
        isListening = true;
        if (statusText) statusText.textContent = "🎤 Escutando...";
        if (btn) btn.classList.add("listening");
        if (imageContainer) imageContainer.classList.add("listening");
    };

    recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
        }
        if (content) content.textContent = transcript;

        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
            takeCommand(transcript.toLowerCase().trim());
        }
    };

    recognition.onerror = (event) => {
        showError("Erro no reconhecimento: " + event.error);
        isListening = false;
    };

    recognition.onend = () => {
        isListening = false;
        if (btn) btn.classList.remove("listening");
        if (imageContainer) imageContainer.classList.remove("listening");
        if (statusText) statusText.textContent = "Toque no microfone para falar";
    };

    return true;
}

// ==================== BOTÃO MICROFONE ====================
async function handleButtonClick(e) {
    e.preventDefault();

    debug("Botão microfone clicado");

    if (isListening) {
        if (recognition) recognition.stop();
        return;
    }

    if (!isInitialized) {
        showError("Sistema ainda não inicializado. Aguarde...");
        return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    if (recognition) {
        if (content) content.textContent = "🎤 Ouvindo...";
        recognition.start();
    } else {
        showError("Reconhecimento de voz não inicializado");
    }
}

// ==================== INICIALIZAÇÃO GERAL ====================
function initialize() {
    debug("Inicializando sistema...");

    btn = document.querySelector(".talk");
    content = document.querySelector(".content");
    statusText = document.querySelector(".status");
    imageContainer = document.querySelector(".image-container");
    errorDiv = document.getElementById("error");
    debugDiv = document.getElementById("debug");

    if (!btn || !content || !statusText || !imageContainer || !errorDiv) {
        console.error("Elementos principais não encontrados no DOM");
        return;
    }

    btn.addEventListener("click", handleButtonClick);
    btn.addEventListener("touchstart", handleButtonClick, { passive: false });

    setTimeout(() => {
        if (initRecognition()) {
            isInitialized = true;
            debug("Sistema inicializado com sucesso");
            speak("JARVIS ativado e pronto!");
            setTimeout(wishMe, 2000);
        } else {
            debug("Falha na inicialização");
            showError("Falha na inicialização do sistema");
        }
    }, 1500);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
} else {
    setTimeout(initialize, 200);
}
