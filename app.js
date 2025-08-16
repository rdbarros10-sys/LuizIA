
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
        else if (normalizedMessage.includes('whatsapp') && 
                (normalizedMessage.includes('ligar') || normalizedMessage.includes('chamar') || normalizedMessage.includes('para'))) {
            await sendWhatsApp(normalizedMessage);
        }
        else if (normalizedMessage.includes("whatsapp")) {
            tryNativeApp("whatsapp://", "https://web.whatsapp.com", "Abrindo WhatsApp.");
        }
        
        // ==================== MAPAS ====================
        else if (normalizedMessage.includes('maps') || normalizedMessage.includes('mapa') || 
                 normalizedMessage.includes('navegar') || normalizedMessage.includes('localizar')) {
            const location = extractLocation(normalizedMessage);
            if (location) {
                debug('Abrindo mapas para: ' + location);
                
                const googleMapsApp = `comgooglemaps://?q=${encodeURIComponent(location)}`;
                const appleMapsApp = `maps://?q=${encodeURIComponent(location)}`;
                const webMaps = `https://www.google.com/maps/search/${encodeURIComponent(location)}`;
                
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                const nativeUrl = isIOS ? appleMapsApp : googleMapsApp;
                
                tryNativeApp(nativeUrl, webMaps, `Abrindo mapas para ${location}`);
            } else {
                const webMaps = "https://www.google.com/maps";
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                const nativeUrl = isIOS ? "maps://" : "comgooglemaps://";
                tryNativeApp(nativeUrl, webMaps, "Abrindo mapas.");
            }
        }
        
        // ... (restante dos comandos continua igual)

        // ==================== FALLBACK (Gemini) ====================
        else {
            const geminiResponse = await queryGemini(message);
            if (content) content.textContent = geminiResponse;
            speak(geminiResponse);
            debug(`Encontrei informações sobre: ${message}`);
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
