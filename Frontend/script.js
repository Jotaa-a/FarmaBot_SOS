/* =========================================================================
   FarmaBot SOS — Frontend
   -------------------------------------------------------------------------
   CONTRATO CON EL BACKEND (workflow n8n descrito en el caso de estudio):

   Petición (POST JSON) hacia el nodo Webhook / Chat Trigger:
     { "message": "<texto del usuario>", "session_id": "<uuid de sesión>" }

   Respuesta esperada del nodo "Respond to Webhook" (JSON):
     {
       "es_emergencia": true | false,
       "nivel_riesgo": "ALTO" | "BAJO",
       "razon": "string explicando la señal detectada",
       "respuesta": "texto conversacional para mostrar al usuario",
       "productos": [                       // solo en ruta comercial (RAG, k=3)
         {
           "nombre": "string",
           "categoria": "string",
           "indicaciones": "string",
           "dosis_recomendada": "string"
         }
       ]
     }

   Si el nodo LLM Router aún no está conectado, esta interfaz cae en un
   modo de demostración local (mockTriage) que simula la misma forma de
   respuesta, para poder mostrar el flujo completo end-to-end.
   ========================================================================= */

   const chat = document.getElementById('chat');
   const composer = document.getElementById('composer');
   const userInput = document.getElementById('userInput');
   const sendBtn = document.getElementById('sendBtn');
   const gearBtn = document.getElementById('gearBtn');
   const settingsPanel = document.getElementById('settingsPanel');
   const webhookInput = document.getElementById('webhookUrl');
   const saveWebhook = document.getElementById('saveWebhook');
   const modeNote = document.getElementById('modeNote');
 
   let webhookUrl = 'https://monthly-zipfile-pessimism.ngrok-free.dev/webhook/966b370a-d9da-4a35-aaba-55d7673acae6';
   let sessionId = 'sess-' + Math.random().toString(36).slice(2, 10);
   let emergencyLock = false;
 
   gearBtn.addEventListener('click', () => {
     const open = settingsPanel.classList.toggle('open');
     gearBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
   });
 
   saveWebhook.addEventListener('click', () => {
     webhookUrl = webhookInput.value.trim();
     modeNote.textContent = webhookUrl
       ? 'Conectado a: ' + webhookUrl + ' — si la petición falla, se usará el modo de demostración como respaldo.'
       : 'Sin URL configurada: la demo usa un clasificador de prueba en el navegador para simular el triaje y la búsqueda RAG.';
   });
 
   function scrollToBottom(){
     chat.scrollTop = chat.scrollHeight;
   }
 
   function addUserMessage(text){
     const div = document.createElement('div');
     div.className = 'msg user';
     div.textContent = text;
     chat.appendChild(div);
     scrollToBottom();
   }
 
   function addBotMessage(text){
     const div = document.createElement('div');
     div.className = 'msg bot';
     div.textContent = text;
     chat.appendChild(div);
     scrollToBottom();
   }
 
   function addDisclaimer(){
     const div = document.createElement('div');
     div.className = 'disclaimer';
     div.textContent = 'Esta respuesta es solo una guía informativa y no reemplaza la valoración de un médico o farmacéutico.';
     chat.appendChild(div);
     scrollToBottom();
   }
 
   function addProducts(productos){
     if(!productos || !productos.length) return;
     const wrap = document.createElement('div');
     wrap.className = 'products';
     productos.forEach(p => {
       const card = document.createElement('div');
       card.className = 'product-card';
       card.innerHTML = `
         <div class="p-name">${escapeHtml(p.nombre || '')}</div>
         <div class="p-meta">${escapeHtml(p.categoria || '')} · ${escapeHtml(p.indicaciones || '')}</div>
         <div class="p-dose">${escapeHtml(p.dosis_recomendada || '')}</div>
       `;
       wrap.appendChild(card);
     });
     chat.appendChild(wrap);
     scrollToBottom();
   }
 
   function addEmergencyAlert(razon){
     const div = document.createElement('div');
     div.className = 'alert';
     div.setAttribute('role', 'alert');
     div.innerHTML = `
       <div class="a-title"><span class="pulse" aria-hidden="true"></span> Esto suena a una emergencia médica</div>
       <p>No sigas escribiendo en el chat: busca atención médica urgente ahora mismo. Un auxiliar humano también fue notificado.</p>
       <div class="a-reason">Motivo detectado: ${escapeHtml(razon || 'señal de riesgo alto en tu mensaje')}</div>
       <div class="a-actions">
         <a href="tel:123">Llamar al 123</a>
         <a href="tel:911" class="secondary">Llamar al 911</a>
       </div>
     `;
     chat.appendChild(div);
     scrollToBottom();
   }
 
   function addTyping(){
     const div = document.createElement('div');
     div.className = 'typing';
     div.id = 'typingIndicator';
     div.innerHTML = '<span></span><span></span><span></span>';
     chat.appendChild(div);
     scrollToBottom();
     return div;
   }
 
   function removeTyping(node){
     if(node && node.parentNode) node.parentNode.removeChild(node);
   }
 
   function escapeHtml(str){
     const d = document.createElement('div');
     d.textContent = str;
     return d.innerHTML;
   }
 
   function lockComposer(){
     emergencyLock = true;
     composer.classList.add('locked');
     userInput.disabled = true;
     sendBtn.disabled = true;
   }
 
   /* -------------------- Notificación SOS (ruta de emergencia) --------------------
      En producción, este POST lo dispara el propio nodo n8n (HTTP Request →
      Telegram/Twilio/Webhook de emergencia). Aquí solo se deja el punto de
      integración documentado para pruebas locales si se quiere duplicar la
      alerta desde el cliente. */
   async function notifySOS(payload){
     if(!webhookUrl) return;
     try{
       await fetch(webhookUrl.replace(/\/$/, '') + '/sos-log', {
         method: 'POST',
         headers: {'Content-Type': 'application/json'},
         body: JSON.stringify({ session_id: sessionId, ...payload })
       });
     }catch(e){ /* silencioso: el log es de respaldo, no bloquea la UI */ }
   }
 
   /* -------------------- Clasificador de respaldo (modo demo) -------------------- */
   const EMERGENCY_PATTERNS = [
     { kw: ['dolor en el pecho', 'dolor de pecho', 'opresión en el pecho'], razon: 'posible señal cardíaca (dolor u opresión en el pecho)' },
     { kw: ['falta de aire', 'no puedo respirar', 'dificultad para respirar', 'ahogo'], razon: 'dificultad respiratoria aguda' },
     { kw: ['visión borrosa de repente', 'perdida de vision', 'pérdida de visión'], razon: 'alteración visual súbita' },
     { kw: ['convulsion', 'convulsión', 'convulsiones'], razon: 'posible cuadro convulsivo' },
     { kw: ['sangrado abundante', 'hemorragia', 'sangre que no para'], razon: 'sangrado que no cede' },
     { kw: ['desmayo', 'perdida de conciencia', 'pérdida de conciencia'], razon: 'pérdida de conciencia' },
     { kw: ['infarto'], razon: 'sospecha de infarto' },
   ];
 
   const MOCK_CATALOG = [
     { tags: ['dolor de cabeza', 'cefalea', 'migraña'], nombre: 'Acetaminofén 500mg', categoria: 'Analgésico', indicaciones: 'Alivio de dolor leve a moderado y fiebre.', dosis_recomendada: '1 tableta cada 6-8h, máx. 4/día' },
     { tags: ['gripa', 'gripe', 'tos', 'congestión'], nombre: 'Jarabe antigripal', categoria: 'Sistema respiratorio', indicaciones: 'Alivio de síntomas de gripa: tos, congestión y malestar general.', dosis_recomendada: '10ml cada 8h por máx. 5 días' },
     { tags: ['alergia', 'rinitis', 'estornudos', 'picazon'], nombre: 'Loratadina 10mg', categoria: 'Antihistamínico', indicaciones: 'Alivio de síntomas alérgicos: estornudos, picazón, rinitis.', dosis_recomendada: '1 tableta al día' },
     { tags: ['acidez', 'agruras', 'reflujo'], nombre: 'Omeprazol 20mg', categoria: 'Antiácido', indicaciones: 'Alivio de acidez estomacal y reflujo ocasional.', dosis_recomendada: '1 cápsula al día en ayunas' },
     { tags: ['dolor muscular', 'golpe', 'inflamación'], nombre: 'Ibuprofeno 400mg', categoria: 'Antiinflamatorio', indicaciones: 'Dolor muscular, inflamación leve y molestias articulares.', dosis_recomendada: '1 tableta cada 8h con alimentos' },
     { tags: ['diarrea', 'malestar estomacal'], nombre: 'Sales de rehidratación oral', categoria: 'Gastrointestinal', indicaciones: 'Reposición de líquidos y electrolitos en diarrea leve.', dosis_recomendada: '1 sobre disuelto cada episodio' },
   ];
 
   function mockTriage(text){
     const lower = text.toLowerCase();
     for(const p of EMERGENCY_PATTERNS){
       if(p.kw.some(k => lower.includes(k))){
         return {
           es_emergencia: true,
           nivel_riesgo: 'ALTO',
           razon: p.razon,
           respuesta: ''
         };
       }
     }
     // Ruta comercial simulada: similitud por coincidencia de tags (proxy de coseno)
     const scored = MOCK_CATALOG.map(item => {
       const score = item.tags.reduce((acc, tag) => acc + (lower.includes(tag) ? 1 : 0), 0);
       return { item, score };
     }).sort((a, b) => b.score - a.score);
 
     const matched = scored.filter(s => s.score > 0).slice(0, 3);
     const top = matched.length ? matched : scored.slice(0, 3);
 
     return {
       es_emergencia: false,
       nivel_riesgo: 'BAJO',
       razon: 'sin señales de alerta detectadas',
       respuesta: matched.length
         ? 'Según lo que describes, estas opciones de venta libre podrían ayudarte con síntomas leves:'
         : 'No identifiqué síntomas específicos, pero aquí tienes algunas opciones frecuentes de venta libre. Cuéntame más para afinar la recomendación:',
       productos: top.map(s => ({
         nombre: s.item.nombre,
         categoria: s.item.categoria,
         indicaciones: s.item.indicaciones,
         dosis_recomendada: s.item.dosis_recomendada
       }))
     };
   }
 
   async function callBackend(text){
     if(webhookUrl){
       try{
         const res = await fetch(webhookUrl, {
           method: 'POST',
           headers: {'Content-Type': 'application/json'},
           body: JSON.stringify({ message: text, session_id: sessionId })
         });
         if(!res.ok) throw new Error('respuesta no OK');
         return await res.json();
       }catch(e){
         console.warn('No se pudo contactar el webhook n8n, usando modo demo:', e);
         return mockTriage(text);
       }
     }
     return mockTriage(text);
   }
 
   async function handleSend(text){
     addUserMessage(text);
     userInput.value = '';
     userInput.style.height = 'auto';
 
     const typingNode = addTyping();
     const result = await callBackend(text);
     // pequeña espera para que el indicador de "escribiendo" se sienta natural
     await new Promise(r => setTimeout(r, 450));
     removeTyping(typingNode);
 
     if(result.es_emergencia){
       addEmergencyAlert(result.razon);
       notifySOS({ nivel_riesgo: result.nivel_riesgo, razon: result.razon, mensaje: text });
       lockComposer();
       return;
     }
 
     if(result.respuesta) addBotMessage(result.respuesta);
     addProducts(result.productos);
     if(result.productos && result.productos.length) addDisclaimer();
   }
 
   composer.addEventListener('submit', (e) => {
     e.preventDefault();
     if(emergencyLock) return;
     const text = userInput.value.trim();
     if(!text) return;
     handleSend(text);
   });
 
   userInput.addEventListener('keydown', (e) => {
     if(e.key === 'Enter' && !e.shiftKey){
       e.preventDefault();
       composer.requestSubmit();
     }
   });
 
   userInput.addEventListener('input', () => {
     userInput.style.height = 'auto';
     userInput.style.height = Math.min(userInput.scrollHeight, 90) + 'px';
   });
 
   // Mensaje de bienvenida
   addBotMessage('Hola, soy FarmaBot SOS de FarmaSalud. Cuéntame tu síntoma o qué medicamento de venta libre buscas. Si es una emergencia, te conecto de inmediato con ayuda.');