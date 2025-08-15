
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

    // Cancelar fala anterior
    speechSynthesis.cancel();

    // Aguardar um pouco para evitar problemas no iOS
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
        
        // Parar o stream imediatamente
        stream.getTracks().forEach(track => track.stop());
        debug('Permissão concedida');
        return true;
    } catch (error) {
        debug('Erro ao solicitar permissão: ' + error.message);
        showError('Permissão do microfone necessária. Permita o acesso.');
        return false;
    }
}

// ==================== FUNÇÕES AUXILIARES PARA COMANDOS ====================
function extractPhoneNumber(text) {
    // Remover palavras comuns e manter apenas números e espaços
    const cleanText = text.replace(/ligar|para|numero|telefone|celular|chamar|whatsapp/g, '').trim();
    // Buscar padrões de telefone brasileiro
    const phonePattern = /(\d{2,3}[\s-]?\d{4,5}[\s-]?\d{4}|\d{8,11})/;
    const match = cleanText.match(phonePattern);
    return match ? match[0].replace(/[\s-]/g, '') : null;
}

function extractContactName(text) {
    // Remover palavras de comando e extrair possível nome
    const cleanText = text.replace(/ligar|para|chamar|whatsapp|numero|telefone|celular/g, '').trim();
    // Se não há números, provavelmente é um nome
    if (!/\d/.test(cleanText) && cleanText.length > 2) {
        return cleanText;
    }
    return null;
}

function extractLocation(text) {
    const cleanText = text.replace(/maps|mapa|navegar|ir|para|onde|fica|localizar/g, '').trim();
    return cleanText || null;
}

function tryNativeApp(nativeUrl, webUrl, successMessage) {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!isMobile) {
        window.open(webUrl, '_blank');
        speak(successMessage);
        return;
    }
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = nativeUrl;
    document.body.appendChild(iframe);
    setTimeout(() => {
        document.body.removeChild(iframe);
        window.open(webUrl, '_blank');
    }, 2000);
    speak(successMessage);
}

async function findContactByName(targetName) {
    const hasContactPicker = checkContactPickerSupport();
    
    if (!hasContactPicker) {
        debug('Contact Picker API não suportada');
        return null;
    }

    try {
        debug('Buscando contato com nome: ' + targetName);
        speak(`Procurando ${targetName} na agenda...`);
        
        // Solicitar acesso aos contatos
        const contacts = await navigator.contacts.select(['name', 'tel'], { multiple: true });
        
        if (!contacts || contacts.length === 0) {
            return null;
        }
        
        // Normalizar nome buscado
        const normalizedTarget = targetName.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
        
        // Procurar contato que corresponda ao nome
        const matchedContact = contacts.find(contact => {
            if (!contact.name || contact.name.length === 0) return false;
            
            const contactName = contact.name[0].toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");
            
            // Verificar se o nome contém o termo buscado ou vice-versa
            return contactName.includes(normalizedTarget) || 
                   normalizedTarget.includes(contactName);
        });
        
        if (matchedContact) {
            debug('Contato encontrado: ' + JSON.stringify(matchedContact));
            return {
                name: matchedContact.name[0],
                tel: matchedContact.tel ? matchedContact.tel[0] : null
            };
        }
        
        return null;
    } catch (error) {
        debug('Erro ao buscar contato: ' + error.message);
        return null;
    }
}

// ==================== FUNÇÕES DE LIGAÇÃO MELHORADAS ====================
async function makeCall(message) {
    // Primeiro, tentar extrair número diretamente
    const phoneNumber = extractPhoneNumber(message);
    
    if (phoneNumber) {
        // Número encontrado - fazer ligação direta
        debug('Número encontrado: ' + phoneNumber);
        const telUrl = `tel:${phoneNumber}`;
        window.location.href = telUrl;
        speak(`Ligando para ${phoneNumber}`);
        return;
    }
    
    // Se não há número, tentar encontrar nome
    const contactName = extractContactName(message);
    
    if (contactName) {
        debug('Nome encontrado: ' + contactName);
        
        // Verificar se Contact Picker é suportado
        const hasContactPicker = checkContactPickerSupport();
        
        if (hasContactPicker) {
            // Tentar encontrar contato por nome
            const contact = await findContactByName(contactName);
            
            if (contact && contact.tel) {
                const telUrl = `tel:${contact.tel}`;
                window.location.href = telUrl;
                speak(`Ligando para ${contact.name}: ${contact.tel}`);
                return;
            } else if (contact && !contact.tel) {
                speak(`${contact.name} encontrado, mas não tem número de telefone.`);
                return;
            }
        }
        
        // Se não encontrou ou não tem suporte, oferecer seleção manual
        speak(`Não encontrei ${contactName}. Vou abrir sua agenda para você escolher.`);
        
        if (hasContactPicker) {
            const selectedContact = await selectContactFromPicker();
            if (selectedContact && selectedContact.tel) {
                const telUrl = `tel:${selectedContact.tel}`;
                window.location.href = telUrl;
                speak(`Ligando para ${selectedContact.name}: ${selectedContact.tel}`);
                return;
            }
        }
    }
    
    // Fallback - abrir discador
    speak("Não consegui identificar o contato. Diga 'ligar para' seguido do nome ou número.");
}

async function sendWhatsApp(message) {
    // Primeiro, tentar extrair número diretamente
    const phoneNumber = extractPhoneNumber(message);
    
    if (phoneNumber) {
        debug('WhatsApp para número: ' + phoneNumber);
        const whatsappUrl = `whatsapp://send?phone=55${phoneNumber}`;
        const webWhatsapp = `https://web.whatsapp.com/send?phone=55${phoneNumber}`;
        tryNativeApp(whatsappUrl, webWhatsapp, `Abrindo WhatsApp para ${phoneNumber}`);
        return;
    }
    
    // Se não há número, tentar encontrar nome
    const contactName = extractContactName(message);
    
    if (contactName) {
        debug('WhatsApp para nome: ' + contactName);
        
        const hasContactPicker = checkContactPickerSupport();
        
        if (hasContactPicker) {
            const contact = await findContactByName(contactName);
            
            if (contact && contact.tel) {
                const whatsappUrl = `whatsapp://send?phone=55${contact.tel}`;
                const webWhatsapp = `https://web.whatsapp.com/send?phone=55${contact.tel}`;
                tryNativeApp(whatsappUrl, webWhatsapp, `Abrindo WhatsApp para ${contact.name}`);
                return;
            } else if (contact && !contact.tel) {
                speak(`${contact.name} encontrado, mas não tem número de telefone.`);
                return;
            }
        }
        
        // Se não encontrou, oferecer seleção manual
        speak(`Não encontrei ${contactName}. Vou abrir sua agenda para você escolher.`);
        
        if (hasContactPicker) {
            const selectedContact = await selectContactFromPicker();
            if (selectedContact && selectedContact.tel) {
                const whatsappUrl = `whatsapp://send?phone=55${selectedContact.tel}`;
                const webWhatsapp = `https://web.whatsapp.com/send?phone=55${selectedContact.tel}`;
                tryNativeApp(whatsappUrl, webWhatsapp, `Abrindo WhatsApp para ${selectedContact.name}`);
                return;
            }
        }
    }
    
    // Fallback - WhatsApp genérico
    tryNativeApp("whatsapp://", "https://web.whatsapp.com", "Abrindo WhatsApp.");
}

// ==================== PROCESSAMENTO DE COMANDOS ====================
async function takeCommand(message) {
    debug('Processando comando: ' + message);
    if (statusText) statusText.textContent = "Executando...";
    
    // Normalizar texto (remover acentos)
    const normalizedMessage = message
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

    debug('Comando normalizado: ' + normalizedMessage);

    try {
        // ==================== SAUDAÇÕES E TESTES ====================
        if (normalizedMessage.includes('ola') || normalizedMessage.includes('oi')) {
            speak("Olá! Como posso ajudar?");
        }
        else if (normalizedMessage.includes('testar contatos') || normalizedMessage.includes('agenda')) {
            const hasSupport = checkContactPickerSupport();
            if (hasSupport) {
                speak("Contact Picker suportado! Abrindo sua agenda...");
                const contact = await selectContactFromPicker();
                if (contact) {
                    speak(`Contato selecionado: ${contact.name || 'Sem nome'}, telefone: ${contact.tel || 'Sem telefone'}`);
                } else {
                    speak("Nenhum contato foi selecionado.");
                }
            } else {
                speak("Acesso à agenda não suportado neste navegador. Use Chrome no Android.");
            }
        }
        
        // ==================== LIGAÇÕES ====================
        else if (normalizedMessage.includes('ligar') || normalizedMessage.includes('telefonar')) {
            await makeCall(normalizedMessage);
        }
        
        // ==================== WHATSAPP ====================
        else if (normalizedMessage.includes('whatsapp') && (normalizedMessage.includes('ligar') || normalizedMessage.includes('chamar') || normalizedMessage.includes('para'))) {
            await sendWhatsApp(normalizedMessage);
        }
        else if (normalizedMessage.includes("whatsapp")) {
            // WhatsApp genérico
            tryNativeApp("whatsapp://", "https://web.whatsapp.com", "Abrindo WhatsApp.");
        }
        
        // ==================== MAPAS ====================
        else if (normalizedMessage.includes('maps') || normalizedMessage.includes('mapa') || 
                 normalizedMessage.includes('navegar') || normalizedMessage.includes('localizar')) {
            const location = extractLocation(normalizedMessage);
            if (location) {
                debug('Abrindo mapas para: ' + location);
                
                // URLs para diferentes apps de mapa
                const googleMapsApp = `comgooglemaps://?q=${encodeURIComponent(location)}`;
                const appleMapsApp = `maps://?q=${encodeURIComponent(location)}`;
                const webMaps = `https://www.google.com/maps/search/${encodeURIComponent(location)}`;
                
                // Detectar dispositivo e tentar app apropriado
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                const nativeUrl = isIOS ? appleMapsApp : googleMapsApp;
                
                tryNativeApp(nativeUrl, webMaps, `Abrindo mapas para ${location}`);
            } else {
                // Mapas genérico
                const webMaps = "https://www.google.com/maps";
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                const nativeUrl = isIOS ? "maps://" : "comgooglemaps://";
                
                tryNativeApp(nativeUrl, webMaps, "Abrindo mapas.");
            }
        }
        
        // ==================== OUTROS APPS NATIVOS ====================
        else if (normalizedMessage.includes('camera') || normalizedMessage.includes('foto')) {
            // Abrir câmera
            speak("Abrindo câmera.");
            try {
                window.location.href = "camera://";
            } catch (e) {
                debug('Erro ao abrir câmera nativa: ' + e.message);
            }
            // Fallback: input file com camera
            setTimeout(() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.capture = 'camera';
                input.style.display = 'none';
                document.body.appendChild(input);
                input.click();
                setTimeout(() => {
                    document.body.removeChild(input);
                }, 1000);
            }, 1000);
        }
        
        else if (normalizedMessage.includes('sms') || normalizedMessage.includes('mensagem')) {
            const phoneNumber = extractPhoneNumber(normalizedMessage);
            const contactName = extractContactName(normalizedMessage);
            
            if (phoneNumber) {
                const smsUrl = `sms:${phoneNumber}`;
                window.location.href = smsUrl;
                speak(`Abrindo SMS para ${phoneNumber}`);
            } else if (contactName) {
                const hasContactPicker = checkContactPickerSupport();
                
                if (hasContactPicker) {
                    const contact = await findContactByName(contactName);
                    
                    if (contact && contact.tel) {
                        const smsUrl = `sms:${contact.tel}`;
                        window.location.href = smsUrl;
                        speak(`Abrindo SMS para ${contact.name}`);
                    } else {
                        speak(`Não encontrei ${contactName}. Abrindo seletor de contatos...`);
                        const selectedContact = await selectContactFromPicker();
                        if (selectedContact && selectedContact.tel) {
                            const smsUrl = `sms:${selectedContact.tel}`;
                            window.location.href = smsUrl;
                            speak(`Abrindo SMS para ${selectedContact.name}`);
                        }
                    }
                } else {
                    window.location.href = "sms:";
                    speak("Abrindo SMS.");
                }
            } else {
                window.location.href = "sms:";
                speak("Abrindo SMS.");
            }
        }
        
        else if (normalizedMessage.includes('email') || normalizedMessage.includes('mail')) {
            window.location.href = "mailto:";
            speak("Abrindo e-mail.");
        }
        
        else if (normalizedMessage.includes('configuracao') || normalizedMessage.includes('ajustes')) {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const settingsUrl = isIOS ? "App-Prefs:root" : "settings://";
            try {
                window.location.href = settingsUrl;
                speak("Abrindo configurações.");
            } catch (e) {
                debug('Erro ao abrir configurações: ' + e.message);
                speak("Não consegui abrir as configurações.");
            }
        }
        
        else if (normalizedMessage.includes('spotify')) {
            tryNativeApp("spotify://", "https://open.spotify.com", "Abrindo Spotify.");
        }
        
        else if (normalizedMessage.includes('netflix')) {
            tryNativeApp("nflx://", "https://www.netflix.com", "Abrindo Netflix.");
        }
        
        else if (normalizedMessage.includes('uber')) {
            tryNativeApp("uber://", "https://m.uber.com", "Abrindo Uber.");
        }
        
        else if (normalizedMessage.includes('ifood')) {
            tryNativeApp("ifood://", "https://www.ifood.com.br", "Abrindo iFood.");
        }
        
        // ==================== PESQUISAS WEB ====================
        else if (normalizedMessage.includes("google")) {
            const query = normalizedMessage.replace(/google/g, "").trim();
            if (query) {
                window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank");
                speak("Aqui está o que encontrei no Google.");
            } else {
                window.open("https://www.google.com", "_blank");
                speak("Abrindo Google.");
            }
        }
        else if (normalizedMessage.includes("youtube")) {
            const query = normalizedMessage.replace(/youtube/g, "").trim();
            if (query) {
                // Tentar app do YouTube primeiro
                const youtubeApp = `youtube://results?search_query=${encodeURIComponent(query)}`;
                const youtubeWeb = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
                tryNativeApp(youtubeApp, youtubeWeb, "Aqui está o que encontrei no YouTube.");
            } else {
                tryNativeApp("youtube://", "https://www.youtube.com", "Abrindo YouTube.");
            }
        }
        
        // ==================== INFORMAÇÕES ====================
        else if (normalizedMessage.includes('hora')) {
            const time = new Date().toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            speak(`Agora são ${time}`);
        }
        else if (normalizedMessage.includes('data')) {
            const date = new Date().toLocaleDateString('pt-BR');
            speak(`Hoje é ${date}`);
        }
        else if (normalizedMessage.includes('facebook')) {
            tryNativeApp("fb://", "https://facebook.com", "Abrindo Facebook.");
        }
        else if (normalizedMessage.includes('instagram')) {
            tryNativeApp("instagram://", "https://instagram.com", "Abrindo Instagram.");
        }
        else if (normalizedMessage.includes('tempo') || normalizedMessage.includes('clima')) {
            window.open("https://www.google.com/search?q=tempo+clima", "_blank");
            speak("Aqui está a previsão do tempo.");
        }
        else if (normalizedMessage.includes('noticias')) {
            window.open("https://www.google.com/news", "_blank");
            speak("Aqui estão as últimas notícias.");
        }
        else if (normalizedMessage.includes('calculadora')) {
            window.open("https://www.google.com/search?q=calculadora", "_blank");
            speak("Abrindo calculadora.");
        }
        
        // ==================== FALLBACK ====================
        else {
            window.open(`https://www.google.com/search?q=${encodeURIComponent(message)}`, "_blank");
            speak(`Encontrei informações sobre ${message}`);
        }
    } catch (error) {
        debug('Erro ao processar comando: ' + error.message);
        speak("Desculpe, houve um erro ao processar o comando.");
    }
    
    // Reset após comando
    setTimeout(() => {
        if (statusText) statusText.textContent = "Pronto para próximo comando";
        if (content) content.textContent = "Toque no microfone para falar";
    }, 3000);
}

// ==================== EVENTOS DO BOTÃO ====================
async function handleButtonClick(e) {
    e.preventDefault();
    
    debug('Botão clicado');
    
    if (isListening) {
        debug('Parando reconhecimento...');
        if (recognition) {
            recognition.stop();
        }
        return;
    }

    if (!isInitialized) {
        showError('Sistema ainda não inicializado. Aguarde...');
        return;
    }

    // Solicitar permissões se necessário
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
        if (content) content.textContent = "🎤 Ouvindo...";
        debug('Iniciando reconhecimento...');
        if (recognition) {
            recognition.start();
        } else {
            showError('Reconhecimento de voz não inicializado');
        }
    } catch (error) {
        debug('Erro ao iniciar reconhecimento: ' + error.message);
        showError('Erro ao iniciar reconhecimento: ' + error.message);
        stopListening();
    }
}

// ==================== INICIALIZAÇÃO ====================
function initialize() {
    debug('Inicializando sistema...');
    
    // Obter elementos DOM
    btn = document.getElementById('talkBtn');
    content = document.getElementById('content');
    statusText = document.getElementById('status');
    imageContainer = document.querySelector('.image-container');
    errorDiv = document.getElementById('error');
    debugDiv = document.getElementById('debug');

    // Verificar se elementos foram encontrados
    if (!btn) {
        console.error('Botão não encontrado (#talkBtn)');
        return;
    }
    if (!content) {
        console.error('Content não encontrado (#content)');
        return;
    }
    if (!statusText) {
        console.error('Status não encontrado (#status)');
        return;
    }
    if (!imageContainer) {
        console.error('Image container não encontrado (.image-container)');
        return;
    }
    if (!errorDiv) {
        console.error('Error div não encontrado (#error)');
        return;
    }
    if (!debugDiv) {
        console.error('Debug div não encontrado (#debug)');
        return;
    }

    // Adicionar event listener ao botão
    btn.addEventListener('click', handleButtonClick);
    btn.addEventListener('touchstart', handleButtonClick, { passive: false });
    
    // Aguardar um pouco para garantir que tudo carregou
    setTimeout(() => {
        if (initRecognition()) {
            isInitialized = true;
            debug('Sistema inicializado com sucesso');
            
            // Aguardar mais um pouco antes de falar
            setTimeout(() => {
                speak("JARVIS ativado e pronto!");
                setTimeout(() => {
                    wishMe();
                }, 2000);
            }, 1000);
        } else {
            debug('Falha na inicialização');
            showError('Falha na inicialização do sistema');
        }
    }, 2000);
}

// ==================== FUNÇÕES GLOBAIS PARA HTML ====================
window.toggleDebug = toggleDebug;

// ==================== COMPATIBILIDADE E OTIMIZAÇÕES ====================
// Prevenir zoom em double-tap
let lastTouchEnd = 0;
document.addEventListener('touchend', (event) => {
    const now = new Date().getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, { passive: false });

// Melhorar compatibilidade com iOS
document.addEventListener('touchstart', function() {
    if (speechSynthesis && speechSynthesis.speaking) return;
    
    // Inicializar síntese de voz no iOS
    try {
        if (speechSynthesis) {
            speechSynthesis.speak(new SpeechSynthesisUtterance(''));
        }
    } catch (error) {
        debug('Erro ao inicializar síntese no iOS: ' + error.message);
    }
}, { once: true });

// Adicionar listener para mudanças de visibilidade
document.addEventListener('visibilitychange', () => {
    if (document.hidden && isListening && recognition) {
        debug('Página ficou oculta, parando reconhecimento');
        recognition.stop();
    }
});

// Adicionar listener para mudanças de foco da janela
window.addEventListener('beforeunload', () => {
    if (isListening && recognition) {
        recognition.stop();
    }
    if (speechSynthesis && speechSynthesis.speaking) {
        speechSynthesis.cancel();
    }
});

// Adicionar listener para erros globais
window.addEventListener('error', (event) => {
    const msg = (event.error && event.error.message) ? event.error.message : event.message;
    debug('Erro global capturado: ' + msg);
});

window.addEventListener('unhandledrejection', (event) => {
    const msg = (event.reason && event.reason.message) ? event.reason.message : String(event.reason);
    debug('Promise rejeitada: ' + msg);
    event.preventDefault();
});

// ==================== INICIALIZAÇÃO PRINCIPAL ====================
// Aguardar carregamento completo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    // Se já carregou, aguardar um pouco e inicializar
    setTimeout(initialize, 100);
}

debug('Script app.js carregado');

// ==================== FUNÇÕES DE LIMPEZA ====================
function cleanup() {
    debug('Limpando recursos...');
    
    if (recognition) {
        recognition.stop();
        recognition = null;
    }
    
    if (speechSynthesis && speechSynthesis.speaking) {
        speechSynthesis.cancel();
    }
    
    isListening = false;
    isInitialized = false;
}

// Exportar função de limpeza para uso externo se necessário
window.jarvisCleanup = cleanup;