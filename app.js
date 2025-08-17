// ==================== SISTEMA COMPLETO DE CONTATOS LUZIA ====================

// Variáveis globais para contatos
let contactsDatabase = [];
let isLearningMode = false;
let learningContactName = '';

// ==================== INICIALIZAÇÃO DO SISTEMA DE CONTATOS ====================
function initializeContactsSystem() {
    debug('Inicializando sistema de contatos...');
    loadContactsFromMemory();
    
    // Adiciona botão de gerenciar contatos na interface
    addContactsButton();
}

function addContactsButton() {
    const controlsDiv = document.querySelector('.controls');
    if (controlsDiv) {
        const contactsBtn = document.createElement('button');
        contactsBtn.className = 'control-btn';
        contactsBtn.innerHTML = '👥';
        contactsBtn.title = 'Gerenciar Contatos';
        contactsBtn.onclick = showContactsMenu;
        controlsDiv.appendChild(contactsBtn);
    }
}

// ==================== FUNÇÕES DE PERSISTÊNCIA ====================
function saveContactsToMemory() {
    // Em um ambiente real, usar localStorage
    // Por limitação do Claude.ai, usamos variável global
    debug(`Salvando ${contactsDatabase.length} contatos na memória`);
}

function loadContactsFromMemory() {
    // Carrega contatos básicos de emergência
    if (contactsDatabase.length === 0) {
        contactsDatabase = [
            { name: 'emergência', phone: '190', type: 'emergency' },
            { name: 'polícia', phone: '190', type: 'emergency' },
            { name: 'bombeiros', phone: '193', type: 'emergency' },
            { name: 'samu', phone: '192', type: 'emergency' },
            { name: 'defesa civil', phone: '199', type: 'emergency' }
        ];
        debug('Contatos de emergência carregados');
    }
}

// ==================== MENU DE GERENCIAMENTO DE CONTATOS ====================
function showContactsMenu() {
    const menu = `
    <div id="contacts-menu" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 20px;
    ">
        <div style="
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border: 2px solid #00e6ff;
            border-radius: 15px;
            padding: 30px;
            max-width: 400px;
            width: 90%;
        ">
            <h2 style="color: #00e6ff; text-align: center; margin-bottom: 20px;">
                📱 Gerenciar Contatos
            </h2>
            
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <button onclick="listContacts()" class="menu-btn">
                    📋 Listar Contatos (${contactsDatabase.length})
                </button>
                
                <button onclick="addContactManually()" class="menu-btn">
                    ➕ Adicionar Contato
                </button>
                
                <button onclick="importContactsFile()" class="menu-btn">
                    📁 Importar Arquivo
                </button>
                
                <button onclick="exportContacts()" class="menu-btn">
                    💾 Exportar Contatos
                </button>
                
                <button onclick="clearContacts()" class="menu-btn" style="background: #ff4444;">
                    🗑️ Limpar Tudo
                </button>
                
                <button onclick="closeContactsMenu()" class="menu-btn" style="background: #666;">
                    ❌ Fechar
                </button>
            </div>
        </div>
    </div>
    
    <style>
        .menu-btn {
            background: linear-gradient(45deg, #111, #333);
            color: #00e6ff;
            border: 1px solid #00e6ff;
            border-radius: 8px;
            padding: 12px;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .menu-btn:hover {
            background: #00e6ff;
            color: #000;
            transform: scale(1.05);
        }
    </style>
    `;
    
    document.body.insertAdjacentHTML('beforeend', menu);
}

function closeContactsMenu() {
    const menu = document.getElementById('contacts-menu');
    if (menu) menu.remove();
}

// ==================== FUNÇÕES DE GERENCIAMENTO ====================
function listContacts() {
    closeContactsMenu();
    
    if (contactsDatabase.length === 0) {
        speak("Você não tem contatos salvos ainda.");
        return;
    }
    
    const contactsList = contactsDatabase
        .map(contact => `${contact.name}: ${contact.phone}`)
        .join('\n');
    
    const listDiv = `
    <div id="contacts-list" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    ">
        <div style="
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border: 2px solid #00e6ff;
            border-radius: 15px;
            padding: 20px;
            max-width: 500px;
            width: 90%;
            max-height: 80%;
            overflow-y: auto;
        ">
            <h2 style="color: #00e6ff; text-align: center; margin-bottom: 20px;">
                📱 Seus Contatos (${contactsDatabase.length})
            </h2>
            
            <div style="
                background: rgba(0,0,0,0.3);
                border-radius: 10px;
                padding: 15px;
                margin-bottom: 20px;
                max-height: 300px;
                overflow-y: auto;
            ">
                ${contactsDatabase.map(contact => `
                    <div style="
                        color: #00e6ff;
                        padding: 8px;
                        border-bottom: 1px solid rgba(0,230,255,0.2);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <span>
                            <strong>${contact.name}</strong><br>
                            <small>${contact.phone}</small>
                        </span>
                        <div>
                            <button onclick="callContact('${contact.name}')" style="
                                background: #28a745;
                                color: white;
                                border: none;
                                padding: 5px 10px;
                                border-radius: 5px;
                                cursor: pointer;
                                margin-right: 5px;
                            ">📞</button>
                            <button onclick="whatsappContact('${contact.name}')" style="
                                background: #25d366;
                                color: white;
                                border: none;
                                padding: 5px 10px;
                                border-radius: 5px;
                                cursor: pointer;
                                margin-right: 5px;
                            ">💬</button>
                            <button onclick="deleteContact('${contact.name}')" style="
                                background: #dc3545;
                                color: white;
                                border: none;
                                padding: 5px 10px;
                                border-radius: 5px;
                                cursor: pointer;
                            ">🗑️</button>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <button onclick="closeContactsList()" style="
                width: 100%;
                background: #666;
                color: white;
                border: none;
                padding: 10px;
                border-radius: 8px;
                cursor: pointer;
            ">Fechar</button>
        </div>
    </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', listDiv);
    speak(`Você tem ${contactsDatabase.length} contatos salvos.`);
}

function closeContactsList() {
    const list = document.getElementById('contacts-list');
    if (list) list.remove();
}

function addContactManually() {
    closeContactsMenu();
    
    const form = `
    <div id="add-contact-form" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
    ">
        <div style="
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border: 2px solid #00e6ff;
            border-radius: 15px;
            padding: 30px;
            max-width: 400px;
            width: 90%;
        ">
            <h2 style="color: #00e6ff; text-align: center; margin-bottom: 20px;">
                ➕ Novo Contato
            </h2>
            
            <div style="margin-bottom: 15px;">
                <label style="color: #00e6ff; display: block; margin-bottom: 5px;">Nome:</label>
                <input type="text" id="contact-name" style="
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #00e6ff;
                    border-radius: 5px;
                    background: rgba(0,0,0,0.3);
                    color: #00e6ff;
                " placeholder="Ex: João Silva">
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="color: #00e6ff; display: block; margin-bottom: 5px;">Telefone:</label>
                <input type="tel" id="contact-phone" style="
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #00e6ff;
                    border-radius: 5px;
                    background: rgba(0,0,0,0.3);
                    color: #00e6ff;
                " placeholder="Ex: 81987654321">
            </div>
            
            <div style="display: flex; gap: 10px;">
                <button onclick="saveNewContact()" style="
                    flex: 1;
                    background: #28a745;
                    color: white;
                    border: none;
                    padding: 12px;
                    border-radius: 8px;
                    cursor: pointer;
                ">💾 Salvar</button>
                
                <button onclick="closeAddContactForm()" style="
                    flex: 1;
                    background: #666;
                    color: white;
                    border: none;
                    padding: 12px;
                    border-radius: 8px;
                    cursor: pointer;
                ">❌ Cancelar</button>
            </div>
        </div>
    </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', form);
    
    // Foco no campo nome
    setTimeout(() => {
        document.getElementById('contact-name').focus();
    }, 100);
}

function saveNewContact() {
    const name = document.getElementById('contact-name').value.trim();
    const phone = document.getElementById('contact-phone').value.trim();
    
    if (!name || !phone) {
        alert('Por favor, preencha nome e telefone!');
        return;
    }
    
    const normalizedPhone = normalizeBRPhone(phone);
    
    // Verifica se já existe
    const existingIndex = contactsDatabase.findIndex(c => 
        c.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existingIndex !== -1) {
        if (confirm('Contato já existe. Deseja atualizar?')) {
            contactsDatabase[existingIndex].phone = normalizedPhone;
            speak(`Contato ${name} atualizado!`);
        }
    } else {
        contactsDatabase.push({
            name: name.toLowerCase(),
            phone: normalizedPhone,
            type: 'user'
        });
        speak(`Contato ${name} adicionado com sucesso!`);
    }
    
    saveContactsToMemory();
    closeAddContactForm();
}

function closeAddContactForm() {
    const form = document.getElementById('add-contact-form');
    if (form) form.remove();
}

// ==================== IMPORTAÇÃO DE ARQUIVOS ====================
function importContactsFile() {
    closeContactsMenu();
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.vcf,.txt';
    input.onchange = handleContactsFileUpload;
    input.click();
    
    speak("Selecione um arquivo CSV, VCF ou TXT com seus contatos.");
}

function handleContactsFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        
        try {
            if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
                parseCSVContacts(content);
            } else if (file.name.endsWith('.vcf')) {
                parseVCFContacts(content);
            }
        } catch (error) {
            debug('Erro ao processar arquivo: ' + error.message);
            speak("Erro ao processar o arquivo. Verifique o formato.");
        }
    };
    reader.readAsText(file, 'UTF-8');
}

function parseCSVContacts(csvContent) {
    const lines = csvContent.split('\n');
    let imported = 0;
    
    lines.forEach((line, index) => {
        if (!line.trim()) return;
        
        // Tenta diferentes formatos
        let name, phone;
        
        // Formato: Nome,Telefone
        if (line.includes(',')) {
            const parts = line.split(',');
            name = parts[0]?.trim().replace(/"/g, '');
            phone = parts[1]?.trim().replace(/"/g, '');
        }
        // Formato: Nome: Telefone
        else if (line.includes(':')) {
            const parts = line.split(':');
            name = parts[0]?.trim();
            phone = parts[1]?.trim();
        }
        // Formato: Nome - Telefone
        else if (line.includes(' - ')) {
            const parts = line.split(' - ');
            name = parts[0]?.trim();
            phone = parts[1]?.trim();
        }
        
        if (name && phone) {
            const cleanPhone = phone.replace(/\D/g, '');
            if (cleanPhone.length >= 10) {
                // Verifica se já existe
                const exists = contactsDatabase.find(c => 
                    c.name.toLowerCase() === name.toLowerCase()
                );
                
                if (!exists) {
                    contactsDatabase.push({
                        name: name.toLowerCase(),
                        phone: normalizeBRPhone(cleanPhone),
                        type: 'imported'
                    });
                    imported++;
                }
            }
        }
    });
    
    saveContactsToMemory();
    speak(`${imported} contatos importados com sucesso!`);
    debug(`Importados ${imported} contatos do arquivo CSV`);
}

function parseVCFContacts(vcfContent) {
    const entries = vcfContent.split('BEGIN:VCARD');
    let imported = 0;
    
    entries.forEach(entry => {
        if (!entry.includes('FN:') && !entry.includes('N:')) return;
        
        const nameMatch = entry.match(/FN:(.+)/i) || entry.match(/N:([^;]+)/i);
        const phoneMatch = entry.match(/TEL[^:]*:([+\d\s\-\(\)]+)/i);
        
        if (nameMatch && phoneMatch) {
            const name = nameMatch[1].trim().replace(/\r/g, '');
            const phone = phoneMatch[1].trim().replace(/\D/g, '');
            
            if (name && phone && phone.length >= 10) {
                const exists = contactsDatabase.find(c => 
                    c.name.toLowerCase() === name.toLowerCase()
                );
                
                if (!exists) {
                    contactsDatabase.push({
                        name: name.toLowerCase(),
                        phone: normalizeBRPhone(phone),
                        type: 'imported'
                    });
                    imported++;
                }
            }
        }
    });
    
    saveContactsToMemory();
    speak(`${imported} contatos importados do arquivo VCF!`);
    debug(`Importados ${imported} contatos do arquivo VCF`);
}

// ==================== EXPORTAÇÃO DE CONTATOS ====================
function exportContacts() {
    closeContactsMenu();
    
    if (contactsDatabase.length === 0) {
        speak("Não há contatos para exportar.");
        return;
    }
    
    // Gera CSV
    let csvContent = "Nome,Telefone,Tipo\n";
    contactsDatabase.forEach(contact => {
        csvContent += `"${contact.name}","${contact.phone}","${contact.type || 'user'}"\n`;
    });
    
    // Download do arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `luz-contatos-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    speak(`${contactsDatabase.length} contatos exportados para arquivo CSV.`);
}

// ==================== BUSCA INTELIGENTE ====================
function findContactIntelligent(searchName) {
    if (!searchName) return null;
    
    const normalizedSearch = searchName.toLowerCase().trim();
    
    // Busca exata
    let contact = contactsDatabase.find(c => c.name === normalizedSearch);
    if (contact) return contact;
    
    // Busca que contém
    contact = contactsDatabase.find(c => 
        c.name.includes(normalizedSearch) || normalizedSearch.includes(c.name)
    );
    if (contact) return contact;
    
    // Busca por iniciais
    contact = contactsDatabase.find(c => {
        const initials = c.name.split(' ').map(word => word[0]).join('');
        return initials === normalizedSearch.replace(/\s/g, '');
    });
    if (contact) return contact;
    
    // Busca fonética (remove acentos)
    const phoneticSearch = removeDiacritics(normalizedSearch);
    contact = contactsDatabase.find(c => {
        const phoneticName = removeDiacritics(c.name);
        return phoneticName.includes(phoneticSearch) || phoneticSearch.includes(phoneticName);
    });
    
    return contact;
}

function removeDiacritics(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// ==================== FUNÇÕES DE AÇÃO ====================
function callContact(contactName) {
    const contact = findContactIntelligent(contactName);
    if (contact) {
        const phoneNumber = normalizeBRPhone(contact.phone);
        window.open(`tel:${phoneNumber}`, '_self');
        closeContactsList();
        speak(`Ligando para ${contact.name}`);
    }
}

function whatsappContact(contactName) {
    const contact = findContactIntelligent(contactName);
    if (contact) {
        const phoneNumber = normalizeBRPhone(contact.phone);
        window.open(`https://wa.me/${phoneNumber}`, '_blank');
        closeContactsList();
        speak(`Abrindo WhatsApp para ${contact.name}`);
    }
}

function deleteContact(contactName) {
    if (confirm(`Tem certeza que deseja excluir ${contactName}?`)) {
        contactsDatabase = contactsDatabase.filter(c => c.name !== contactName.toLowerCase());
        saveContactsToMemory();
        speak(`Contato ${contactName} excluído.`);
        
        // Atualiza a lista
        closeContactsList();
        setTimeout(listContacts, 500);
    }
}

function clearContacts() {
    if (confirm('Tem certeza que deseja excluir TODOS os contatos?')) {
        contactsDatabase = [];
        saveContactsToMemory();
        closeContactsMenu();
        speak("Todos os contatos foram excluídos.");
    }
}

// ==================== SISTEMA DE APRENDIZADO ====================
function enterLearningMode(name) {
    isLearningMode = true;
    learningContactName = name;
    speak(`Fale o número de telefone de ${name}. Apenas os números.`);
    
    if (statusText) {
        statusText.textContent = `🎓 Aprendendo: ${name}`;
    }
}

function exitLearningMode() {
    isLearningMode = false;
    learningContactName = '';
    if (statusText) {
        statusText.textContent = "Toque no microfone para falar";
    }
}

function processLearningInput(message) {
    const numbers = message.replace(/\D/g, '');
    
    if (numbers.length >= 10 && numbers.length <= 13) {
        const normalizedPhone = normalizeBRPhone(numbers);
        
        contactsDatabase.push({
            name: learningContactName.toLowerCase(),
            phone: normalizedPhone,
            type: 'learned'
        });
        
        saveContactsToMemory();
        speak(`Contato ${learningContactName} salvo! Ligando agora.`);
        
        // Liga para o número
        window.open(`tel:${normalizedPhone}`, '_self');
        
        exitLearningMode();
        return true;
    } else {
        speak("Número inválido. Tente novamente falando apenas os números.");
        return false;
    }
}

// ==================== INTEGRAÇÃO COM TAKECOMMAND ====================
function takeCommandWithSmartContacts(message) {
    debug('Comando recebido: ' + message);
    
    if (content) content.textContent = message;
    
    // Se estiver no modo aprendizado
    if (isLearningMode) {
        if (processLearningInput(message)) {
            return;
        } else {
            return; // Continua no modo aprendizado
        }
    }
    
    const lowerMessage = message.toLowerCase().trim();

    // Comandos de gerenciamento de contatos
    if (lowerMessage.includes('listar contatos') || lowerMessage.includes('meus contatos')) {
        listContacts();
        return;
    }
    
    if (lowerMessage.includes('adicionar contato') || lowerMessage.includes('novo contato')) {
        addContactManually();
        return;
    }
    
    if (lowerMessage.includes('importar contatos')) {
        importContactsFile();
        return;
    }

    // Comandos básicos
    if (lowerMessage.includes('olá') || lowerMessage.includes('oi') || lowerMessage.includes('hey luz')) {
        speak("Olá! Como posso ajudar você hoje?");
        return;
    }

    if (lowerMessage.includes('que horas') || lowerMessage.includes('hora')) {
        const now = new Date();
        const timeString = now.toLocaleTimeString('pt-BR');
        speak(`Agora são ${timeString}`);
        return;
    }

    if (lowerMessage.includes('que dia') || lowerMessage.includes('data')) {
        const now = new Date();
        const dateString = now.toLocaleDateString('pt-BR');
        speak(`Hoje é ${dateString}`);
        return;
    }

    if (lowerMessage.includes('obrigado') || lowerMessage.includes('valeu')) {
        speak("De nada! Estou aqui para ajudar.");
        return;
    }

    // Comandos de ligação inteligentes
    if (lowerMessage.includes('ligar para') || lowerMessage.includes('chamar') || lowerMessage.includes('telefonar para')) {
        handleSmartCallCommand(lowerMessage);
        return;
    }

    // Comandos WhatsApp inteligentes
    if (lowerMessage.includes('whatsapp') || lowerMessage.includes('zap') || lowerMessage.includes('mensagem para')) {
        handleSmartWhatsAppCommand(lowerMessage);
        return;
    }

    // Outros comandos existentes...
    if (lowerMessage.includes('abrir') || lowerMessage.includes('navegar para') || lowerMessage.includes('ir para')) {
        handleWebCommand(lowerMessage);
        return;
    }

    if (lowerMessage.includes('pesquisar') || lowerMessage.includes('procurar') || lowerMessage.includes('buscar')) {
        handleSearchCommand(lowerMessage);
        return;
    }

    if (lowerMessage.includes('música') || lowerMessage.includes('tocar') || lowerMessage.includes('youtube')) {
        handleMusicCommand(lowerMessage);
        return;
    }

    // Se tem API do Gemini configurada
    if (GEMINI_API_KEY && GEMINI_API_KEY !== "AIzaSyCDC-EhjOGfGCWgJEGzvgfRtQwpusDA-Lg") {
        queryGemini(message).then(response => {
            if (content) content.textContent = response;
            speak(response);
        });
    } else {
        speak("Desculpe, não entendi o comando. Tente novamente.");
    }
}

function handleSmartCallCommand(message) {
    debug('Processando comando de ligação inteligente: ' + message);
    
    let name = extractNameFromMessage(message, ['ligar para', 'chamar', 'telefonar para']);
    
    if (name) {
        const contact = findContactIntelligent(name);
        
        if (contact) {
            speak(`Ligando para ${contact.name}`);
            const phoneNumber = normalizeBRPhone(contact.phone);
            window.open(`tel:${phoneNumber}`, '_self');
        } else {
            speak(`Não encontrei ${name} nos meus contatos. Vou aprender este contato.`);
            enterLearningMode(name);
        }
    } else {
        speak("Para quem você gostaria que eu ligasse?");
    }
}

function handleSmartWhatsAppCommand(message) {
    debug('Processando comando WhatsApp inteligente: ' + message);
    
    let name = extractNameFromMessage(message, ['whatsapp para', 'zap para', 'mensagem para', 'chamar']);
    name = name.replace(/no whatsapp|pelo whatsapp|whatsapp/g, '').trim();
    
    if (name) {
        const contact = findContactIntelligent(name);
        
        if (contact) {
            speak(`Abrindo WhatsApp para ${contact.name}`);
            const phoneNumber = normalizeBRPhone(contact.phone);
            window.open(`https://wa.me/${phoneNumber}`, '_blank');
        } else {
            speak(`Não encontrei ${name} nos meus contatos. Vou aprender este contato.`);
            enterLearningMode(name);
        }
    } else {
        speak("Para quem você gostaria de enviar mensagem no WhatsApp?");
    }
}

function extractNameFromMessage(message, prefixes) {
    for (let prefix of prefixes) {
        if (message.includes(prefix)) {
            return message.split(prefix)[1].trim();
        }
    }
    return '';
}

// ==================== COMANDOS WEB, PESQUISA E MÚSICA ====================
function handleWebCommand(message) {
    debug('Processando comando web: ' + message);
    
    let site = '';
    if (message.includes('abrir ')) {
        site = message.split('abrir ')[1];
    } else if (message.includes('navegar para ')) {
        site = message.split('navegar para ')[1];
    } else if (message.includes('ir para ')) {
        site = message.split('ir para ')[1];
    }

    const sites = {
        'google': 'https://www.google.com',
        'youtube': 'https://www.youtube.com',
        'facebook': 'https://www.facebook.com',
        'instagram': 'https://www.instagram.com',
        'twitter': 'https://www.twitter.com',
        'gmail': 'https://mail.google.com',
        'whatsapp web': 'https://web.whatsapp.com'
    };

    site = site.toLowerCase().trim();
    
    if (sites[site]) {
        speak(`Abrindo ${site}`);
        window.open(sites[site], '_blank');
    } else if (site.includes('.com') || site.includes('.br') || site.includes('www.')) {
        const url = site.startsWith('http') ? site : `https://${site}`;
        speak(`Abrindo ${site}`);
        window.open(url, '_blank');
    } else {
        speak("Qual site você gostaria que eu abrisse?");
    }
}

function handleSearchCommand(message) {
    let searchTerm = '';
    if (message.includes('pesquisar ')) {
        searchTerm = message.split('pesquisar ')[1];
    } else if (message.includes('procurar ')) {
        searchTerm = message.split('procurar ')[1];
    } else if (message.includes('buscar ')) {
        searchTerm = message.split('buscar ')[1];
    }

    searchTerm = searchTerm.replace(/no google|google/g, '').trim();

    if (searchTerm) {
        speak(`Pesquisando por ${searchTerm}`);
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`;
        window.open(searchUrl, '_blank');
    } else {
        speak("O que você gostaria de pesquisar?");
    }
}

function handleMusicCommand(message) {
    let music = '';
    if (message.includes('tocar ')) {
        music = message.split('tocar ')[1];
    } else if (message.includes('música ')) {
        music = message.split('música ')[1];
    }

    music = music.replace(/no youtube|youtube/g, '').trim();

    if (music) {
        speak(`Procurando ${music} no YouTube`);
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(music)}`;
        window.open(searchUrl, '_blank');
    } else {
        speak("Que música você gostaria de ouvir?");
    }
}

// ==================== INICIALIZAÇÃO AUTOMÁTICA ====================
// Esta função deve ser chamada quando o sistema LUZ for inicializado
function initializeLUZWithContacts() {
    debug('Inicializando LUZ com sistema de contatos...');
    
    // Inicializa o sistema de contatos
    initializeContactsSystem();
    
    // Sobrescreve a função takeCommand original
    if (typeof window !== 'undefined') {
        window.takeCommand = takeCommandWithSmartContacts;
    }
    
    debug('Sistema de contatos integrado com sucesso!');
}

// ==================== COMANDOS DE VOZ ADICIONAIS ====================
function handleAdvancedVoiceCommands(message) {
    const lowerMessage = message.toLowerCase().trim();
    
    // Comandos de status do sistema
    if (lowerMessage.includes('quantos contatos') || lowerMessage.includes('número de contatos')) {
        const count = contactsDatabase.length;
        speak(`Você tem ${count} contatos salvos.`);
        return true;
    }
    
    // Comando para encontrar contato específico
    if (lowerMessage.includes('encontrar contato') || lowerMessage.includes('procurar contato')) {
        const name = lowerMessage.replace(/encontrar contato|procurar contato/g, '').trim();
        if (name) {
            const contact = findContactIntelligent(name);
            if (contact) {
                speak(`Encontrei ${contact.name} com o número ${contact.phone}`);
            } else {
                speak(`Não encontrei nenhum contato com o nome ${name}`);
            }
        } else {
            speak("Qual contato você quer encontrar?");
        }
        return true;
    }
    
    // Comando de backup
    if (lowerMessage.includes('fazer backup dos contatos') || lowerMessage.includes('salvar contatos')) {
        exportContacts();
        return true;
    }
    
    // Comando de ajuda
    if (lowerMessage.includes('ajuda com contatos') || lowerMessage.includes('comandos de contatos')) {
        const helpText = `
        Comandos disponíveis para contatos:
        - Ligar para [nome]
        - WhatsApp para [nome]
        - Adicionar contato
        - Listar contatos
        - Importar contatos
        - Quantos contatos tenho
        - Encontrar contato [nome]
        `;
        speak("Posso ajudar com ligações, WhatsApp, adicionar, listar, importar contatos e muito mais. Diga 'listar contatos' para ver todos.");
        return true;
    }
    
    return false;
}

// ==================== MELHORIAS NA FUNÇÃO PRINCIPAL ====================
function takeCommandWithSmartContactsEnhanced(message) {
    debug('Comando recebido: ' + message);
    
    if (content) content.textContent = message;
    
    // Se estiver no modo aprendizado
    if (isLearningMode) {
        if (processLearningInput(message)) {
            return;
        } else {
            return; // Continua no modo aprendizado
        }
    }
    
    const lowerMessage = message.toLowerCase().trim();

    // Verifica comandos avançados primeiro
    if (handleAdvancedVoiceCommands(message)) {
        return;
    }

    // Comandos de gerenciamento de contatos
    if (lowerMessage.includes('listar contatos') || lowerMessage.includes('meus contatos')) {
        listContacts();
        return;
    }
    
    if (lowerMessage.includes('adicionar contato') || lowerMessage.includes('novo contato')) {
        addContactManually();
        return;
    }
    
    if (lowerMessage.includes('importar contatos')) {
        importContactsFile();
        return;
    }

    if (lowerMessage.includes('gerenciar contatos') || lowerMessage.includes('menu contatos')) {
        showContactsMenu();
        return;
    }

    // Comandos básicos
    if (lowerMessage.includes('olá') || lowerMessage.includes('oi') || lowerMessage.includes('hey luz')) {
        speak("Olá! Como posso ajudar você hoje?");
        return;
    }

    if (lowerMessage.includes('que horas') || lowerMessage.includes('hora')) {
        const now = new Date();
        const timeString = now.toLocaleTimeString('pt-BR');
        speak(`Agora são ${timeString}`);
        return;
    }

    if (lowerMessage.includes('que dia') || lowerMessage.includes('data')) {
        const now = new Date();
        const dateString = now.toLocaleDateString('pt-BR');
        speak(`Hoje é ${dateString}`);
        return;
    }

    if (lowerMessage.includes('obrigado') || lowerMessage.includes('valeu')) {
        speak("De nada! Estou aqui para ajudar.");
        return;
    }

    // Comandos de ligação inteligentes
    if (lowerMessage.includes('ligar para') || lowerMessage.includes('chamar') || lowerMessage.includes('telefonar para')) {
        handleSmartCallCommand(lowerMessage);
        return;
    }

    // Comandos WhatsApp inteligentes
    if (lowerMessage.includes('whatsapp') || lowerMessage.includes('zap') || lowerMessage.includes('mensagem para')) {
        handleSmartWhatsAppCommand(lowerMessage);
        return;
    }

    // Outros comandos existentes...
    if (lowerMessage.includes('abrir') || lowerMessage.includes('navegar para') || lowerMessage.includes('ir para')) {
        handleWebCommand(lowerMessage);
        return;
    }

    if (lowerMessage.includes('pesquisar') || lowerMessage.includes('procurar') || lowerMessage.includes('buscar')) {
        handleSearchCommand(lowerMessage);
        return;
    }

    if (lowerMessage.includes('música') || lowerMessage.includes('tocar') || lowerMessage.includes('youtube')) {
        handleMusicCommand(lowerMessage);
        return;
    }

    // Se tem API do Gemini configurada
    if (typeof GEMINI_API_KEY !== 'undefined' && GEMINI_API_KEY && GEMINI_API_KEY !== "AIzaSyCDC-EhjOGfGCWgJEGzvgfRtQwpusDA-Lg") {
        queryGemini(message).then(response => {
            if (content) content.textContent = response;
            speak(response);
        });
    } else {
        speak("Desculpe, não entendi o comando. Tente novamente.");
    }
}

// ==================== AUTO-INICIALIZAÇÃO ====================
// Aguarda o DOM carregar e inicializa automaticamente
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initializeLUZWithContacts, 2000);
        });
    } else {
        setTimeout(initializeLUZWithContacts, 2000);
    }
}

// ==================== EXPORTAÇÃO PARA USO GLOBAL ====================
// Torna as funções principais disponíveis globalmente
if (typeof window !== 'undefined') {
    window.initializeLUZWithContacts = initializeLUZWithContacts;
    window.takeCommand = takeCommandWithSmartContactsEnhanced;
    window.showContactsMenu = showContactsMenu;
    window.listContacts = listContacts;
    window.addContactManually = addContactManually;
    window.importContactsFile = importContactsFile;
    
    // Funções para uso nos botões HTML
    window.callContact = callContact;
    window.whatsappContact = whatsappContact;
    window.deleteContact = deleteContact;
    window.saveNewContact = saveNewContact;
    window.closeContactsMenu = closeContactsMenu;
    window.closeContactsList = closeContactsList;
    window.closeAddContactForm = closeAddContactForm;
    window.clearContacts = clearContacts;
    window.exportContacts = exportContacts;
}

console.log('🤖 Sistema completo de contatos LuzIA carregado!');